import { Response } from 'express';
import { AuthRequest } from '../types';
import Order from '../models/Order';
import Invoice from '../models/Invoice';
import Deliverable from '../models/Deliverable';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Contact from '../models/Contact';
import mongoose from 'mongoose';
import User from '../models/User';
import { sendOrderStatusMessage } from '../utils/conversationHelper';

export const adminGetOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query as { status?: string };
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    const data = orders.map((o: any) => ({
      id: o.orderId,
      _id: o._id,
      name: o.name,
      description: o.description,
      status: o.status,
      approvalStatus: o.approvalStatus || 'pending',
      date: o.orderDate?.toISOString?.().split('T')[0],
      amount: o.amount,
      currency: o.currency || 'USD',
      items: o.items || [],
      user: {
        _id: o.userId?._id,
        name: o.userId?.name,
        email: o.userId?.email,
      },
      project: o.projectId,
      conversationId: o.conversationId,
      approvedDate: o.approvedDate,
      rejectedDate: o.rejectedDate,
      rejectionReason: o.rejectionReason,
    }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener pedidos' });
  }
};

export const adminUpdateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'pending' | 'in_progress' | 'shipped' | 'completed' | 'cancelled' };
    if (!status) {
      res.status(400).json({ success: false, message: 'Estado requerido' });
    }
    const order = await Order.findOne({ orderId: id });
    if (!order) {
      res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }
    order.status = status;
    order.history.push({
      date: new Date(),
      status,
      description: `Estado actualizado por admin a ${status}`,
      updatedBy: new mongoose.Types.ObjectId(req.user!.id),
    });
    await order.save();
    res.json({ success: true, message: 'Estado actualizado', data: { id: order.orderId, status: order.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
};

// Admin - Aprobar pedido
export const adminApproveOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id });

    if (!order) {
      res.status(404).json({ success: false, message: 'Pedido no encontrado' });
      return;
    }

    if (order.approvalStatus === 'approved') {
      res.status(400).json({ success: false, message: 'El pedido ya está aprobado' });
      return;
    }

    order.approvalStatus = 'approved';
    order.approvedDate = new Date();
    order.history.push({
      date: new Date(),
      status: 'approved',
      description: 'Pedido aprobado por administrador',
      updatedBy: new mongoose.Types.ObjectId(req.user!.id),
    });

    await order.save();

    // Enviar mensaje automático a la conversación
    if (order.conversationId) {
      await sendOrderStatusMessage(
        order.conversationId,
        order.orderId,
        'approved'
      );
    }

    res.json({
      success: true,
      message: 'Pedido aprobado exitosamente',
      data: { id: order.orderId, approvalStatus: 'approved' },
    });
  } catch (error) {
    console.error('Error approving order:', error);
    res.status(500).json({ success: false, message: 'Error al aprobar pedido' });
  }
};

// Admin - Rechazar pedido
export const adminRejectOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    const order = await Order.findOne({ orderId: id });

    if (!order) {
      res.status(404).json({ success: false, message: 'Pedido no encontrado' });
      return;
    }

    if (order.approvalStatus === 'rejected') {
      res.status(400).json({ success: false, message: 'El pedido ya está rechazado' });
      return;
    }

    order.approvalStatus = 'rejected';
    order.rejectedDate = new Date();
    order.rejectionReason = reason || 'No especificado';
    order.status = 'cancelled';
    order.history.push({
      date: new Date(),
      status: 'rejected',
      description: `Pedido rechazado por administrador${reason ? `: ${reason}` : ''}`,
      updatedBy: new mongoose.Types.ObjectId(req.user!.id),
    });

    await order.save();

    // Enviar mensaje automático a la conversación
    if (order.conversationId) {
      await sendOrderStatusMessage(
        order.conversationId,
        order.orderId,
        'rejected',
        reason
      );
    }

    res.json({
      success: true,
      message: 'Pedido rechazado',
      data: { id: order.orderId, approvalStatus: 'rejected', rejectionReason: reason },
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({ success: false, message: 'Error al rechazar pedido' });
  }
};

