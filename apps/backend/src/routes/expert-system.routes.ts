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
import { requireStaff, requireStaffOrDemoAccess } from '../middleware/access';

const router = express.Router();

// Política: staff o acceso a la demo /demo/sistema-experto (P4: DemoGrant).
router.use(requireStaffOrDemoAccess('sistema-experto'));

// Procesamiento
router.post('/procesar', procesarConSistemaExperto);
router.post('/generar-excel', generarExcelExperto);
router.post('/procesar-y-descargar', procesarYDescargarExcel);

// Configuración: leerla es parte de la demo; cambiarla afecta a todos (staff).
router.get('/configuracion', obtenerConfiguracion);
router.put('/configuracion', ...requireStaff, actualizarConfiguracion);

// Estadísticas
router.get('/estadisticas', obtenerEstadisticas);

export default router;
