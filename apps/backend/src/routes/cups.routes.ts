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

const router = express.Router();

// Importación de CUPS
router.post('/importar-csv', importarCSV);
router.post('/importar-excel', importarExcel);
router.get('/estadisticas', obtenerEstadisticas);
router.get('/incompletos', obtenerIncompletos);

// Embeddings y búsqueda semántica
router.post('/vectorizar', vectorizarCUPS);
router.post('/buscar-semantica', buscarSemantica);
router.post('/buscar-similares', buscarSimilares);
router.get('/estadisticas-vectorizacion', obtenerEstadisticasVectorizacion);
router.post('/revectorizar', revectorizarDesactualizados);

export default router;
