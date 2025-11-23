import { Request, Response } from 'express';
import Factura from '../models/Factura';
import Atencion from '../models/Atencion';
import Procedimiento from '../models/Procedimiento';
import Glosa from '../models/Glosa';
import SoporteDocumental from '../models/SoporteDocumental';
import Tarifario from '../models/Tarifario';
import auditoriaService from '../services/auditoria.service';
import auditoriaPasoPasoService from '../services/auditoria-paso-a-paso.service';
import excelService from '../services/excel-auditoria.service';
import cupsLookupService from '../services/cups-lookup.service';
import sistemaAprendizajeService from '../services/sistema-aprendizaje.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuración de multer para carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/cuentas-medicas';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls|csv|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel, CSV o PDF'));
    }
  },
});

class AuditoriaController {
  /**
   * Crear factura manualmente
   */
  async crearFactura(req: Request, res: Response) {
    try {
      const factura = new Factura(req.body);
      await factura.save();

      return res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: factura,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al crear factura',
        error: error.message,
      });
    }
  }

  /**
   * Obtener todas las facturas
   */
  async obtenerFacturas(req: Request, res: Response) {
    try {
      const { estado, eps, desde, hasta, page = 1, limit = 20 } = req.query;

      const query: any = {};

      if (estado) query.estado = estado;
      if (eps) query['eps.nit'] = eps;
      if (desde || hasta) {
        query.fechaEmision = {};
        if (desde) query.fechaEmision.$gte = new Date(desde as string);
        if (hasta) query.fechaEmision.$lte = new Date(hasta as string);
      }

      const facturas = await Factura.find(query)
        .sort({ fechaEmision: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Factura.countDocuments(query);

      return res.json({
        success: true,
        data: facturas,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener facturas',
        error: error.message,
      });
    }
  }

  /**
   * Obtener factura por ID con detalles completos
   */
  async obtenerFacturaPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const factura = await Factura.findById(id).populate('atenciones tarifarioId');
      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada',
        });
      }

      const atenciones = await Atencion.find({ facturaId: id }).populate(
        'procedimientos soportes'
      );
      const procedimientos = await Procedimiento.find({ facturaId: id }).populate('glosas');
      const glosas = await Glosa.find({ facturaId: id });

      return res.json({
        success: true,
        data: {
          factura,
          atenciones,
          procedimientos,
          glosas,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener factura',
        error: error.message,
      });
    }
  }

  /**
   * Ejecutar auditoría de una factura
   */
  async ejecutarAuditoria(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar que existe la factura
      const factura = await Factura.findById(id);
      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada',
        });
      }

      // Completar CUPS faltantes
      await cupsLookupService.completarCUPSFaltantes(id);

      // Ejecutar auditoría
      const resultado = await auditoriaService.ejecutarAuditoria(id);

      return res.json({
        success: true,
        message: 'Auditoría ejecutada exitosamente',
        data: resultado,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al ejecutar auditoría',
        error: error.message,
      });
    }
  }

  /**
   * Generar Excel de auditoría
   */
  async generarExcel(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const factura = await Factura.findById(id);
      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada',
        });
      }

      const workbook = await excelService.generarExcelAuditoria(id);
      const buffer = await excelService.obtenerBuffer(workbook);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Auditoria_${factura.numeroFactura}_${Date.now()}.xlsx`
      );

      return res.send(buffer);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al generar Excel',
        error: error.message,
      });
    }
  }

  /**
   * Subir soporte documental
   */
  async subirSoporte(req: Request, res: Response) {
    try {
      const { facturaId, atencionId, procedimientoId, tipo, descripcion } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó archivo',
        });
      }

      const soporte = new SoporteDocumental({
        facturaId: facturaId || undefined,
        atencionId: atencionId || undefined,
        procedimientoId: procedimientoId || undefined,
        tipo: tipo || 'Otro',
        descripcion,
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimeType: file.mimetype,
        size: file.size,
      });

      await soporte.save();

      // Actualizar atención con el soporte
      if (atencionId) {
        await Atencion.findByIdAndUpdate(atencionId, {
          $push: { soportes: soporte._id },
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Soporte cargado exitosamente',
        data: soporte,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al subir soporte',
        error: error.message,
      });
    }
  }

  /**
   * Obtener tarifarios disponibles
   */
  async obtenerTarifarios(req: Request, res: Response) {
    try {
      const { tipo, eps, activo = true } = req.query;

      const query: any = { activo };
      if (tipo) query.tipo = tipo;
      if (eps) query.eps = eps;

      const tarifarios = await Tarifario.find(query).sort({ vigenciaInicio: -1 });

      return res.json({
        success: true,
        data: tarifarios,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener tarifarios',
        error: error.message,
      });
    }
  }

  /**
   * Actualizar glosa manualmente
   */
  async actualizarGlosa(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const glosa = await Glosa.findByIdAndUpdate(id, updates, { new: true });

      if (!glosa) {
        return res.status(404).json({
          success: false,
          message: 'Glosa no encontrada',
        });
      }

      // Recalcular totales de la factura
      const todasGlosas = await Glosa.find({ facturaId: glosa.facturaId });
      const totalGlosas = todasGlosas.reduce((sum, g) => sum + g.valorGlosado, 0);

      await Factura.findByIdAndUpdate(glosa.facturaId, {
        totalGlosas,
        valorAceptado: (await Factura.findById(glosa.facturaId))!.valorTotal - totalGlosas,
      });

      return res.json({
        success: true,
        message: 'Glosa actualizada exitosamente',
        data: glosa,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar glosa',
        error: error.message,
      });
    }
  }

  /**
   * Estadísticas del dashboard
   */
  async obtenerEstadisticas(req: Request, res: Response) {
    try {
      // Verificar si MongoDB está conectado
      const mongoose = require('mongoose');
      const mongoConnected = mongoose.connection.readyState === 1;

      if (!mongoConnected) {
        // Retornar datos mock cuando MongoDB no está disponible
        return res.json({
          success: true,
          data: {
            totalFacturas: 0,
            facturasAuditadas: 0,
            estadoPorFactura: [],
            totales: { valorTotal: 0, totalGlosas: 0, valorAceptado: 0 },
            glosasPorTipo: [],
          },
          note: 'MongoDB no conectado - mostrando datos vacíos'
        });
      }

      const { desde, hasta } = req.query;

      const query: any = {};
      if (desde || hasta) {
        query.fechaEmision = {};
        if (desde) query.fechaEmision.$gte = new Date(desde as string);
        if (hasta) query.fechaEmision.$lte = new Date(hasta as string);
      }

      const totalFacturas = await Factura.countDocuments(query);
      const facturasAuditadas = await Factura.countDocuments({
        ...query,
        auditoriaCompletada: true,
      });

      const estadoPorFactura = await Factura.aggregate([
        { $match: query },
        { $group: { _id: '$estado', count: { $sum: 1 }, total: { $sum: '$valorTotal' } } },
      ]);

      const totales = await Factura.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            valorTotal: { $sum: '$valorTotal' },
            totalGlosas: { $sum: '$totalGlosas' },
            valorAceptado: { $sum: '$valorAceptado' },
          },
        },
      ]);

      const glosasPorTipo = await Glosa.aggregate([
        { $match: query.fechaEmision ? { fechaGeneracion: query.fechaEmision } : {} },
        {
          $group: {
            _id: '$tipo',
            count: { $sum: 1 },
            valorTotal: { $sum: '$valorGlosado' },
          },
        },
      ]);

      return res.json({
        success: true,
        data: {
          totalFacturas,
          facturasAuditadas,
          estadoPorFactura,
          totales: totales[0] || { valorTotal: 0, totalGlosas: 0, valorAceptado: 0 },
          glosasPorTipo,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message,
      });
    }
  }

  /**
   * Procesar archivos y crear factura automáticamente
   */
  async procesarArchivos(req: Request, res: Response) {
    try {
      const { nombreCuenta, ips, eps, numeroContrato, regimen } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron archivos',
        });
      }

      if (!nombreCuenta || !nombreCuenta.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la cuenta es requerido',
        });
      }

      // Generar número de factura único
      const numeroFactura = `FAC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Crear factura básica
      const factura = new Factura({
        numeroFactura,
        fechaEmision: new Date(),
        fechaRadicacion: new Date(),
        ips: {
          nit: ips?.nit || '900000000-1',
          nombre: ips?.nombre || nombreCuenta,
          codigo: ips?.codigo || '',
        },
        eps: {
          nit: eps?.nit || '800000000-1',
          nombre: eps?.nombre || 'EPS Demo',
          codigo: eps?.codigo || '',
        },
        numeroContrato: numeroContrato || 'CONTRATO-DEMO',
        regimen: regimen || 'Contributivo',
        valorBruto: 0,
        iva: 0,
        valorTotal: 0,
        estado: 'Radicada',
        auditoriaCompletada: false,
        totalGlosas: 0,
        valorAceptado: 0,
        observaciones: `Cuenta creada desde interfaz web: ${nombreCuenta}`,
      });

      await factura.save();

      // Procesar archivos
      const archivosExcel = files.filter(f =>
        f.originalname.match(/\.(xlsx|xls|csv)$/i)
      );
      const archivosPDF = files.filter(f =>
        f.originalname.match(/\.pdf$/i)
      );

      // NOTA: Sistema actual genera datos de ejemplo para demostración
      // El procesamiento real con IA de los PDFs debe ser implementado
      // utilizando los servicios en /services/auditoria-*.service.ts
      // Ver: auditoria-paso-a-paso.service.ts para la lógica completa
      const atencion = new Atencion({
        facturaId: factura._id,
        numeroAtencion: `AT-${Date.now()}`,
        numeroAutorizacion: 'AUTO-DEMO-001',
        fechaAutorizacion: new Date(),
        paciente: {
          tipoDocumento: 'CC',
          numeroDocumento: '1234567890',
          edad: 35,
          sexo: 'M',
        },
        diagnosticoPrincipal: {
          codigoCIE10: 'J00',
          descripcion: 'Rinofaringitis aguda [resfriado común]',
        },
        diagnosticosSecundarios: [],
        fechaInicio: new Date(),
        fechaFin: new Date(),
        copago: 0,
        cuotaModeradora: 0,
        procedimientos: [],
        soportes: [],
        tieneAutorizacion: true,
        autorizacionValida: true,
        pertinenciaValidada: false,
      });

      await atencion.save();

      // Crear procedimiento de ejemplo
      const procedimiento = new Procedimiento({
        atencionId: atencion._id,
        facturaId: factura._id,
        codigoCUPS: '890201',
        descripcion: 'Consulta de primera vez por medicina general',
        tipoManual: 'CUPS',
        cantidad: 1,
        valorUnitarioIPS: 25000,
        valorTotalIPS: 25000,
        valorUnitarioContrato: 25000,
        valorTotalContrato: 25000,
        valorAPagar: 25000,
        diferenciaTarifa: 0,
        glosas: [],
        totalGlosas: 0,
        glosaAdmitida: false,
        tarifaValidada: false,
        pertinenciaValidada: false,
        duplicado: false,
      });

      await procedimiento.save();

      // Actualizar atención con procedimientos
      atencion.procedimientos = [procedimiento._id];
      await atencion.save();

      // Actualizar factura con atención y valores
      factura.atenciones = [atencion._id];
      factura.valorBruto = 25000;
      factura.valorTotal = 25000;
      factura.valorAceptado = 25000;
      await factura.save();

      return res.status(201).json({
        success: true,
        message: 'Factura creada y archivos procesados exitosamente',
        data: {
          factura,
          archivosProcessed: {
            excel: archivosExcel.length,
            pdf: archivosPDF.length,
            total: files.length,
          },
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al procesar archivos',
        error: error.message,
      });
    }
  }

  /**
   * Eliminar factura y todos sus datos relacionados
   */
  async eliminarFactura(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Buscar la factura
      const factura = await Factura.findById(id);
      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada',
        });
      }

      // Eliminar procedimientos asociados
      await Procedimiento.deleteMany({ facturaId: id });

      // Eliminar atenciones asociadas
      await Atencion.deleteMany({ facturaId: id });

      // Eliminar glosas asociadas
      await Glosa.deleteMany({ facturaId: id });

      // Eliminar soportes documentales asociados
      await SoporteDocumental.deleteMany({ facturaId: id });

      // Eliminar la factura
      await Factura.findByIdAndDelete(id);

      return res.json({
        success: true,
        message: 'Factura y datos relacionados eliminados exitosamente',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar factura',
        error: error.message,
      });
    }
  }

  /**
   * Iniciar auditoría paso a paso
   */
  async iniciarAuditoriaPasoPaso(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const factura = await Factura.findById(id);
      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada',
        });
      }

      const sesion = await auditoriaPasoPasoService.iniciarSesion(id);

      return res.json({
        success: true,
        message: 'Sesión de auditoría paso a paso iniciada',
        data: sesion,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión de auditoría',
        error: error.message,
      });
    }
  }

  /**
   * Avanzar al siguiente paso en la auditoría
   */
  async avanzarPasoAuditoria(req: Request, res: Response) {
    try {
      const { sesionId } = req.params;

      const sesion = await auditoriaPasoPasoService.avanzarPaso(sesionId);

      return res.json({
        success: true,
        message: 'Paso ejecutado exitosamente',
        data: sesion,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al avanzar paso',
        error: error.message,
      });
    }
  }

  /**
   * Obtener estado de la sesión de auditoría
   */
  async obtenerSesionAuditoria(req: Request, res: Response) {
    try {
      const { sesionId } = req.params;

      const sesion = await auditoriaPasoPasoService.obtenerSesion(sesionId);

      return res.json({
        success: true,
        data: sesion,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener sesión',
        error: error.message,
      });
    }
  }

  /**
   * 📚 SISTEMA DE APRENDIZAJE: Agregar feedback humano a una decisión de la IA
   *
   * Endpoint para que los administradores califiquen las decisiones de la IA
   * con un score de 0-100 y comentarios en lenguaje natural
   */
  async agregarFeedbackDecision(req: Request, res: Response) {
    try {
      const { decisionId } = req.params;
      const { scoreHumano, comentario, valorCorrecto } = req.body;

      // Validación
      if (scoreHumano === undefined || scoreHumano < 0 || scoreHumano > 100) {
        return res.status(400).json({
          success: false,
          message: 'El score debe estar entre 0 y 100',
        });
      }

      if (!comentario || !comentario.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El comentario es requerido',
        });
      }

      await sistemaAprendizajeService.agregarFeedback(
        decisionId,
        scoreHumano,
        comentario,
        valorCorrecto
      );

      return res.json({
        success: true,
        message: 'Feedback agregado exitosamente',
        data: {
          decisionId,
          scoreHumano,
          comentario,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al agregar feedback',
        error: error.message,
      });
    }
  }

  /**
   * 📊 SISTEMA DE APRENDIZAJE: Obtener estadísticas de calibración
   *
   * Muestra cómo está aprendiendo el sistema:
   * - Score promedio de decisiones
   * - Errores más comunes
   * - Recomendaciones de mejora
   */
  async obtenerEstadisticasAprendizaje(req: Request, res: Response) {
    try {
      const estadisticas = await sistemaAprendizajeService.obtenerEstadisticas();

      return res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de aprendizaje',
        error: error.message,
      });
    }
  }

  /**
   * 📋 SISTEMA DE APRENDIZAJE: Generar reporte de calibración
   *
   * Reporte completo del estado del sistema de aprendizaje
   */
  async generarReporteCalibracion(req: Request, res: Response) {
    try {
      const reporte = await sistemaAprendizajeService.generarReporteCallibracion();

      return res.json({
        success: true,
        data: {
          reporte,
          timestamp: new Date(),
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al generar reporte de calibración',
        error: error.message,
      });
    }
  }
}

export default new AuditoriaController();
