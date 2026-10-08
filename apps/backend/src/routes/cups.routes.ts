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
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Tareas de operación (leen archivos del servidor, pueden vaciar la colección
// con `truncate` o gastar cuota de OpenAI): solo administradores.
const soloAdmin = [authenticate, authorize('admin')];

// Importación de CUPS
router.post('/importar-csv', ...soloAdmin, importarCSV);
router.post('/importar-excel', ...soloAdmin, importarExcel);
router.get('/estadisticas', obtenerEstadisticas);
router.get('/incompletos', obtenerIncompletos);

// Embeddings y búsqueda semántica
router.post('/vectorizar', ...soloAdmin, vectorizarCUPS);
router.post('/buscar-semantica', buscarSemantica);
router.post('/buscar-similares', buscarSimilares);
router.get('/estadisticas-vectorizacion', obtenerEstadisticasVectorizacion);
router.post('/revectorizar', ...soloAdmin, revectorizarDesactualizados);

export default router;
