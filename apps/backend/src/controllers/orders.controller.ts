import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import Order from '../models/Order';
import User from '../models/User';
import mongoose from 'mongoose';

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
      date: order.orderDate.toISOString().split('T')[0],
      amount: order.amount,
      items: order.items,
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
    const { name, description, items, projectId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
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

    // Crear pedido
    const newOrder = new Order({
      name,
      description: description || '',
      userId,
      projectId: projectId || null,
      amount,
      currency: 'USD',
      items,
      status: 'pending',
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
      console.error('Error creating order conversation:', error);
      // No fallar la creación del pedido si falla la conversación
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
      },
      message: 'Pedido creado exitosamente',
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido',
    });
  }
};

// Actualizar pedido
export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    // Buscar pedido
    const order = await Order.findOne({ orderId: id });

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
        message: 'No tienes permiso para actualizar este pedido',
      });
      return;
    }

    // Actualizar campos permitidos
    if (updateData.name) order.name = updateData.name;
    if (updateData.description) order.description = updateData.description;
    if (updateData.status) {
      order.status = updateData.status;
      order.history.push({
        date: new Date(),
        status: updateData.status,
        description: `Estado actualizado a ${updateData.status}`,
        updatedBy: new mongoose.Types.ObjectId(userId),
      });
    }

    await order.save();

    res.json({
      success: true,
      data: {
        id: order.orderId,
        name: order.name,
        status: order.status,
      },
      message: 'Pedido actualizado exitosamente',
    });
  } catch (error) {
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
    const order = await Order.findOne({ orderId: id });

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

    // Verificar que el pedido puede ser cancelado
    if (order.status === 'completed' || order.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: `No se puede cancelar un pedido con estado ${order.status}`,
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
