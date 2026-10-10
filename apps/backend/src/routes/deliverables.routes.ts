import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/access';
import { handleUploadError, uploadDeliverableFile } from '../middleware/upload';
import {
  getDeliverables,
  getDeliverableById,
  downloadDeliverable,
  uploadDeliverable,
  updateDeliverable,
  approveDeliverable,
  rejectDeliverable,
} from '../controllers/deliverables.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/** Equipo que comparte entregables con los clientes. */
const DELIVERABLE_STAFF = ['admin', 'manager', 'developer'];

// Entregables del cliente que consulta.
router.get('/', getDeliverables as RequestHandler);
// Compartir entregables: equipo de KopTup (archivo en `file` o enlace https en
// `link`); quedan a nombre del cliente del proyecto, que los revisa.
router.post(
  '/',
  ...requireRole(...DELIVERABLE_STAFF),
  uploadDeliverableFile.single('file'),
  handleUploadError,
  uploadDeliverable as RequestHandler,
);
// Dueño (el cliente) o staff (rol leído de la BD en el controlador).
router.get('/:id', getDeliverableById as RequestHandler);
router.get('/:id/download', downloadDeliverable as RequestHandler);
router.put('/:id', ...requireRole(...DELIVERABLE_STAFF), updateDeliverable as RequestHandler);
router.post('/:id/approve', approveDeliverable as RequestHandler);
router.post('/:id/reject', rejectDeliverable as RequestHandler);

export default router;
