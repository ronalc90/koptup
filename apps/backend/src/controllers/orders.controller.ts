import { Request, Response } from 'express';
import { AuthRequest } from '../types';

// Controlador para pedidos/órdenes
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    // Por ahora retornamos datos mock
    // En producción, consultar base de datos
    const orders = [
      {
        id: 'ORD-001',
        name: 'Sistema de gestión de inventario',
        description: 'Desarrollo de sistema completo para gestión de stock',
        status: 'in_progress',
        date: '2025-10-01',
        amount: 3500.00,
        items: 3,
        tracking: 'TRK-123456',
        carrier: 'Entrega digital',
        userId,
      },
      {
        id: 'ORD-002',
        name: 'Aplicación móvil iOS/Android',
        description: 'App nativa para gestión de pedidos',
        status: 'pending',
        date: '2025-10-05',
        amount: 8500.00,
        items: 5,
        tracking: null,
        carrier: null,
        userId,
      },
      {
        id: 'ORD-003',
        name: 'Website corporativo',
        description: 'Sitio web responsive con CMS',
        status: 'shipped',
        date: '2025-09-15',
        amount: 2500.00,
        items: 1,
        tracking: 'TRK-789012',
        carrier: 'Entrega digital',
        userId,
      },
      {
        id: 'ORD-004',
        name: 'Chatbot con IA',
        description: 'Chatbot inteligente para atención al cliente',
        status: 'completed',
        date: '2025-08-20',
        amount: 4200.00,
        items: 2,
        tracking: 'TRK-345678',
        carrier: 'Entrega digital',
        userId,
      },
    ];

    // Filtrar por estado si se proporciona
    const filteredOrders = status && status !== 'all'
      ? orders.filter(order => order.status === status)
      : orders;

    res.json({
      success: true,
      data: filteredOrders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
    });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Mock data
    const order = {
      id,
      name: 'Sistema de gestión de inventario',
      description: 'Desarrollo de sistema completo para gestión de stock',
      status: 'in_progress',
      date: '2025-10-01',
      amount: 3500.00,
      items: [
        { name: 'Backend API', quantity: 1, price: 2000 },
        { name: 'Frontend Dashboard', quantity: 1, price: 1000 },
        { name: 'Base de datos', quantity: 1, price: 500 },
      ],
      tracking: 'TRK-123456',
      carrier: 'Entrega digital',
      userId,
      history: [
        { date: '2025-10-01', status: 'created', description: 'Pedido creado' },
        { date: '2025-10-02', status: 'in_progress', description: 'Desarrollo iniciado' },
      ],
    };

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
    });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const orderData = req.body;

    // Mock creation
    const newOrder = {
      id: `ORD-${Date.now()}`,
      ...orderData,
      userId,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };

    res.status(201).json({
      success: true,
      data: newOrder,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido',
    });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    res.json({
      success: true,
      data: { id, ...updateData },
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar pedido',
    });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

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
