import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/access';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  payInvoice,
  downloadInvoice,
} from '../controllers/invoices.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Invoice routes
router.get('/', getInvoices);
// Emitir facturas: solo admin o manager. Pagar y descargar: dueño o staff (controlador).
router.post('/', ...requireRole('admin', 'manager'), createInvoice);
router.get('/:id', getInvoiceById);
router.post('/:id/pay', payInvoice);
router.get('/:id/download', downloadInvoice);

export default router;
