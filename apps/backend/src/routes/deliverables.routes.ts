import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDeliverables,
  getDeliverableById,
  uploadDeliverable,
  updateDeliverable,
  approveDeliverable,
  rejectDeliverable,
} from '../controllers/deliverables.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/deliverables
 * @desc    Get all deliverables for authenticated user
 * @access  Private
 */
router.get('/', getDeliverables);

/**
 * @route   GET /api/deliverables/:id
 * @desc    Get deliverable by ID
 * @access  Private
 */
router.get('/:id', getDeliverableById);

/**
 * @route   POST /api/deliverables
 * @desc    Upload new deliverable
 * @access  Private
 */
router.post('/', uploadDeliverable);

/**
 * @route   PUT /api/deliverables/:id
 * @desc    Update deliverable
 * @access  Private
 */
router.put('/:id', updateDeliverable);

/**
 * @route   POST /api/deliverables/:id/approve
 * @desc    Approve deliverable
 * @access  Private
 */
router.post('/:id/approve', approveDeliverable);

/**
 * @route   POST /api/deliverables/:id/reject
 * @desc    Reject deliverable
 * @access  Private
 */
router.post('/:id/reject', rejectDeliverable);

export default router;
