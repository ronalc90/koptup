import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  payInvoice,
  downloadInvoice,
} from '../controllers/invoices.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices for authenticated user
 * @access  Private
 */
router.get('/', getInvoices);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get('/:id', getInvoiceById);

/**
 * @route   POST /api/invoices
 * @desc    Create new invoice
 * @access  Private
 */
router.post('/', createInvoice);

/**
 * @route   POST /api/invoices/:id/pay
 * @desc    Process invoice payment
 * @access  Private
 */
router.post('/:id/pay', payInvoice);

/**
 * @route   GET /api/invoices/:id/download
 * @desc    Download invoice PDF
 * @access  Private
 */
router.get('/:id/download', downloadInvoice);

export default router;
