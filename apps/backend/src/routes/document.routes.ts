import { Router, RequestHandler } from 'express';
import {
  uploadDocument,
  getDocuments,
  searchDocumentsBySemantic,
  explainDocumentSimilarity,
  explainDocumentById,
  updateDocument,
  deleteDocument,
  restoreDocument,
  getFolders,
  createFolder,
  getDocumentStats,
} from '../controllers/document.controller';
import { upload, handleUploadError } from '../middleware/upload';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import { aiGate } from '../middleware/ai-gate';

const router = Router();

// Política: autenticado + aislamiento por usuario (cada consulta del
// controlador filtra por el id de la sesión). La sesión se verifica ANTES de
// aceptar archivos (multer) para no escribir en disco peticiones anónimas.
// Las rutas que llaman a la IA pasan por aiGate: tope mensual
// DOCUMENTS_MONTHLY_BUDGET_USD y cupo diario por usuario
// DOCUMENTS_AI_DAILY_LIMIT_PER_USER (middleware/ai-gate.ts).
router.use(authenticate as RequestHandler);

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a document (requires login)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file
 */
router.post(
  '/upload',
  uploadRateLimiter,
  upload.single('file'),
  handleUploadError,
  // Sin cupo de IA el documento se guarda igual, sin análisis (lo dice la respuesta).
  aiGate('documents', { mode: 'degrade' }),
  uploadDocument as RequestHandler
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     tags: [Documents]
 *     summary: Get the documents of the logged-in user
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/', getDocuments as RequestHandler);

/**
 * @swagger
 * /api/documents/search/semantic:
 *   post:
 *     tags: [Documents]
 *     summary: Search documents by semantic meaning (AI)
 *     responses:
 *       200:
 *         description: Similar documents found
 */
router.post('/search/semantic', aiGate('documents'), searchDocumentsBySemantic as RequestHandler);

/**
 * @swagger
 * /api/documents/folders:
 *   get:
 *     tags: [Documents]
 *     summary: Get all folders with document counts
 */
router.get('/folders', getFolders as RequestHandler);

/**
 * @swagger
 * /api/documents/folders:
 *   post:
 *     tags: [Documents]
 *     summary: Create a new folder
 */
router.post('/folders', createFolder as RequestHandler);

/**
 * @swagger
 * /api/documents/stats:
 *   get:
 *     tags: [Documents]
 *     summary: Get document statistics
 */
router.get('/stats', getDocumentStats as RequestHandler);

/**
 * @swagger
 * /api/documents/{id}/explain-similarity:
 *   post:
 *     tags: [Documents]
 *     summary: Explain why a document is similar to a search query
 */
router.post('/:id/explain-similarity', aiGate('documents'), explainDocumentSimilarity as RequestHandler);

/**
 * @swagger
 * /api/documents/{id}/explain:
 *   get:
 *     tags: [Documents]
 *     summary: Get AI explanation of a document
 */
router.get('/:id/explain', aiGate('documents'), explainDocumentById as RequestHandler);

/**
 * @swagger
 * /api/documents/{id}:
 *   patch:
 *     tags: [Documents]
 *     summary: Update document (rename, move folder, favorite). Owner only.
 */
router.patch('/:id', updateDocument as RequestHandler);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Move a document to the trash (or delete it with permanent=true). Owner only.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Document deleted
 *       401:
 *         description: Login required
 *       404:
 *         description: Document not found (or owned by another account)
 */
router.delete('/:id', deleteDocument as RequestHandler);

/**
 * @swagger
 * /api/documents/{id}/restore:
 *   post:
 *     tags: [Documents]
 *     summary: Restore a document from trash
 */
router.post('/:id/restore', restoreDocument as RequestHandler);

export default router;
