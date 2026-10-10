import { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { AuthRequest } from '../types';
import Order from '../models/Order';
import User from '../models/User';
import mongoose from 'mongoose';
import { whatsappService } from '../services/whatsapp.service';
import { logger } from '../utils/logger';
import { sendError } from '../utils/http-error';
import { isStaffSession } from '../middleware/access';

// Obtener todos los pedidos del usuario
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    // Construir query
    const query: any = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Consultar base de datos
    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Formatear respuesta
    const formattedOrders = orders.map((order: any) => ({
      id: order.orderId,
      name: order.name,
      description: order.description,
      status: order.status,
      date: order.orderDate.toISOString().split('T')[0],
      amount: order.amount,
      items: order.items.length,
      tracking: order.tracking,
      carrier: order.carrier,
    }));

    res.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
    });
  }
};

// Obtener pedido por ID
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    // Buscar pedido
    const order = await Order.findOne({ orderId: id })
      .populate('userId', 'name email')
      .populate('projectId', 'name description')
      .lean();

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado',
      });
      return;
    }

    // Verificar que el pedido pertenece al usuario
    if (order.userId._id.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este pedido',
      });
      return;
    }

    // Formatear respuesta
    const formattedOrder = {
      id: order.orderId,
      name: order.name,
      description: order.description,
      status: order.status,
      approvalStatus: order.approvalStatus ?? 'pending',
      // El cliente puede editar o cancelar solo mientras está pendiente de revisión.
      editable: isPendingForClient(order),
      date: order.orderDate.toISOString().split('T')[0],
      amount: order.amount,
      items: order.items,
      attachments: (order.attachments ?? []).map((a: any) => ({ id: a._id, fileName: a.fileName, fileSize: a.fileSize, fileType: a.fileType })),
      tracking: order.tracking,
      carrier: order.carrier,
      userId: order.userId,
      history: order.history,
    };

    res.json({
      success: true,
      data: formattedOrder,
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
    });
  }
};

// Crear nuevo pedido
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    let { name, description, items, projectId, comments } = req.body;
    const files = (req as any).files as Express.Multer.File[];

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    // Si items viene como string (desde FormData), parsearlo
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (error) {
        res.status(400).json({
          success: false,
          message: 'Formato de items inválido',
        });
        return;
      }
    }

    // Validar datos requeridos
    if (!name || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Nombre e items son requeridos',
      });
      return;
    }

    // Calcular monto total
    const amount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.price);
    }, 0);

    // Procesar archivos adjuntos
    const attachments = files ? files.map((file) => ({
      fileName: file.originalname,
      fileUrl: `/uploads/orders/${file.filename}`,
      fileSize: file.size,
      fileType: file.mimetype,
      uploadedAt: new Date(),
    })) : [];

    // Obtener información del usuario
    const user = await User.findById(userId).select('name email');

    // Procesar comentarios iniciales
    const initialComments = comments ? [{
      text: comments,
      userId: new mongoose.Types.ObjectId(userId),
      userName: user?.name || 'Cliente',
      createdAt: new Date(),
    }] : [];

    // Crear pedido
    const newOrder = new Order({
      name,
      description: description || '',
      userId,
      projectId: projectId || null,
      amount,
      currency: 'USD',
      items,
      attachments,
      comments: initialComments,
      status: 'pending',
      approvalStatus: 'pending',
      orderDate: new Date(),
      history: [
        {
          date: new Date(),
          status: 'pending',
          description: 'Pedido creado',
          updatedBy: userId,
        },
      ],
    });

    await newOrder.save();

    // Crear conversación automática entre cliente y admin
    try {
      const { createOrderConversation } = await import('../utils/conversationHelper');
      const conversationId = await createOrderConversation(
        newOrder.orderId,
        newOrder.name,
        new mongoose.Types.ObjectId(userId),
        newOrder.amount,
        newOrder.items
      );

      // Actualizar el pedido con el ID de la conversación
      newOrder.conversationId = conversationId;
      await newOrder.save();
    } catch (error) {
      logger.error('Error creating order conversation:', error);
      // No fallar la creación del pedido si falla la conversación
    }

    // Enviar notificación por WhatsApp al administrador
    try {
      await whatsappService.sendOrderNotification({
        orderId: newOrder.orderId,
        name: newOrder.name,
        clientName: user?.name || 'Cliente',
        clientEmail: user?.email || '',
        amount: newOrder.amount,
        items: newOrder.items,
        hasAttachments: attachments.length > 0,
      });
      logger.info(`Order notification sent for ${newOrder.orderId}`);
    } catch (error) {
      logger.error('Error sending order notification:', error);
      // No fallar la creación del pedido si falla la notificación
    }

    res.status(201).json({
      success: true,
      data: {
        id: newOrder.orderId,
        name: newOrder.name,
        description: newOrder.description,
        status: newOrder.status,
        amount: newOrder.amount,
        date: newOrder.orderDate.toISOString().split('T')[0],
        attachmentsCount: attachments.length,
      },
      message: 'Pedido creado exitosamente',
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido',
    });
  }
};

