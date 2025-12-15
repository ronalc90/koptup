import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  adminGetInvoices,
  adminGetDeliverables,
  adminCreateInvoiceFromOrder,
  adminGetConversations,
  adminGetConversationDetails,
  adminGetUsers,
  adminUpdateUserRole,
  adminGetContacts,
  adminUpdateContactStatus,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, authorize('admin', 'manager'));

// Orders
router.get('/orders', adminGetOrders);
router.patch('/orders/:id/status', adminUpdateOrderStatus);
router.post('/orders/:id/invoice', adminCreateInvoiceFromOrder);

// Invoices
router.get('/invoices', adminGetInvoices);

// Deliverables
router.get('/deliverables', adminGetDeliverables);

// Conversations
router.get('/conversations', adminGetConversations);
router.get('/conversations/:id', adminGetConversationDetails);

// Users
router.get('/users', adminGetUsers);
router.patch('/users/:id/role', adminUpdateUserRole);

// Contacts
router.get('/contacts', adminGetContacts);
router.patch('/contacts/:id/status', adminUpdateContactStatus);

export default router;
