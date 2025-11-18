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

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for authenticated user
 * @access  Private
 */
router.get('/', getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
router.post('/', createOrder);

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order
 * @access  Private
 */
router.put('/:id', updateOrder);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.post('/:id/cancel', cancelOrder);

export default router;
