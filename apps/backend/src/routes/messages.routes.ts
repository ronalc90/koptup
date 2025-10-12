import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getConversations,
  getConversationById,
  sendMessage,
  markAsRead,
} from '../controllers/messages.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for authenticated user
 * @access  Private
 */
router.get('/conversations', getConversations);

/**
 * @route   GET /api/messages/conversations/:id
 * @desc    Get conversation by ID with all messages
 * @access  Private
 */
router.get('/conversations/:id', getConversationById);

/**
 * @route   POST /api/messages/send
 * @desc    Send new message
 * @access  Private
 */
router.post('/send', sendMessage);

/**
 * @route   POST /api/messages/conversations/:id/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.post('/conversations/:id/read', markAsRead);

export default router;
