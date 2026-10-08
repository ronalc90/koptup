/**
 * Rutas para Gestión de CUPS y Embeddings
 */

import express from 'express';
import {
  importarCSV,
  importarExcel,
  obtenerEstadisticas,
  obtenerIncompletos,
  vectorizarCUPS,
  buscarSemantica,
  buscarSimilares,
  obtenerEstadisticasVectorizacion,
  revectorizarDesactualizados,
} from '../controllers/cups.controller';
import { requireAdmin, requireStaffOrDemoAccess } from '../middleware/access';

const router = express.Router();

// Lectura y búsqueda: staff o acceso a la demo /demo/sistema-experto.
const demo = requireStaffOrDemoAccess('sistema-experto');

// Tareas de operación (leen archivos del servidor, pueden vaciar la colección
// con `truncate` o gastar cuota de OpenAI): solo administradores, con el rol
// leído de la BD. La importación solo acepta un NOMBRE de archivo dentro de la
// carpeta de importación (CUPS_IMPORT_DIR, por defecto data/imports).
const soloAdmin = requireAdmin;

// Importación de CUPS
router.post('/importar-csv', ...soloAdmin, importarCSV);
router.post('/importar-excel', ...soloAdmin, importarExcel);
router.get('/estadisticas', demo, obtenerEstadisticas);
router.get('/incompletos', demo, obtenerIncompletos);

// Embeddings y búsqueda semántica
router.post('/vectorizar', ...soloAdmin, vectorizarCUPS);
router.post('/buscar-semantica', demo, buscarSemantica);
router.post('/buscar-similares', demo, buscarSimilares);
router.get('/estadisticas-vectorizacion', demo, obtenerEstadisticasVectorizacion);
router.post('/revectorizar', ...soloAdmin, revectorizarDesactualizados);

export default router;
