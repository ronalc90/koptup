/**
 * Rutas para el Sistema Experto de Auditoría de Cuentas Médicas
 */

import express from 'express';
import {
  procesarConSistemaExperto,
  generarExcelExperto,
  procesarYDescargarExcel,
  obtenerConfiguracion,
  actualizarConfiguracion,
  obtenerEstadisticas,
} from '../controllers/expert-system.controller';

const router = express.Router();

// Procesamiento
router.post('/procesar', procesarConSistemaExperto);
router.post('/generar-excel', generarExcelExperto);
router.post('/procesar-y-descargar', procesarYDescargarExcel);

// Configuración
router.get('/configuracion', obtenerConfiguracion);
router.put('/configuracion', actualizarConfiguracion);

// Estadísticas
router.get('/estadisticas', obtenerEstadisticas);

export default router;
