import { Request, Response } from 'express';
import { CuentaMedica } from '../models/CuentaMedica';
import { extractTextFromPDF, isValidExtractedText } from '../services/pdf.service';
import { extractMedicalDataBatch, MedicalDataExtraction } from '../services/openai.service';
import { generateConsolidatedExcel } from '../services/excel.service';
import { validateBatch } from '../services/validation.service';
import { logger } from '../utils/logger';
import path from 'path';

/**
 * Process selected cuentas and generate Excel
 * POST /api/process
 */
export async function processCuentasAndGenerateExcel(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { cuentaIds } = req.body;

    if (!Array.isArray(cuentaIds) || cuentaIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un ID de cuenta',
      });
      return;
    }

    logger.info(`Processing ${cuentaIds.length} cuenta(s)...`);

    // Fetch all cuentas
    const cuentas = await CuentaMedica.find({ _id: { $in: cuentaIds } });

    if (cuentas.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No se encontraron cuentas válidas',
      });
      return;
    }

    // Extract text from all PDFs
    logger.info('Extracting text from PDFs...');
    const pdfExtractions: Array<{
      text: string;
      cuentaId: string;
      filename: string;
    }> = [];

    for (const cuenta of cuentas) {
      for (const archivo of cuenta.archivos) {
        // Skip disabled files
        if (archivo.enabled === false) {
          logger.info(`Skipping disabled file: ${archivo.originalName}`);
          continue;
        }

        // ALWAYS extract fresh - NO CACHE
        logger.info(`Extracting text from ${archivo.originalName}...`);
        const extracted = await extractTextFromPDF(archivo.path);

        if (isValidExtractedText(extracted)) {
          pdfExtractions.push({
            text: extracted.text,
            cuentaId: cuenta.id,
            filename: archivo.originalName,
          });
        } else {
          logger.warn(
            `Failed to extract valid text from ${archivo.originalName}: ${extracted.error || 'No text found'}`
          );
        }
      }
    }

    if (pdfExtractions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No se pudo extraer texto de ningún PDF',
      });
      return;
    }

    // Extract medical data using OpenAI - ALWAYS FRESH, NO CACHE
    logger.info(`Extracting medical data from ${pdfExtractions.length} PDF(s) using OpenAI...`);
    const medicalExtractions: MedicalDataExtraction[] = [];

    for (const extraction of pdfExtractions) {
      if (extraction.text) {
        try {
          logger.info(`Processing ${extraction.filename} with OpenAI...`);
          const result = await extractMedicalDataBatch(
            [extraction],
            5 // batch size
          );
          medicalExtractions.push(...result);
        } catch (error: any) {
          logger.error(`Error processing ${extraction.filename}:`, error);
        }
      }
    }

    if (medicalExtractions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No se pudo extraer información médica de los PDFs',
      });
      return;
    }

    // Create cuenta name map
    const cuentasMap = new Map<string, string>();
    cuentas.forEach((cuenta) => {
      cuentasMap.set(cuenta.id, cuenta.nombre);
    });

    // Perform validations with RAG
    logger.info('Performing validations and glosa detection...');
    const { allValidations, allGlosas, summary } = await validateBatch(
      medicalExtractions,
      cuentasMap
    );

    // Generate Excel with validations
    logger.info('Generating consolidated Excel file with validations...');
    const excelPath = await generateConsolidatedExcel(
      medicalExtractions,
      cuentasMap,
      allValidations,
      allGlosas
    );

    const filename = path.basename(excelPath);

    res.status(200).json({
      success: true,
      message: 'Procesamiento completado',
      data: {
        totalCuentas: cuentas.length,
        totalPDFs: pdfExtractions.length,
        totalPrestaciones: medicalExtractions.length,
        totalGlosas: summary.totalGlosas,
        glosasAlta: summary.glosasAlta,
        glosaMedia: summary.glosaMedia,
        glosaBaja: summary.glosaBaja,
        downloadUrl: `/export?file=${filename}`,
        filename,
      },
    });
  } catch (error: any) {
    logger.error('Error processing cuentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar las cuentas',
      error: error.message,
    });
  }
}

/**
 * Download/export generated Excel file
 * GET /api/export?file=filename
 */
export async function exportExcelFile(req: Request, res: Response): Promise<void> {
  try {
    const { file } = req.query;

    if (!file || typeof file !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Nombre de archivo no proporcionado',
      });
      return;
    }

    // Security: Only allow files from exports directory
    const exportsDir = path.resolve('./uploads/exports');
    const filePath = path.join(exportsDir, file);

    // Prevent directory traversal
    if (!filePath.startsWith(exportsDir)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado',
      });
      return;
    }

    res.download(filePath, file, (err) => {
      if (err) {
        logger.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            message: 'Archivo no encontrado',
          });
        }
      }
    });
  } catch (error: any) {
    logger.error('Error exporting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar archivo',
      error: error.message,
    });
  }
}
