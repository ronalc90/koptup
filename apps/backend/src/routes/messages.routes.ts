import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversationById);
router.post('/conversations/:id/read', markAsRead);

// Message routes
router.post('/send', sendMessage);

export default router;
