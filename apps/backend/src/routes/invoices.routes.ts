import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/access';
import {
  getInvoices,
  getInvoiceById,
  getInvoicePaymentMethods,
  createInvoice,
  payInvoice,
  downloadInvoice,
} from '../controllers/invoices.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Invoice routes
router.get('/', getInvoices);
// Métodos de pago configurados por el equipo (el portal los muestra en "Pagar").
router.get('/payment-methods', getInvoicePaymentMethods);
// Emitir facturas y registrar pagos: solo admin o manager (rol leído de la BD).
// Descargar: dueño o staff (controlador, rol de la BD).
router.post('/', ...requireRole('admin', 'manager'), createInvoice);
router.get('/:id', getInvoiceById);
router.post('/:id/pay', ...requireRole('admin', 'manager'), payInvoice);
router.get('/:id/download', downloadInvoice);

export default router;
