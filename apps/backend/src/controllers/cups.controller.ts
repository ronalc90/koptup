/**
 * Controlador para Gestión de CUPS y Embeddings
 */

import { Request, Response } from 'express';
import { cupsSisproService } from '../services/cups-sispro.service';
import { embeddingsService } from '../services/embeddings.service';
import { logger } from '../utils/logger';
import path from 'path';

/**
 * POST /api/cups/importar-csv
 * Importa CUPS desde archivo CSV
 */
export async function importarCSV(req: Request, res: Response) {
  try {
    const { rutaArchivo, truncate, batchSize } = req.body;

    if (!rutaArchivo) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere la ruta del archivo CSV',
      });
    }

    logger.info(`Importando CUPS desde CSV: ${rutaArchivo}`);

    const resultado = await cupsSisproService.importarDesdeCSV(rutaArchivo, {
      truncate: truncate || false,
      batchSize: batchSize || 1000,
    });

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error importando CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error importando archivo CSV',
    });
  }
}

/**
 * POST /api/cups/importar-excel
 * Importa CUPS desde archivo Excel
 */
export async function importarExcel(req: Request, res: Response) {
  try {
    const { rutaArchivo, truncate, batchSize, nombreHoja } = req.body;

    if (!rutaArchivo) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere la ruta del archivo Excel',
      });
    }

    logger.info(`Importando CUPS desde Excel: ${rutaArchivo}`);

    const resultado = await cupsSisproService.importarDesdeExcel(rutaArchivo, {
      truncate: truncate || false,
      batchSize: batchSize || 1000,
      nombreHoja: nombreHoja,
    });

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error importando Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error importando archivo Excel',
    });
  }
}

/**
 * GET /api/cups/estadisticas
 * Obtiene estadísticas de CUPS
 */
export async function obtenerEstadisticas(req: Request, res: Response) {
  try {
    const estadisticas = await cupsSisproService.obtenerEstadisticas();

    res.json({
      success: true,
      data: estadisticas,
    });
  } catch (error: any) {
    logger.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * GET /api/cups/incompletos
 * Obtiene CUPS que necesitan actualización
 */
export async function obtenerIncompletos(req: Request, res: Response) {
  try {
    const incompletos = await cupsSisproService.buscarCUPSIncompletos();

    res.json({
      success: true,
      data: {
        total: incompletos.length,
        cups: incompletos,
      },
    });
  } catch (error: any) {
    logger.error('Error obteniendo CUPS incompletos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// ============================================================================
// ENDPOINTS DE EMBEDDINGS
// ============================================================================

/**
 * POST /api/cups/vectorizar
 * Vectoriza todos los CUPS sin embedding
 */
export async function vectorizarCUPS(req: Request, res: Response) {
  try {
    logger.info('Iniciando vectorización de CUPS...');

    // Ejecutar en background
    embeddingsService.vectorizarTodosCUPS().then((resultado) => {
      logger.info(`Vectorización completada: ${resultado.procesados} procesados`);
    });

    res.json({
      success: true,
      message: 'Vectorización iniciada en background',
    });
  } catch (error: any) {
    logger.error('Error iniciando vectorización:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * POST /api/cups/buscar-semantica
 * Búsqueda semántica de CUPS
 */
export async function buscarSemantica(req: Request, res: Response) {
  try {
    const { consulta, limite, umbralSimilaridad, categoria, especialidad } = req.body;

    if (!consulta) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una consulta para búsqueda semántica',
      });
    }

    logger.info(`Búsqueda semántica: "${consulta}"`);

    const resultados = await embeddingsService.buscarSemantica(consulta, {
      limite: limite || 10,
      umbralSimilaridad: umbralSimilaridad || 0.7,
      categoria,
      especialidad,
    });

    res.json({
      success: true,
      data: {
        consulta,
        total: resultados.length,
        resultados,
      },
    });
  } catch (error: any) {
    logger.error('Error en búsqueda semántica:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * POST /api/cups/buscar-similares
 * Busca CUPS similares a uno dado
 */
export async function buscarSimilares(req: Request, res: Response) {
  try {
    const { codigoCUPS, limite, umbralSimilaridad } = req.body;

    if (!codigoCUPS) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un código CUPS',
      });
    }

    const resultados = await embeddingsService.buscarSimilares(codigoCUPS, {
      limite: limite || 10,
      umbralSimilaridad: umbralSimilaridad || 0.75,
    });

    res.json({
      success: true,
      data: {
        codigoCUPS,
        total: resultados.length,
        resultados,
      },
    });
  } catch (error: any) {
    logger.error('Error buscando similares:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * GET /api/cups/estadisticas-vectorizacion
 * Obtiene estadísticas de vectorización
 */
export async function obtenerEstadisticasVectorizacion(req: Request, res: Response) {
  try {
    const estadisticas = await embeddingsService.obtenerEstadisticasVectorizacion();

    res.json({
      success: true,
      data: estadisticas,
    });
  } catch (error: any) {
    logger.error('Error obteniendo estadísticas de vectorización:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * POST /api/cups/revectorizar
 * Re-vectoriza CUPS desactualizados
 */
export async function revectorizarDesactualizados(req: Request, res: Response) {
  try {
    logger.info('Iniciando re-vectorización de CUPS desactualizados...');

    // Ejecutar en background
    embeddingsService.revectorizarDesactualizados().then((resultado) => {
      logger.info(`Re-vectorización completada: ${resultado.procesados} procesados`);
    });

    res.json({
      success: true,
      message: 'Re-vectorización iniciada en background',
    });
  } catch (error: any) {
    logger.error('Error iniciando re-vectorización:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
