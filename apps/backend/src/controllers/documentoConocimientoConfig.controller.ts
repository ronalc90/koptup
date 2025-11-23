import { Request, Response } from 'express';
import DocumentoConocimientoConfig from '../models/DocumentoConocimientoConfig';

/**
 * Obtener la configuración de todos los documentos de conocimiento
 */
export const getConfiguracion = async (req: Request, res: Response) => {
  try {
    const configuraciones = await DocumentoConocimientoConfig.find({});

    // Si no hay configuraciones, retornar valores por defecto
    if (configuraciones.length === 0) {
      return res.json([]);
    }

    res.json(configuraciones);
  } catch (error: any) {
    console.error('Error al obtener configuración de documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de documentos',
      error: error.message,
    });
  }
};

/**
 * Actualizar el estado activo/inactivo de un documento
 */
export const toggleDocumento = async (req: Request, res: Response) => {
  try {
    const { documento_id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El campo "activo" debe ser un valor booleano',
      });
    }

    // Buscar o crear la configuración del documento
    let config = await DocumentoConocimientoConfig.findOne({ documento_id });

    if (config) {
      // Actualizar configuración existente
      config.activo = activo;
      config.updated_at = new Date();
      await config.save();
    } else {
      // Crear nueva configuración
      config = await DocumentoConocimientoConfig.create({
        documento_id,
        activo,
      });
    }

    res.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data: config,
    });
  } catch (error: any) {
    console.error('Error al actualizar configuración de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración de documento',
      error: error.message,
    });
  }
};

/**
 * Inicializar configuraciones por defecto
 */
export const inicializarConfiguraciones = async (req: Request, res: Response) => {
  try {
    const documentosPorDefecto = [
      { documento_id: 'cups', activo: true },
      { documento_id: 'cie10', activo: true },
      { documento_id: 'soat', activo: true },
      { documento_id: 'iss', activo: true },
      { documento_id: 'medicamentos', activo: true },
      { documento_id: 'contrato_salud_total', activo: false },
      { documento_id: 'contrato_nueva_eps', activo: true }, // Solo Nueva EPS activo por defecto
      { documento_id: 'contrato_compensar', activo: false },
      { documento_id: 'ley100', activo: true },
      { documento_id: 'resolucion_3047', activo: true },
      { documento_id: 'guias_practica', activo: true },
    ];

    // Verificar cuáles ya existen
    const existentes = await DocumentoConocimientoConfig.find({});
    const existentesIds = existentes.map(e => e.documento_id);

    // Crear solo los que no existen
    const nuevos = documentosPorDefecto.filter(
      doc => !existentesIds.includes(doc.documento_id)
    );

    if (nuevos.length > 0) {
      await DocumentoConocimientoConfig.insertMany(nuevos);
    }

    const todasConfiguraciones = await DocumentoConocimientoConfig.find({});

    res.json({
      success: true,
      message: `Configuraciones inicializadas. Se crearon ${nuevos.length} nuevas configuraciones.`,
      data: todasConfiguraciones,
    });
  } catch (error: any) {
    console.error('Error al inicializar configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al inicializar configuraciones',
      error: error.message,
    });
  }
};

/**
 * Resetear todas las configuraciones a valores por defecto
 */
export const resetearConfiguraciones = async (req: Request, res: Response) => {
  try {
    // Eliminar todas las configuraciones existentes
    await DocumentoConocimientoConfig.deleteMany({});

    // Crear configuraciones por defecto
    const documentosPorDefecto = [
      { documento_id: 'cups', activo: true },
      { documento_id: 'cie10', activo: true },
      { documento_id: 'soat', activo: true },
      { documento_id: 'iss', activo: true },
      { documento_id: 'medicamentos', activo: true },
      { documento_id: 'contrato_salud_total', activo: false },
      { documento_id: 'contrato_nueva_eps', activo: true }, // Solo Nueva EPS activo por defecto
      { documento_id: 'contrato_compensar', activo: false },
      { documento_id: 'ley100', activo: true },
      { documento_id: 'resolucion_3047', activo: true },
      { documento_id: 'guias_practica', activo: true },
    ];

    await DocumentoConocimientoConfig.insertMany(documentosPorDefecto);

    const todasConfiguraciones = await DocumentoConocimientoConfig.find({});

    res.json({
      success: true,
      message: 'Configuraciones reseteadas correctamente',
      data: todasConfiguraciones,
    });
  } catch (error: any) {
    console.error('Error al resetear configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear configuraciones',
      error: error.message,
    });
  }
};
