import { Response } from 'express';
import { AuthRequest } from '../types';
import Order from '../models/Order';
import Invoice from '../models/Invoice';
import Deliverable from '../models/Deliverable';
import mongoose from 'mongoose';
import User from '../models/User';

export const adminGetOrders = async (req: AuthRequest, res: Response) => {
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
      name: o.name,
      description: o.description,
      status: o.status,
      date: o.orderDate?.toISOString?.().split('T')[0],
      amount: o.amount,
      user: o.userId,
      project: o.projectId,
    }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener pedidos' });
  }
};

export const adminUpdateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'pending' | 'in_progress' | 'shipped' | 'completed' | 'cancelled' };
    if (!status) {
      return res.status(400).json({ success: false, message: 'Estado requerido' });
    }
    const order = await Order.findOne({ orderId: id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
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

export const adminGetInvoices = async (req: AuthRequest, res: Response) => {
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

export const adminGetDeliverables = async (req: AuthRequest, res: Response) => {
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

export const adminCreateInvoiceFromOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
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
      return res.status(400).json({ success: false, message: 'El pedido no tiene ítems válidos' });
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
