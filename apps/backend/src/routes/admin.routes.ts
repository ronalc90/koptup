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
  adminReplyConversation,
  adminUpdateConversationStatus,
  adminGetUsers,
  adminUpdateUserRole,
  adminCreateResetLink,
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
// Emite la factura del pedido a nombre del cliente.
router.post('/orders/:id/invoice', adminCreateInvoiceFromOrder);

// Invoices
router.get('/invoices', adminGetInvoices);

// Deliverables
router.get('/deliverables', adminGetDeliverables);

// Conversations: el equipo ve todas, responde al cliente y las archiva o cierra.
router.get('/conversations', adminGetConversations);
router.get('/conversations/:id', adminGetConversationDetails);
router.post('/conversations/:id/messages', adminReplyConversation);
router.patch('/conversations/:id/status', adminUpdateConversationStatus);

// Users
router.get('/users', adminGetUsers);
// Cambiar roles y generar enlaces de restablecimiento: solo admin (un manager
// no puede darse ni dar el rol admin, ni entrar a la cuenta de otra persona).
router.patch('/users/:id/role', ...requireAdmin, adminUpdateUserRole);
router.post('/users/:id/reset-link', ...requireAdmin, adminCreateResetLink);

// Contacts
router.get('/contacts', adminGetContacts);
router.patch('/contacts/:id/status', adminUpdateContactStatus);

export default router;
