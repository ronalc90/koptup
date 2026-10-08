import { Router } from 'express';
import { requireAdmin, requireRole } from '../middleware/access';
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  adminApproveOrder,
  adminRejectOrder,
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

// Panel de administración: admin o manager (rol leído de la BD en cada petición).
router.use(...requireRole('admin', 'manager'));

// Orders
router.get('/orders', adminGetOrders);
router.patch('/orders/:id/status', adminUpdateOrderStatus);
router.post('/orders/:id/approve', adminApproveOrder);
router.post('/orders/:id/reject', adminRejectOrder);
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
// Cambiar roles: solo admin (un manager no puede darse ni dar el rol admin).
router.patch('/users/:id/role', ...requireAdmin, adminUpdateUserRole);

// Contacts
router.get('/contacts', adminGetContacts);
router.patch('/contacts/:id/status', adminUpdateContactStatus);

export default router;
