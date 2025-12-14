import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  adminGetInvoices,
  adminGetDeliverables,
  adminCreateInvoiceFromOrder,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, authorize('admin', 'manager'));

router.get('/orders', adminGetOrders);
router.patch('/orders/:id/status', adminUpdateOrderStatus);
router.post('/orders/:id/invoice', adminCreateInvoiceFromOrder);
router.get('/invoices', adminGetInvoices);
router.get('/deliverables', adminGetDeliverables);

export default router;