/**
 * El cliente puede cambiar su pedido solo mientras está pendiente de revisión:
 * estado `pending` y aprobación `pending`. Después de que el equipo lo revisa
 * (aprobado o rechazado) o empieza a trabajarlo, los cambios se piden por
 * mensajes y los hace el equipo desde el panel.
 */
function isPendingForClient(order: { status: string; approvalStatus?: string }): boolean {
  return order.status === 'pending' && (order.approvalStatus ?? 'pending') === 'pending';
}

/** Campos que el dueño puede editar (más los archivos de `attachments`). */
const CLIENT_EDITABLE_FIELDS = new Set(['name', 'description', 'removeAttachments']);
const MAX_ORDER_ATTACHMENTS = 10;

async function discardUploads(files: Express.Multer.File[] | undefined): Promise<void> {
  if (!files?.length) return;
  await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => undefined)));
}

function parseIdList(raw: unknown): string[] | null {
  if (raw === undefined || raw === null || raw === '') return [];
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value) || value.length > MAX_ORDER_ATTACHMENTS || !value.every((v) => typeof v === 'string')) return null;
  return value as string[];
}

/**
 * PUT /api/orders/:id — el dueño edita nombre, descripción y adjuntos de su
 * pedido mientras está pendiente de revisión (multipart: archivos nuevos en
 * `attachments`; `removeAttachments` = ids de adjuntos a quitar). El estado,
 * los ítems, el monto y la aprobación los cambia solo el equipo
 * (PATCH /api/admin/orders/:id/status, approve, reject).
 */
export const updateOrder = async (req: AuthRequest, res: Response) => {
  const files = (req as { files?: Express.Multer.File[] }).files;
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = (req.body ?? {}) as Record<string, unknown>;

    if (!userId) {
      await discardUploads(files);
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    // Buscar pedido
    const order = await Order.findOne({ orderId: String(id) });

    if (!order) {
      await discardUploads(files);
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado',
      });
      return;
    }

    // Verificar permisos
    if (order.userId.toString() !== userId.toString()) {
      await discardUploads(files);
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar este pedido',
      });
      return;
    }

    if ('status' in updateData) {
      await discardUploads(files);
      res.status(403).json({
        success: false,
        code: 'status_team_only',
        message: 'El estado del pedido lo cambia el equipo de KopTup. Si necesitas cancelarlo, usa "Cancelar pedido".',
      });
      return;
    }

    const notAllowed = Object.keys(updateData).filter((k) => !CLIENT_EDITABLE_FIELDS.has(k));
    if (notAllowed.length > 0) {
      await discardUploads(files);
      res.status(400).json({
        success: false,
        code: 'invalid_fields',
        message: 'Solo puedes cambiar el nombre, la descripción y los adjuntos del pedido.',
        fields: notAllowed,
      });
      return;
    }

    if (!isPendingForClient(order)) {
      await discardUploads(files);
      res.status(409).json({
        success: false,
        code: 'order_not_pending',
        message: 'Este pedido ya está en revisión o en curso: escríbenos por Mensajes para pedir cambios.',
      });
      return;
    }

    const { name, description } = updateData;
    if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > 200)) {
      await discardUploads(files);
      res.status(400).json({ success: false, code: 'invalid_name', message: 'Escribe un nombre válido (máximo 200 caracteres).' });
      return;
    }
    if (description !== undefined && (typeof description !== 'string' || description.length > 5000)) {
      await discardUploads(files);
      res.status(400).json({ success: false, code: 'invalid_description', message: 'La descripción puede tener máximo 5000 caracteres.' });
      return;
    }
    const removeIds = parseIdList(updateData.removeAttachments);
    if (removeIds === null) {
      await discardUploads(files);
      res.status(400).json({ success: false, code: 'invalid_attachments', message: 'La lista de adjuntos a quitar no es válida.' });
      return;
    }

    const kept = order.attachments.filter((a: any) => !removeIds.includes(String(a._id)));
    const removed = order.attachments.filter((a: any) => removeIds.includes(String(a._id)));
    const added = (files ?? []).map((file) => ({
      fileName: file.originalname,
      fileUrl: `/uploads/orders/${file.filename}`,
      fileSize: file.size,
      fileType: file.mimetype,
      uploadedAt: new Date(),
    }));
    if (kept.length + added.length > MAX_ORDER_ATTACHMENTS) {
      await discardUploads(files);
      res.status(400).json({ success: false, code: 'too_many_attachments', message: `Un pedido puede tener máximo ${MAX_ORDER_ATTACHMENTS} adjuntos.` });
      return;
    }

    const changes: string[] = [];
    if (typeof name === 'string' && name.trim() !== order.name) {
      order.name = name.trim();
      changes.push('nombre');
    }
    if (typeof description === 'string' && description !== order.description) {
      order.description = description;
      changes.push('descripción');
    }
    if (kept.length !== order.attachments.length || added.length > 0) {
      order.set('attachments', [...kept, ...added]);
      changes.push('adjuntos');
    }

    if (changes.length > 0) {
      order.history.push({
        date: new Date(),
        status: order.status,
        description: `Pedido editado por el cliente (${changes.join(', ')})`,
        updatedBy: new mongoose.Types.ObjectId(userId),
      });
      await order.save();
      // Los adjuntos quitados también salen del disco (solo el nombre del
      // archivo, dentro de la carpeta de pedidos).
      await Promise.all(
        removed.map((a: any) =>
          fs.unlink(path.join('./uploads/orders', path.basename(String(a.fileUrl ?? '')))).catch(() => undefined),
        ),
      );
    }

    res.json({
      success: true,
      data: {
        id: order.orderId,
        name: order.name,
        description: order.description,
        status: order.status,
        attachments: order.attachments.map((a: any) => ({ id: a._id, fileName: a.fileName, fileSize: a.fileSize, fileType: a.fileType })),
      },
      message: changes.length > 0 ? 'Pedido actualizado exitosamente' : 'No hubo cambios',
    });
  } catch (error) {
    await discardUploads(files);
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar pedido',
    });
  }
};

