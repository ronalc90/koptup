import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
} from '../controllers/orders.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Order routes
router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.post('/:id/cancel', cancelOrder);

export default router;
