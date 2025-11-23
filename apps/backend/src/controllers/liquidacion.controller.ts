import { Request, Response } from 'express';
import { Radicado } from '../models/Radicado';
import liquidacionAutomatizadaService from '../services/liquidacion-automatizada.service';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Crear un nuevo radicado
 * POST /api/liquidacion/radicados
 */
export async function crearRadicado(req: Request, res: Response): Promise<void> {
  try {
    const { numeroRadicado, nit, eps, nombreIPS, valorContratado, creadoPor } = req.body;

    if (!numeroRadicado || !nit || !eps) {
      res.status(400).json({
        success: false,
        message: 'Los campos numeroRadicado, nit y eps son requeridos',
      });
      return;
    }

    // Verificar si ya existe
    const existe = await Radicado.findOne({ numeroRadicado });
    if (existe) {
      res.status(400).json({
        success: false,
        message: `El radicado ${numeroRadicado} ya existe`,
      });
      return;
    }

    const radicado = await liquidacionAutomatizadaService.crearRadicado({
      numeroRadicado: numeroRadicado.trim(),
      nit: nit.trim(),
      eps: eps.trim(),
      nombreIPS: nombreIPS?.trim(),
      creadoPor: creadoPor || 'sistema',
    });

    // Si se proporcionó valor contratado, actualizarlo
    if (valorContratado) {
      radicado.valorContratado = valorContratado;
      await radicado.save();
    }

    res.status(201).json({
      success: true,
      message: 'Radicado creado exitosamente',
      data: {
        id: radicado.id,
        numeroRadicado: radicado.numeroRadicado,
        nit: radicado.nit,
        eps: radicado.eps,
        estado: radicado.estado,
        rango: radicado.rango,
      },
    });
  } catch (error: any) {
    logger.error('Error creando radicado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el radicado',
      error: error.message,
    });
  }
}

/**
 * Obtener todos los radicados
 * GET /api/liquidacion/radicados
 */
export async function obtenerRadicados(req: Request, res: Response): Promise<void> {
  try {
    const { estado, eps, rango, limit = 50, offset = 0 } = req.query;

    const filtro: any = {};

    if (estado) filtro.estado = estado;
    if (eps) filtro.eps = eps;
    if (rango) filtro.rango = parseInt(rango as string);

    const radicados = await Radicado.find(filtro)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await Radicado.countDocuments(filtro);

    const radicadosFormateados = radicados.map((r) => ({
      id: r.id,
      numeroRadicado: r.numeroRadicado,
      nit: r.nit,
      nombreIPS: r.nombreIPS,
      eps: r.eps,
      numeroFactura: r.numeroFactura,
      valorTotal: r.valorTotal,
      rango: r.rango,
      estado: r.estado,
      numDocumentos: r.documentos.length,
      numValidaciones: r.validaciones.length,
      numGlosas: r.glosas?.length || 0,
      excelGenerado: r.liquidacion?.excelGenerado || false,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: radicadosFormateados,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    logger.error('Error obteniendo radicados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener radicados',
      error: error.message,
    });
  }
}

/**
 * Obtener un radicado por ID o número
 * GET /api/liquidacion/radicados/:id
 */
export async function obtenerRadicadoPorId(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Buscar por ID de MongoDB o por número de radicado
    const radicado = await Radicado.findOne({
      $or: [{ _id: id }, { numeroRadicado: id }],
    });

    if (!radicado) {
      res.status(404).json({
        success: false,
        message: 'Radicado no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: radicado,
    });
  } catch (error: any) {
    logger.error('Error obteniendo radicado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el radicado',
      error: error.message,
    });
  }
}

/**
 * Subir documentos a un radicado
 * POST /api/liquidacion/radicados/:id/documentos
 */
export async function subirDocumentos(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No se enviaron archivos',
      });
      return;
    }

    const radicado = await Radicado.findOne({
      $or: [{ _id: id }, { numeroRadicado: id }],
    });

    if (!radicado) {
      res.status(404).json({
        success: false,
        message: 'Radicado no encontrado',
      });
      return;
    }

    // Agregar documentos
    const nuevosDocumentos = files.map((file) => ({
      tipo: this.determinarTipoDocumento(file.originalname),
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      procesado: false,
    }));

    radicado.documentos.push(...nuevosDocumentos);
    await radicado.save();

    logger.info(`📎 ${files.length} documento(s) agregado(s) a radicado ${radicado.numeroRadicado}`);

    res.status(200).json({
      success: true,
      message: `${files.length} documento(s) subido(s) exitosamente`,
      data: {
        radicadoId: radicado.id,
        numDocumentos: radicado.documentos.length,
      },
    });
  } catch (error: any) {
    logger.error('Error subiendo documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir documentos',
      error: error.message,
    });
  }

  // Método auxiliar para determinar tipo de documento
  determinarTipoDocumento(filename: string): 'factura' | 'historia_clinica' | 'autorizacion' | 'soporte' | 'otro' {
    const lower = filename.toLowerCase();

    if (lower.includes('factura') || lower.includes('fact')) {
      return 'factura';
    }
    if (lower.includes('historia') || lower.includes('hc') || lower.includes('clinica')) {
      return 'historia_clinica';
    }
    if (lower.includes('autorizacion') || lower.includes('aut') || lower.includes('permiso')) {
      return 'autorizacion';
    }
    if (lower.includes('soporte') || lower.includes('evolucion') || lower.includes('nota')) {
      return 'soporte';
    }

    return 'otro';
  }
}

