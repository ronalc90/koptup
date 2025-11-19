import { Request, Response } from 'express';
import Factura from '../models/Factura';
import Atencion from '../models/Atencion';
import Procedimiento from '../models/Procedimiento';
import Glosa from '../models/Glosa';
import SoporteDocumental from '../models/SoporteDocumental';
import Tarifario from '../models/Tarifario';
import auditoriaService from '../services/auditoria.service';
import excelService from '../services/excel-auditoria.service';
import cupsLookupService from '../services/cups-lookup.service';
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

      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: factura,
      });
    } catch (error: any) {
      res.status(500).json({
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

      res.json({
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
      res.status(500).json({
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

      res.json({
        success: true,
        data: {
          factura,
          atenciones,
          procedimientos,
          glosas,
        },
      });
    } catch (error: any) {
      res.status(500).json({
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

      res.json({
        success: true,
        message: 'Auditoría ejecutada exitosamente',
        data: resultado,
      });
    } catch (error: any) {
      res.status(500).json({
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

      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({
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

      res.status(201).json({
        success: true,
        message: 'Soporte cargado exitosamente',
        data: soporte,
      });
    } catch (error: any) {
      res.status(500).json({
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

      res.json({
        success: true,
        data: tarifarios,
      });
    } catch (error: any) {
      res.status(500).json({
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

      res.json({
        success: true,
        message: 'Glosa actualizada exitosamente',
        data: glosa,
      });
    } catch (error: any) {
      res.status(500).json({
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

      res.json({
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
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message,
      });
    }
  }
}

export default new AuditoriaController();
