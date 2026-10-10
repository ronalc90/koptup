import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadOrderFiles, handleUploadError } from '../middleware/upload';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  downloadOrderAttachment,
} from '../controllers/orders.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Order routes
router.get('/', getOrders);
router.post('/', uploadOrderFiles.array('attachments', 10), handleUploadError, createOrder);
router.get('/:id', getOrderById);
// Descarga de un adjunto: dueño del pedido o equipo de KopTup.
router.get('/:id/attachments/:attachmentId', downloadOrderAttachment);
// El dueño edita nombre, descripción y adjuntos mientras el pedido está
// pendiente de revisión, y puede cancelarlo; el estado lo cambia solo el equipo
// (/api/admin/orders).
router.put('/:id', uploadOrderFiles.array('attachments', 10), handleUploadError, updateOrder);
router.post('/:id/cancel', cancelOrder);

export default router;
