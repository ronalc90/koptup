/**
 * Controlador para el Sistema Experto de Auditoría de Cuentas Médicas
 */

import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { sistemaExperto } from '../services/expert-system.service';
import { excelExpertService } from '../services/excel-expert.service';
import { motorReglas } from '../services/expert-rules.service';
import { logger } from '../utils/logger';
import CuentaMedica from '../models/CuentaMedica';

/**
 * POST /api/expert/procesar
 * Procesa una cuenta médica con el sistema experto completo
 */
export async function procesarConSistemaExperto(req: Request, res: Response) {
  try {
    const { cuentaId, nroRadicacion, convenio, manualTarifario } = req.body;

    if (!cuentaId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID de la cuenta médica',
      });
    }

    logger.info(`Procesando cuenta ${cuentaId} con sistema experto...`);

    // Buscar cuenta médica
    const cuenta = await CuentaMedica.findById(cuentaId);
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta médica no encontrada',
      });
    }

    // Verificar que tenga archivos
    if (!cuenta.archivos || cuenta.archivos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'La cuenta no tiene archivos PDF para procesar',
      });
    }

    // Procesar cada archivo PDF
    const resultados = [];

    for (const archivo of cuenta.archivos) {
      if (!archivo.habilitado) {
        logger.info(`Archivo ${archivo.nombreOriginal} deshabilitado, omitiendo...`);
        continue;
      }

      const rutaPDF = archivo.rutaArchivo;

      // Verificar que el archivo existe
      try {
        await fs.access(rutaPDF);
      } catch {
        logger.warn(`Archivo no encontrado: ${rutaPDF}`);
        continue;
      }

      // Procesar con sistema experto
      const resultado = await sistemaExperto.procesarFacturaMedica(rutaPDF, {
        nroRadicacion: nroRadicacion || `RAD-${cuentaId}-${Date.now()}`,
        fechaRadicacion: new Date(),
        convenio: convenio || 'GENERAL',
        manualTarifario: manualTarifario || 'ISS2004',
      });

      resultados.push({
        archivo: archivo.nombreOriginal,
        resultado,
      });
    }

    // Guardar resultados en la cuenta
    cuenta.metadata = {
      ...cuenta.metadata,
      procesadoConSistemaExperto: true,
      fechaProcesamiento: new Date(),
      cantidadGlosas: resultados.reduce((sum, r) => sum + r.resultado.resumen.cantidadGlosas, 0),
    };
    await cuenta.save();

    res.json({
      success: true,
      data: {
        cuentaId,
        resultados,
        resumenGeneral: {
          archivosProces ados: resultados.length,
          totalFacturado: resultados.reduce((sum, r) => sum + r.resultado.resumen.totalFacturado, 0),
          totalGlosado: resultados.reduce((sum, r) => sum + r.resultado.resumen.totalGlosado, 0),
          totalAPagar: resultados.reduce((sum, r) => sum + r.resultado.resumen.totalAPagar, 0),
          totalGlosas: resultados.reduce((sum, r) => sum + r.resultado.resumen.cantidadGlosas, 0),
        },
      },
    });
  } catch (error: any) {
    logger.error('Error procesando con sistema experto:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error procesando cuenta médica',
    });
  }
}

/**
 * POST /api/expert/generar-excel
 * Genera el Excel con las 5 hojas para una cuenta procesada
 */
