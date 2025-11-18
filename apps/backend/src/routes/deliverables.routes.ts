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

// All routes require authentication
router.use(authenticate);

// Deliverable routes
router.get('/', getDeliverables);
router.post('/', uploadDeliverable);
router.get('/:id', getDeliverableById);
router.put('/:id', updateDeliverable);
router.post('/:id/approve', approveDeliverable);
router.post('/:id/reject', rejectDeliverable);

export default router;