export const adminGetInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query as { status?: string };
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    const invoices = await Invoice.find(query)
      .populate('userId', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    const data = invoices.map((i: any) => ({
      id: i.invoiceNumber,
      status: i.status,
      issueDate: i.issueDate?.toISOString?.().split('T')[0],
      dueDate: i.dueDate?.toISOString?.().split('T')[0],
      paidDate: i.paidDate ? i.paidDate.toISOString().split('T')[0] : undefined,
      total: i.total,
      user: i.userId,
      project: i.projectId,
    }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener facturas' });
  }
};

export const adminGetDeliverables = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, projectId } = req.query as { status?: string; projectId?: string };
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (projectId) query.projectId = projectId;
    const list = await Deliverable.find(query)
      .populate('userId', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    const data = list.map((d: any) => ({
      id: d.deliverableId,
      title: d.title,
      description: d.description,
      status: d.status,
      uploadDate: d.uploadDate?.toISOString?.().split('T')[0],
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      fileSize: d.fileSize,
      type: d.type,
      user: d.userId,
      project: d.projectId,
    }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener entregables' });
  }
};

export const adminCreateInvoiceFromOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id }).lean();
    if (!order) {
      res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }
    const user = await User.findById(order.userId).lean();
    const clientInfo = {
      name: user?.name || 'Cliente',
      email: user?.email || '',
    };
    const items = (order.items || []).map((it: any) => ({
      description: it.name,
      quantity: it.quantity,
      unitPrice: it.price,
      total: it.quantity * it.price,
    }));
    if (!items.length) {
      res.status(400).json({ success: false, message: 'El pedido no tiene ítems válidos' });
    }
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const taxRate = 0.19;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const invoice = new Invoice({
      projectId: order.projectId || undefined,
      userId: order.userId,
      clientInfo,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      currency: 'USD',
      status: 'pending',
      issueDate: new Date(),
      dueDate,
      history: [{
        date: new Date(),
        action: 'created',
        description: `Factura creada desde pedido ${order.orderId}`,
        updatedBy: order.userId,
      }],
    });
    await invoice.save();
    res.status(201).json({
      success: true,
      data: { id: invoice._id, invoiceNumber: invoice.invoiceNumber },
      message: 'Factura creada desde pedido',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear factura desde pedido' });
  }
};

// Admin - Get all conversations
export const adminGetConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query as { status?: string };
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const conversations = await Conversation.find(query)
      .populate('projectId', 'name')
      .populate('orderId', 'name orderId')
      .sort({ updatedAt: -1 })
      .lean();

    const data = conversations.map((conv: any) => {
      const totalUnread = Array.from(conv.unreadCount?.values() || []).reduce((sum: number, count: number) => sum + count, 0);

      return {
        id: conv.conversationId,
        title: conv.title,
        projectId: conv.projectId?._id,
        projectName: conv.projectId?.name,
        orderName: conv.orderId?.name,
        participants: conv.participants.map((p: any) => ({
          name: p.name,
          email: p.email,
          role: p.role,
        })),
        lastMessage: conv.lastMessage?.text || '',
        lastMessageTime: conv.lastMessage?.timestamp || conv.updatedAt,
        totalUnread,
        status: conv.status,
        createdAt: conv.createdAt,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin get conversations error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener conversaciones' });
  }
};

// Admin - Get conversation details with messages
export const adminGetConversationDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOne({ conversationId: id })
      .populate('projectId', 'name description')
      .populate('participants.userId', 'name email avatar')
      .lean();

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversación no encontrada' });
    }

    // Get messages
    const messages = await Message.find({ conversationId: conversation._id })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map((msg: any) => ({
      id: msg.messageId,
      senderId: msg.sender?._id,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      senderAvatar: msg.sender?.avatar,
      content: msg.content,
      type: msg.type,
      attachment: msg.attachment,
      timestamp: msg.createdAt,
      readBy: msg.readBy.map((r: any) => ({
        userId: r.userId,
        readAt: r.readAt,
      })),
    }));

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation.conversationId,
          title: conversation.title,
          projectName: (conversation.projectId as any)?.name,
          participants: conversation.participants,
          status: conversation.status,
          createdAt: conversation.createdAt,
        },
        messages: formattedMessages,
      },
    });
  } catch (error) {
    console.error('Admin get conversation details error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener detalles de conversación' });
  }
};

// Admin - Get all users
export const adminGetUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query as { role?: string; search?: string };
    const query: any = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ created_at: -1 })
      .lean();

    const data = users.map((user: any) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      provider: user.provider,
      avatar: user.avatar,
      lastLogin: user.last_login,
      createdAt: user.created_at,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
};

// Admin - Update user role
export const adminUpdateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role: 'user' | 'admin' | 'manager' | 'developer' };

    if (!role) {
      res.status(400).json({ success: false, message: 'Rol requerido' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin update user role error:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar rol' });
  }
};

// Admin - Get all contacts
export const adminGetContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query as { status?: string };
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ created_at: -1 })
      .lean();

    const data = contacts.map((contact: any) => ({
      id: contact._id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      service: contact.service,
      budget: contact.budget,
      message: contact.message,
      status: contact.status,
      createdAt: contact.created_at,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin get contacts error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener contactos' });
  }
};

// Admin - Update contact status
export const adminUpdateContactStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'new' | 'read' | 'responded' };

    if (!status) {
      res.status(400).json({ success: false, message: 'Estado requerido' });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: {
        id: contact._id,
        status: contact.status,
      },
    });
  } catch (error) {
    console.error('Admin update contact status error:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
};
