import { Response } from 'express';
import { AuthRequest } from '../types';
import { isStaffSession } from '../middleware/access';
import Invoice from '../models/Invoice';
// Registra los modelos que usa populate().
import '../models/Project';
import '../models/User';
import mongoose from 'mongoose';
import { getCommerceSettings } from '../services/commerce-settings.service';

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, startDate, endDate } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const query: any = { userId };
    if (status && status !== 'all') query.status = status;
    if (startDate) query.issueDate = { $gte: new Date(startDate as string) };
    if (endDate) {
      query.issueDate = query.issueDate || {};
      query.issueDate.$lte = new Date(endDate as string);
    }

    const invoices = await Invoice.find(query)
      .populate('projectId', 'name')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const formattedInvoices = invoices.map((inv: any) => ({
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      projectId: inv.projectId?._id,
      projectName: inv.projectId?.name || 'Sin proyecto',
      clientName: inv.clientInfo?.name || inv.userId?.name,
      clientEmail: inv.clientInfo?.email || inv.userId?.email,
      status: inv.status,
      issueDate: inv.issueDate.toISOString().split('T')[0],
      dueDate: inv.dueDate.toISOString().split('T')[0],
      paidDate: inv.paidDate ? inv.paidDate.toISOString().split('T')[0] : null,
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      total: inv.total,
      currency: inv.currency,
      items: inv.items,
    }));

    res.json({ success: true, data: formattedInvoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener facturas' });
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    const invoice = await Invoice.findById(id)
      .populate('projectId', 'name description')
      .populate('userId', 'name email')
      .lean();

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    if (invoice.userId._id.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'No tienes permiso para ver esta factura' });
      return;
    }

    const formattedInvoice = {
      ...invoice,
      issueDate: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      paidDate: invoice.paidDate ? invoice.paidDate.toISOString().split('T')[0] : null,
    };

    res.json({ success: true, data: formattedInvoice });
  } catch (error) {
    console.error('Get invoice by id error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener factura' });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { projectId, clientInfo, items, taxRate, dueDate, notes, terms } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (!projectId || !clientInfo || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Datos requeridos faltantes' });
      return;
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const taxAmount = subtotal * (taxRate || 0.19);
    const total = subtotal + taxAmount;

    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const newInvoice = new Invoice({
      projectId,
      userId,
      clientInfo,
      items,
      subtotal,
      taxRate: taxRate || 0.19,
      taxAmount,
      total,
      currency: 'USD',
      status: 'pending',
      issueDate: new Date(),
      dueDate: calculatedDueDate,
      notes,
      terms,
      history: [{
        date: new Date(),
        action: 'created',
        description: 'Factura creada',
        updatedBy: userId,
      }],
    });

    await newInvoice.save();
    res.status(201).json({ success: true, data: { id: newInvoice._id, invoiceNumber: newInvoice.invoiceNumber }, message: 'Factura creada exitosamente' });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ success: false, message: 'Error al crear factura' });
  }
};

/**
 * POST /api/invoices/:id/pay — registra el pago de una factura. Solo el equipo
 * (admin o manager, rol leído de la BD en la ruta) lo hace, después de
 * confirmar el pago por el medio real (transferencia, enlace). El cliente no
 * marca sus facturas como pagadas: en el portal ve los métodos de pago
 * configurados (GET /api/invoices/payment-methods).
 */
export const payInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { paymentMethod, transactionId } = req.body ?? {};

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (!paymentMethod || typeof paymentMethod !== 'string') {
      res.status(400).json({ success: false, message: 'Método de pago requerido' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    if (invoice.status === 'paid') {
      res.status(400).json({ success: false, message: 'La factura ya está pagada' });
      return;
    }

    invoice.status = 'paid';
    invoice.paidDate = new Date();
    invoice.paymentMethod = paymentMethod.slice(0, 60);
    invoice.transactionId = typeof transactionId === 'string' && transactionId.trim() ? transactionId.trim().slice(0, 120) : `TXN-${Date.now()}`;
    invoice.history.push({
      date: new Date(),
      action: 'paid',
      description: 'Pago registrado por el equipo',
      amount: invoice.total,
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    await invoice.save();
    res.json({ success: true, message: 'Pago registrado' });
  } catch (error) {
    console.error('Pay invoice error:', error);
    res.status(500).json({ success: false, message: 'Error al registrar el pago' });
  }
};

/**
 * GET /api/invoices/payment-methods — métodos de pago reales que el equipo
 * configuró (Admin › Configuración). Hoy: las instrucciones de transferencia.
 * Si no hay ninguno, `metodos` viene vacío y el portal no ofrece "Pagar".
 */
export const getInvoicePaymentMethods = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getCommerceSettings();
    const instrucciones = settings.instruccionesTransferencia.trim();
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      data: {
        metodos: instrucciones ? [{ tipo: 'transferencia' as const, instrucciones }] : [],
      },
    });
  } catch (error) {
    console.error('Get invoice payment methods error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los métodos de pago' });
  }
};

export const downloadInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    // Dueño de la factura o staff (rol vigente en la BD).
    if (invoice.userId.toString() !== userId.toString() && !(await isStaffSession(req))) {
      res.status(403).json({ success: false, message: 'No tienes permiso para descargar esta factura' });
      return;
    }

    const downloadUrl = `${process.env.API_URL || 'http://localhost:3001'}/api/invoices/${id}/download`;

    res.json({
      success: true,
      data: {
        id,
        downloadUrl,
        fileName: `invoice-${invoice.invoiceNumber}.pdf`,
        expiresIn: 3600,
      },
      message: 'Link de descarga generado exitosamente',
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ success: false, message: 'Error al generar link de descarga' });
  }
};
