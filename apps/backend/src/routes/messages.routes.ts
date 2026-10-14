import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireStaff } from '../middleware/access';
import {
  getConversations,
  getConversationById,
  createConversation,
  sendMessage,
  markAsRead,
} from '../controllers/messages.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Conversation routes
router.get('/conversations', getConversations);
// Crear conversaciones: solo el equipo (admin, manager o sales; rol de la BD).
router.post('/conversations', ...requireStaff, createConversation);
router.get('/conversations/:id', getConversationById);
router.post('/conversations/:id/read', markAsRead);

// Message routes
router.post('/send', sendMessage);

export default router;
