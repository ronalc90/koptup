import { Router, RequestHandler } from 'express';
import { uploadDocument, getDocuments, deleteDocument } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';
import { upload, handleUploadError } from '../middleware/upload';
import { uploadRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a document
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/upload',
  authenticate,
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
 *     summary: Get user documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getDocuments as RequestHandler);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete a document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
router.delete('/:id', authenticate, deleteDocument as RequestHandler);

export default router;
