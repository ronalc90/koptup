import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  createOrGetSession,
  uploadDocuments,
  sendMessage,
  getChatbotInfo,
  updateConfig,
  clearMessages,
  clearDocuments,
} from '../controllers/chatbot.controller';

const router = Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chatbot/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'chatbot-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.csv', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, TXT, CSV, DOCX'));
    }
  },
});

// Rutas
router.post('/session', createOrGetSession);
router.post('/upload', upload.array('files', 10), uploadDocuments);
router.post('/message', sendMessage);
router.get('/info/:sessionId', getChatbotInfo);
router.put('/config', updateConfig);
router.delete('/messages/:sessionId', clearMessages);
router.delete('/documents/:sessionId', clearDocuments);

export default router;
