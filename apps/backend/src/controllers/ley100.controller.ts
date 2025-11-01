import { Request, Response } from 'express';
import { DocumentoLey100 } from '../models/DocumentoLey100';
import { logger } from '../utils/logger';

/**
 * Upload Ley100 documents
 * POST /api/ley100/upload
 */
export async function uploadLey100Documents(req: Request, res: Response): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    const { tipo, tags, descripcion } = req.body;

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No se enviaron archivos',
      });
      return;
    }

    // Parse tags if provided as comma-separated string
    const parsedTags = tags
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    // Create document records
    const documents = await Promise.all(
      files.map(async (file) => {
        const doc = new DocumentoLey100({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          tipo: tipo || 'normativa',
          tags: parsedTags,
          descripcion,
          userId: (req as any).user?.id,
        });

        await doc.save();
        return doc;
      })
    );

    logger.info(`${documents.length} documento(s) Ley 100 subido(s)`);

    res.status(201).json({
      success: true,
      message: `${documents.length} documento(s) subido(s) correctamente`,
      data: documents.map((doc) => ({
        id: doc.id,
        originalName: doc.originalName,
        tipo: doc.tipo,
        tags: doc.tags,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Error uploading Ley100 documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir documentos',
      error: error.message,
    });
  }
}

/**
 * Get all Ley100 documents
 * GET /api/ley100
 */
export async function getLey100Documents(req: Request, res: Response): Promise<void> {
  try {
    const documents = await DocumentoLey100.find().sort({ createdAt: -1 });

    // Transform _id to id for frontend compatibility
    const transformedDocs = documents.map((doc) => ({
      id: doc._id.toString(),
      originalName: doc.originalName,
      filename: doc.filename,
      tipo: doc.tipo,
      tags: doc.tags,
      size: doc.size,
      enabled: doc.enabled,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: transformedDocs,
    });
  } catch (error: any) {
    logger.error('Error getting Ley100 documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message,
    });
  }
}

/**
 * Delete a Ley100 document
 * DELETE /api/ley100/:id
 */
export async function deleteLey100Document(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        message: 'ID de documento inválido',
      });
      return;
    }

    const document = await DocumentoLey100.findByIdAndDelete(id);

    if (!document) {
      res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
      });
      return;
    }

    // Optionally delete file from disk
    try {
      const fs = await import('fs/promises');
      await fs.unlink(document.path);
      logger.info(`Archivo físico eliminado: ${document.path}`);
    } catch (fileError: any) {
      logger.warn(`No se pudo eliminar el archivo físico: ${fileError.message}`);
    }

    logger.info(`Documento Ley100 eliminado: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Documento eliminado correctamente',
    });
  } catch (error: any) {
    logger.error('Error deleting Ley100 document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar documento',
      error: error.message,
    });
  }
}

/**
 * Toggle Ley100 document enabled status
 * PATCH /api/ley100/:id/toggle
 */
export async function toggleLey100Enabled(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        message: 'ID de documento inválido',
      });
      return;
    }

    const document = await DocumentoLey100.findById(id);

    if (!document) {
      res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
      });
      return;
    }

    // Toggle enabled status
    document.enabled = !document.enabled;
    await document.save();

    logger.info(`Documento Ley100 ${document.enabled ? 'habilitado' : 'deshabilitado'}: ${id}`);

    res.status(200).json({
      success: true,
      message: `Documento ${document.enabled ? 'habilitado' : 'deshabilitado'} correctamente`,
      data: {
        id: document.id,
        enabled: document.enabled,
      },
    });
  } catch (error: any) {
    logger.error('Error toggling Ley100 document enabled status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del documento',
      error: error.message,
    });
  }
}
