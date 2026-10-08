/**
 * Controlador para Gestión de CUPS y Embeddings
 */

import { Request, Response } from 'express';
import { cupsSisproService } from '../services/cups-sispro.service';
import { embeddingsService } from '../services/embeddings.service';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Resuelve el archivo a importar SOLO dentro de la carpeta de importación
 * (CUPS_IMPORT_DIR, por defecto `data/imports`). Acepta únicamente un nombre
 * de archivo con la extensión esperada: nada de rutas absolutas, `..` ni
 * subcarpetas. Devuelve null si no es válido o no existe.
 */
export function resolveImportFile(name: unknown, allowedExts: string[]): string | null {
  if (typeof name !== 'string' || name.length === 0 || name.length > 200) return null;
  if (path.basename(name) !== name || name.startsWith('.')) return null;
  if (!allowedExts.includes(path.extname(name).toLowerCase())) return null;
  const dir = path.resolve(process.env.CUPS_IMPORT_DIR || './data/imports');
  const full = path.resolve(dir, name);
  if (!full.startsWith(dir + path.sep)) return null;
  try {
    if (!fs.statSync(full).isFile()) return null;
  } catch {
    return null;
  }
  return full;
}

/**
 * POST /api/cups/importar-csv
 * Importa CUPS desde archivo CSV
 */
export async function importarCSV(req: Request, res: Response) {
  try {
    const { archivo, truncate, batchSize } = req.body;
    const rutaArchivo = resolveImportFile(archivo, ['.csv']);

    if (!rutaArchivo) {
      return res.status(400).json({
        success: false,
        error: 'Indica en "archivo" el nombre de un .csv que exista en la carpeta de importación del servidor',
      });
    }

    logger.info(`Importando CUPS desde CSV: ${path.basename(rutaArchivo)}`);

    const resultado = await cupsSisproService.importarDesdeCSV(rutaArchivo, {
      truncate: truncate === true,
      batchSize: Math.min(Math.max(Number(batchSize) || 1000, 1), 5000),
    });

    return res.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error importando CSV:', error);
    return res.status(500).json({
      success: false,
      error: 'Error importando archivo CSV',
    });
  }
}

/**
 * POST /api/cups/importar-excel
 * Importa CUPS desde archivo Excel
 */
export async function importarExcel(req: Request, res: Response) {
  try {
    const { archivo, truncate, batchSize, nombreHoja } = req.body;
    const rutaArchivo = resolveImportFile(archivo, ['.xlsx', '.xls']);

    if (!rutaArchivo) {
      return res.status(400).json({
        success: false,
        error: 'Indica en "archivo" el nombre de un .xlsx que exista en la carpeta de importación del servidor',
      });
    }

    logger.info(`Importando CUPS desde Excel: ${path.basename(rutaArchivo)}`);

    const resultado = await cupsSisproService.importarDesdeExcel(rutaArchivo, {
      truncate: truncate === true,
      batchSize: Math.min(Math.max(Number(batchSize) || 1000, 1), 5000),
      nombreHoja: typeof nombreHoja === 'string' ? nombreHoja.slice(0, 100) : undefined,
    });

    return res.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error importando Excel:', error);
    return res.status(500).json({
      success: false,
      error: 'Error importando archivo Excel',
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

    return res.json({
      success: true,
      data: estadisticas,
    });
  } catch (error: any) {
    logger.error('Error obteniendo estadísticas:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: {
        total: incompletos.length,
        cups: incompletos,
      },
    });
  } catch (error: any) {
    logger.error('Error obteniendo CUPS incompletos:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      message: 'Vectorización iniciada en background',
    });
  } catch (error: any) {
    logger.error('Error iniciando vectorización:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: {
        consulta,
        total: resultados.length,
        resultados,
      },
    });
  } catch (error: any) {
    logger.error('Error en búsqueda semántica:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: {
        codigoCUPS,
        total: resultados.length,
        resultados,
      },
    });
  } catch (error: any) {
    logger.error('Error buscando similares:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: estadisticas,
    });
  } catch (error: any) {
    logger.error('Error obteniendo estadísticas de vectorización:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      message: 'Re-vectorización iniciada en background',
    });
  } catch (error: any) {
    logger.error('Error iniciando re-vectorización:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
