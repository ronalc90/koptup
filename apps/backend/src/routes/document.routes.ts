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

const router = Router();

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a document (Public Demo)
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
  uploadDocument as RequestHandler
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     tags: [Documents]
 *     summary: Get all documents (Public Demo)
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
router.post('/search/semantic', searchDocumentsBySemantic as RequestHandler);

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
router.post('/:id/explain-similarity', explainDocumentSimilarity as RequestHandler);

/**
 * @swagger
 * /api/documents/{id}/explain:
 *   get:
 *     tags: [Documents]
 *     summary: Get AI explanation of a document
 */
router.get('/:id/explain', explainDocumentById as RequestHandler);

/**
 * @swagger
 * /api/documents/{id}:
 *   patch:
 *     tags: [Documents]
 *     summary: Update document (rename, move folder, favorite) - Public
 */
router.patch('/:id', updateDocument as RequestHandler);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete a document (requires PIN 1010)
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
 *       - in: query
 *         name: pin
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 *       403:
 *         description: Invalid PIN
 *       404:
 *         description: Document not found
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
