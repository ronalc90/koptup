import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/access';
import {
  getInvoices,
  getInvoiceById,
  getInvoicePaymentMethods,
  createInvoice,
  payInvoice,
  cancelInvoice,
  downloadInvoice,
} from '../controllers/invoices.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Facturas de la cuenta (el cliente ve las suyas).
router.get('/', getInvoices as RequestHandler);
// Métodos de pago configurados por el equipo (el portal los muestra en "Cómo pagar").
router.get('/payment-methods', getInvoicePaymentMethods as RequestHandler);
// Emitir, anular y registrar pagos: solo admin o manager (rol leído de la BD).
// La factura queda a nombre del cliente (pedido, proyecto o cliente elegido).
router.post('/', ...requireRole('admin', 'manager'), createInvoice as RequestHandler);
// Detalle y datos para el PDF: cliente dueño o staff (controlador, rol de la BD).
router.get('/:id', getInvoiceById as RequestHandler);
router.get('/:id/download', downloadInvoice as RequestHandler);
router.post('/:id/pay', ...requireRole('admin', 'manager'), payInvoice as RequestHandler);
router.post('/:id/cancel', ...requireRole('admin', 'manager'), cancelInvoice as RequestHandler);

export default router;
