import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole, requireStaff } from '../middleware/access';
import {
  getConversations,
  getConversationById,
  createConversation,
  sendMessage,
  markAsRead,
  openSupportConversation,
} from '../controllers/messages.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Conversation routes
router.get('/conversations', getConversations);
// Crear conversaciones: solo el equipo (admin, manager o sales; rol de la BD).
router.post('/conversations', ...requireStaff, createConversation);
// El cliente le escribe al equipo (abre su propia conversación).
router.post('/conversations/support', ...requireRole('client', 'user'), openSupportConversation);
router.get('/conversations/:id', getConversationById);
router.post('/conversations/:id/read', markAsRead);

// Message routes
router.post('/send', sendMessage);

export default router;