export async function generarExcelExperto(req: Request, res: Response) {
  try {
    const { cuentaId, nroRadicacion, convenio, manualTarifario } = req.body;

    if (!cuentaId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID de la cuenta médica',
      });
    }

    logger.info(`Generando Excel para cuenta ${cuentaId}...`);

    // Buscar cuenta médica
    const cuenta = await CuentaMedica.findById(cuentaId);
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta médica no encontrada',
      });
    }

    // Procesar archivos y generar resultado
    const archivos = cuenta.archivos.filter((a) => a.habilitado);
    if (archivos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay archivos habilitados para procesar',
      });
    }

    // Procesar primer archivo (o combinar múltiples si es necesario)
    const rutaPDF = archivos[0].rutaArchivo;

    const resultado = await sistemaExperto.procesarFacturaMedica(rutaPDF, {
      nroRadicacion: nroRadicacion || `RAD-${cuentaId}`,
      fechaRadicacion: new Date(),
      convenio: convenio || 'GENERAL',
      manualTarifario: manualTarifario || 'ISS2004',
    });

    // Generar Excel
    const buffer = excelExpertService.generarExcelCompleto(resultado);

    // Configurar headers para descarga
    const nombreArchivo = `Cuenta_${cuenta.numeroCuenta}_${nroRadicacion || cuentaId}_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error: any) {
    logger.error('Error generando Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error generando Excel',
    });
  }
}

/**
 * POST /api/expert/procesar-y-descargar
 * Procesa y descarga el Excel en una sola operación
 */
export async function procesarYDescargarExcel(req: Request, res: Response) {
  try {
    const { cuentaId, nroRadicacion, convenio, manualTarifario } = req.body;

    if (!cuentaId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID de la cuenta médica',
      });
    }

    logger.info(`Procesando y generando Excel para cuenta ${cuentaId}...`);

    // Buscar cuenta
    const cuenta = await CuentaMedica.findById(cuentaId);
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta médica no encontrada',
      });
    }

    // Obtener archivos habilitados
    const archivos = cuenta.archivos.filter((a) => a.habilitado);
    if (archivos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay archivos habilitados para procesar',
      });
    }

    // Procesar
    const rutaPDF = archivos[0].rutaArchivo;
    const resultado = await sistemaExperto.procesarFacturaMedica(rutaPDF, {
      nroRadicacion: nroRadicacion || `RAD-${cuentaId}`,
      fechaRadicacion: new Date(),
      convenio: convenio || 'GENERAL',
      manualTarifario: manualTarifario || 'ISS2004',
    });

    // Generar Excel
    const buffer = excelExpertService.generarExcelCompleto(resultado);

    // Guardar metadatos
    cuenta.metadata = {
      ...cuenta.metadata,
      ultimoProcesamiento: {
        fecha: new Date(),
        sistema: 'EXPERTO',
        totalFacturado: resultado.resumen.totalFacturado,
        totalGlosado: resultado.resumen.totalGlosado,
        totalAPagar: resultado.resumen.totalAPagar,
        cantidadGlosas: resultado.resumen.cantidadGlosas,
      },
    };
    await cuenta.save();

    // Descargar
    const nombreArchivo = `AuditoriaMedica_${cuenta.numeroCuenta}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error: any) {
    logger.error('Error en procesar y descargar:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error procesando cuenta',
    });
  }
}

/**
 * GET /api/expert/configuracion
 * Obtiene la configuración actual del motor de reglas
 */
export async function obtenerConfiguracion(req: Request, res: Response) {
  try {
    const config = motorReglas.obtenerConfiguracion();
    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    logger.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * PUT /api/expert/configuracion
 * Actualiza la configuración del motor de reglas
 */
export async function actualizarConfiguracion(req: Request, res: Response) {
  try {
    const nuevaConfig = req.body;
    motorReglas.actualizarConfiguracion(nuevaConfig);

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: motorReglas.obtenerConfiguracion(),
    });
  } catch (error: any) {
    logger.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * GET /api/expert/estadisticas
 * Obtiene estadísticas generales del sistema experto
 */
export async function obtenerEstadisticas(req: Request, res: Response) {
  try {
    // Contar cuentas procesadas
    const totalCuentas = await CuentaMedica.countDocuments();
    const cuentasProcesadas = await CuentaMedica.countDocuments({
      'metadata.procesadoConSistemaExperto': true,
    });

    // Estadísticas agregadas (esto se puede mejorar con agregación de MongoDB)
    const estadisticas = {
      totalCuentas,
      cuentasProcesadas,
      porcentajeProcesado: totalCuentas > 0 ? (cuentasProcesadas / totalCuentas) * 100 : 0,
      configuracionActual: motorReglas.obtenerConfiguracion(),
    };

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