// Cancelar pedido
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    // Buscar pedido
    const order = await Order.findOne({ orderId: String(id) });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado',
      });
      return;
    }

    // Verificar permisos
    if (order.userId.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para cancelar este pedido',
      });
      return;
    }

    // El cliente cancela solo mientras el pedido está pendiente de revisión;
    // después lo cancela el equipo (se pide por Mensajes).
    if (!isPendingForClient(order)) {
      res.status(409).json({
        success: false,
        code: 'order_not_pending',
        message:
          order.status === 'cancelled'
            ? 'Este pedido ya está cancelado.'
            : 'Este pedido ya está en revisión o en curso: escríbenos por Mensajes si necesitas cancelarlo.',
      });
      return;
    }

    // Cancelar pedido
    order.status = 'cancelled';
    order.history.push({
      date: new Date(),
      status: 'cancelled',
      description: 'Pedido cancelado por el usuario',
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    await order.save();

    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar pedido',
    });
  }
};

/**
 * GET /api/orders/:id/attachments/:attachmentId — descarga un adjunto del
 * pedido. Lo pueden bajar el dueño del pedido y el equipo de KopTup (rol leído
 * de la BD). El archivo se sirve siempre como descarga (`Content-Disposition:
 * attachment`), nunca para mostrarse en el navegador.
 */
export const downloadOrderAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, 'unauthorized', 'Inicia sesión para continuar.');
      return;
    }
    const order = await Order.findOne({ orderId: String(req.params.id) }).select('userId attachments').lean();
    if (!order) {
      sendError(res, 404, 'not_found', 'Pedido no encontrado.');
      return;
    }
    const isOwner = String(order.userId) === String(userId);
    if (!isOwner && !(await isStaffSession(req))) {
      sendError(res, 403, 'forbidden', 'No tienes permiso para ver este pedido.');
      return;
    }
    const attachment = (order.attachments ?? []).find((a: any) => String(a._id) === String(req.params.attachmentId));
    const storedName = path.basename(String((attachment as any)?.fileUrl ?? ''));
    if (!attachment || !storedName || storedName === '.' || storedName === '..') {
      sendError(res, 404, 'not_found', 'Este adjunto no existe.');
      return;
    }
    const dir = path.resolve('./uploads/orders');
    const filePath = path.join(dir, storedName);
    try {
      await fs.access(filePath);
    } catch {
      // Sin volumen en Railway, los archivos subidos se borran al redesplegar.
      sendError(res, 410, 'file_unavailable', 'El archivo ya no está disponible en el servidor. Pídele al cliente que lo vuelva a subir.');
      return;
    }
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const downloadName = String((attachment as any).fileName || storedName).replace(/[\r\n"]/g, '_');
    res.download(filePath, downloadName, (err) => {
      if (err && !res.headersSent) sendError(res, 500, 'internal_error', 'No pudimos enviar el archivo. Intenta de nuevo.');
    });
  } catch (error) {
    logger.error('Download order attachment error:', error);
    sendError(res, 500, 'internal_error', 'No pudimos enviar el archivo. Intenta de nuevo.');
  }
};