/**
 * Ejecutar liquidación automatizada
 * POST /api/liquidacion/radicados/:id/liquidar
 */
export async function liquidarRadicado(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const radicado = await Radicado.findOne({
      $or: [{ _id: id }, { numeroRadicado: id }],
    });

    if (!radicado) {
      res.status(404).json({
        success: false,
        message: 'Radicado no encontrado',
      });
      return;
    }

    logger.info(`🚀 Iniciando liquidación de radicado: ${radicado.numeroRadicado}`);

    const resultado = await liquidacionAutomatizadaService.liquidarRadicado(
      radicado.numeroRadicado
    );

    res.status(200).json({
      success: true,
      message: 'Liquidación completada exitosamente',
      data: {
        radicado: {
          id: resultado.radicado.id,
          numeroRadicado: resultado.radicado.numeroRadicado,
          estado: resultado.radicado.estado,
          rango: resultado.radicado.rango,
        },
        validaciones: resultado.validaciones,
        reglasAplicadas: resultado.reglasAplicadas.reglasAplicadas,
        glosas: resultado.glosas,
        valorFinalAPagar: resultado.valorFinalAPagar,
        valorGlosaTotal: resultado.valorGlosaTotal,
        excelGenerado: resultado.excelGenerado,
        rutaExcel: resultado.rutaExcel,
        mensajes: resultado.mensajes,
      },
    });
  } catch (error: any) {
    logger.error('Error ejecutando liquidación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar la liquidación',
      error: error.message,
    });
  }
}

/**
 * Descargar Excel de liquidación
 * GET /api/liquidacion/radicados/:id/descargar-excel
 */
export async function descargarExcel(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const radicado = await Radicado.findOne({
      $or: [{ _id: id }, { numeroRadicado: id }],
    });

    if (!radicado) {
      res.status(404).json({
        success: false,
        message: 'Radicado no encontrado',
      });
      return;
    }

    if (!radicado.liquidacion?.rutaExcel) {
      res.status(404).json({
        success: false,
        message: 'No se ha generado Excel para este radicado',
      });
      return;
    }

    const rutaArchivo = radicado.liquidacion.rutaExcel;

    logger.info(`📥 Descargando Excel: ${rutaArchivo}`);

    res.download(rutaArchivo, `liquidacion_${radicado.numeroRadicado}.xlsx`, (err) => {
      if (err) {
        logger.error('Error descargando Excel:', err);
        res.status(500).json({
          success: false,
          message: 'Error al descargar el archivo',
        });
      }
    });
  } catch (error: any) {
    logger.error('Error en descarga de Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar Excel',
      error: error.message,
    });
  }
}

/**
 * Eliminar un radicado
 * DELETE /api/liquidacion/radicados/:id
 */
export async function eliminarRadicado(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const radicado = await Radicado.findOne({
      $or: [{ _id: id }, { numeroRadicado: id }],
    });

    if (!radicado) {
      res.status(404).json({
        success: false,
        message: 'Radicado no encontrado',
      });
      return;
    }

    await Radicado.deleteOne({ _id: radicado._id });

    logger.info(`🗑️ Radicado eliminado: ${radicado.numeroRadicado}`);

    res.status(200).json({
      success: true,
      message: 'Radicado eliminado exitosamente',
    });
  } catch (error: any) {
    logger.error('Error eliminando radicado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el radicado',
      error: error.message,
    });
  }
}

/**
 * Obtener estadísticas de liquidación
 * GET /api/liquidacion/estadisticas
 */
export async function obtenerEstadisticas(req: Request, res: Response): Promise<void> {
  try {
    const totalRadicados = await Radicado.countDocuments();
    const porEstado = await Radicado.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
        },
      },
    ]);

    const porRango = await Radicado.aggregate([
      {
        $group: {
          _id: '$rango',
          count: { $sum: 1 },
          valorPromedio: { $avg: '$valorTotal' },
        },
      },
    ]);

    const conGlosas = await Radicado.countDocuments({ 'glosas.0': { $exists: true } });
    const sinGlosas = totalRadicados - conGlosas;

    res.status(200).json({
      success: true,
      data: {
        total: totalRadicados,
        porEstado,
        porRango,
        glosas: {
          conGlosas,
          sinGlosas,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message,
    });
  }
}

export default {
  crearRadicado,
  obtenerRadicados,
  obtenerRadicadoPorId,
  subirDocumentos,
  liquidarRadicado,
  descargarExcel,
  eliminarRadicado,
  obtenerEstadisticas,
};
