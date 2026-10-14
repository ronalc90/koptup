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
import { aiGate } from '../middleware/ai-gate';

const router = express.Router();

// Política: staff o acceso a la demo /demo/sistema-experto (P4: DemoGrant).
router.use(requireStaffOrDemoAccess('sistema-experto'));

// Procesamiento
// Llaman a la IA: tope mensual HEALTH_MONTHLY_BUDGET_USD y cupo diario por usuario (middleware/ai-gate.ts).
router.post('/procesar', aiGate('health'), procesarConSistemaExperto);
router.post('/generar-excel', aiGate('health'), generarExcelExperto);
router.post('/procesar-y-descargar', aiGate('health'), procesarYDescargarExcel);

// Configuración: leerla es parte de la demo; cambiarla afecta a todos (staff).
router.get('/configuracion', obtenerConfiguracion);
router.put('/configuracion', ...requireStaff, actualizarConfiguracion);

// Estadísticas
router.get('/estadisticas', obtenerEstadisticas);

export default router;
