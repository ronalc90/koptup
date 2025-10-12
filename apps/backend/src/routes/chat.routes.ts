import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import {
  createSession,
  sendMessage,
  getHistory,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/chat/session:
 *   post:
 *     tags: [Chat]
 *     summary: Create a new chat session
 *     responses:
 *       200:
 *         description: Session created
 */
router.post('/session', createSession as RequestHandler);

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     tags: [Chat]
 *     summary: Send a chat message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - message
 *             properties:
 *               sessionId:
 *                 type: string
 *               message:
 *                 type: string
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Message sent
 */
router.post(
  '/message',
  [
    body('sessionId').notEmpty(),
    body('message').trim().notEmpty(),
  ],
  sendMessage as RequestHandler
);

/**
 * @swagger
 * /api/chat/history/{sessionId}:
 *   get:
 *     tags: [Chat]
 *     summary: Get chat history
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history
 */
router.get('/history/:sessionId', getHistory as RequestHandler);

export default router;
