import { Request, Response } from 'express';
import { CuentaMedica } from '../models/CuentaMedica';
import { logger } from '../utils/logger';
import { procesarCuentaMedicaHibrida } from '../services/cuenta-medica-hybrid.service';
import {
  searchCUPS,
  searchMedicamentos,
  searchDiagnosticos,
  searchMaterialesInsumos,
  calcularTarifaProcedimientos,
  calcularCostoMedicamentos,
} from '../services/medical-search.service';

/**
 * Create a new cuenta médica
 * POST /api/cuentas
 */
export async function createCuenta(req: Request, res: Response): Promise<void> {
  try {
    const { nombre } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'El nombre de la cuenta es requerido',
      });
      return;
    }

    const cuenta = new CuentaMedica({
      nombre: nombre.trim(),
      archivos: [],
      userId: (req as any).user?.id, // Optional if using auth
    });

    await cuenta.save();
    logger.info(`Cuenta médica creada: ${cuenta.id}`);

    res.status(201).json({
      success: true,
      data: {
        id: cuenta.id,
        nombre: cuenta.nombre,
        numFiles: cuenta.archivos.length,
        createdAt: cuenta.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Error creating cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la cuenta médica',
      error: error.message,
    });
  }
}

/**
 * Get all cuentas médicas
 * GET /api/cuentas
 */
export async function getCuentas(req: Request, res: Response): Promise<void> {
  try {
    const cuentas = await CuentaMedica.find().sort({ createdAt: -1 });

    const formattedCuentas = cuentas.map((cuenta) => ({
      id: cuenta.id,
      nombre: cuenta.nombre,
      numFiles: cuenta.archivos.length,
      createdAt: cuenta.createdAt,
      updatedAt: cuenta.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedCuentas,
    });
  } catch (error: any) {
    logger.error('Error getting cuentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las cuentas',
      error: error.message,
    });
  }
}

/**
 * Get a single cuenta by ID
 * GET /api/cuentas/:id
 */
export async function getCuentaById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const cuenta = await CuentaMedica.findById(id);

    if (!cuenta) {
      res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cuenta,
    });
  } catch (error: any) {
    logger.error('Error getting cuenta by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la cuenta',
      error: error.message,
    });
  }
}

/**
 * Delete a cuenta
 * DELETE /api/cuentas/:id
 */
export async function deleteCuenta(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const cuenta = await CuentaMedica.findByIdAndDelete(id);

    if (!cuenta) {
      res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada',
      });
      return;
    }

    // TODO: Optionally delete associated files from disk
    logger.info(`Cuenta médica eliminada: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Cuenta eliminada correctamente',
    });
  } catch (error: any) {
    logger.error('Error deleting cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la cuenta',
      error: error.message,
    });
  }
}

/**
 * Upload files to a cuenta
 * POST /api/cuentas/:id/upload
 */
export async function uploadFilesToCuenta(req: Request, res: Response): Promise<void> {
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

    const cuenta = await CuentaMedica.findById(id);

    if (!cuenta) {
      res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada',
      });
      return;
    }

    // Add files to cuenta
    const newFiles = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      uploadedAt: new Date(),
      processed: false,
      enabled: true,
    }));

    cuenta.archivos.push(...newFiles);
    await cuenta.save();

    logger.info(`${files.length} archivo(s) subido(s) a cuenta ${id}`);

    res.status(200).json({
      success: true,
      message: `${files.length} archivo(s) subido(s) correctamente`,
      data: {
        cuentaId: cuenta.id,
        filesUploaded: newFiles.length,
        totalFiles: cuenta.archivos.length,
      },
    });
  } catch (error: any) {
    logger.error('Error uploading files to cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir archivos',
      error: error.message,
    });
  }
}

/**
 * Delete a file from a cuenta
 * DELETE /api/cuentas/:id/files/:filename
 */
export async function deleteFileFromCuenta(req: Request, res: Response): Promise<void> {
  try {
    const { id, filename } = req.params;

    const cuenta = await CuentaMedica.findById(id);

    if (!cuenta) {
      res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada',
      });
      return;
    }

    // Find the file in the archivos array
    const fileIndex = cuenta.archivos.findIndex((f) => f.filename === filename);

    if (fileIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en la cuenta',
      });
      return;
    }

    const file = cuenta.archivos[fileIndex];

    // Delete file from disk
    try {
      const fs = await import('fs/promises');
      await fs.unlink(file.path);
      logger.info(`Archivo físico eliminado: ${file.path}`);
    } catch (fileError: any) {
      logger.warn(`No se pudo eliminar el archivo físico: ${fileError.message}`);
    }

    // Remove file from array
    cuenta.archivos.splice(fileIndex, 1);
    await cuenta.save();

    logger.info(`Archivo ${filename} eliminado de cuenta ${id}`);

    res.status(200).json({
      success: true,
      message: 'Archivo eliminado correctamente',
      data: {
        cuentaId: cuenta.id,
        remainingFiles: cuenta.archivos.length,
      },
    });
  } catch (error: any) {
    logger.error('Error deleting file from cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el archivo',
      error: error.message,
    });
  }
}

/**
 * Toggle file enabled status
 * PATCH /api/cuentas/:id/files/:filename/toggle
 */
export async function toggleFileEnabled(req: Request, res: Response): Promise<void> {
  try {
    const { id, filename } = req.params;

    const cuenta = await CuentaMedica.findById(id);

    if (!cuenta) {
      res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada',
      });
      return;
    }

    const archivo = cuenta.archivos.find((f) => f.filename === filename);

    if (!archivo) {
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en la cuenta',
      });
      return;
    }

    // Toggle enabled status
    archivo.enabled = !archivo.enabled;
    await cuenta.save();

    logger.info(`Archivo ${filename} ${archivo.enabled ? 'habilitado' : 'deshabilitado'} en cuenta ${id}`);

    res.status(200).json({
      success: true,
      message: `Archivo ${archivo.enabled ? 'habilitado' : 'deshabilitado'} correctamente`,
      data: {
        filename: archivo.filename,
        enabled: archivo.enabled,
      },
    });
  } catch (error: any) {
    logger.error('Error toggling file enabled status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del archivo',
      error: error.message,
    });
  }
}
