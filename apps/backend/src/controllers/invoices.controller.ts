import { Response } from 'express';
import { AuthRequest } from '../types';

// Controlador para facturación e invoices
export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, startDate, endDate } = req.query;

    // Mock data - En producción, consultar base de datos
    const invoices = [
      {
        id: 'INV-001',
        invoiceNumber: 'FAC-2025-001',
        projectId: 'PRJ-001',
        projectName: 'Sistema de gestión de inventario',
        clientName: 'Juan Pérez',
        clientEmail: 'juan.perez@example.com',
        status: 'paid',
        issueDate: '2025-09-01',
        dueDate: '2025-09-15',
        paidDate: '2025-09-10',
        amount: 3500.00,
        currency: 'USD',
        taxRate: 0.19,
        taxAmount: 665.00,
        subtotal: 3500.00,
        total: 4165.00,
        items: [
          {
            description: 'Backend API Development',
            quantity: 1,
            unitPrice: 2000.00,
            total: 2000.00,
          },
          {
            description: 'Frontend Dashboard',
            quantity: 1,
            unitPrice: 1000.00,
            total: 1000.00,
          },
          {
            description: 'Database Setup',
            quantity: 1,
            unitPrice: 500.00,
            total: 500.00,
          },
        ],
        userId,
      },
      {
        id: 'INV-002',
        invoiceNumber: 'FAC-2025-002',
        projectId: 'PRJ-002',
        projectName: 'Aplicación móvil iOS/Android',
        clientName: 'María García',
        clientEmail: 'maria.garcia@example.com',
        status: 'pending',
        issueDate: '2025-10-01',
        dueDate: '2025-10-15',
        paidDate: null,
        amount: 4250.00,
        currency: 'USD',
        taxRate: 0.19,
        taxAmount: 807.50,
        subtotal: 4250.00,
        total: 5057.50,
        items: [
          {
            description: 'Mobile App Development - Phase 1',
            quantity: 1,
            unitPrice: 4250.00,
            total: 4250.00,
          },
        ],
        userId,
      },
      {
        id: 'INV-003',
        invoiceNumber: 'FAC-2025-003',
        projectId: 'PRJ-003',
        projectName: 'Website corporativo',
        clientName: 'Carlos López',
        clientEmail: 'carlos.lopez@example.com',
        status: 'overdue',
        issueDate: '2025-09-15',
        dueDate: '2025-09-30',
        paidDate: null,
        amount: 2500.00,
        currency: 'USD',
        taxRate: 0.19,
        taxAmount: 475.00,
        subtotal: 2500.00,
        total: 2975.00,
        items: [
          {
            description: 'Corporate Website Design',
            quantity: 1,
            unitPrice: 1500.00,
            total: 1500.00,
          },
          {
            description: 'CMS Integration',
            quantity: 1,
            unitPrice: 1000.00,
            total: 1000.00,
          },
        ],
        userId,
      },
      {
        id: 'INV-004',
        invoiceNumber: 'FAC-2025-004',
        projectId: 'PRJ-004',
        projectName: 'Chatbot con IA',
        clientName: 'Ana Martínez',
        clientEmail: 'ana.martinez@example.com',
        status: 'paid',
        issueDate: '2025-08-20',
        dueDate: '2025-09-05',
        paidDate: '2025-09-03',
        amount: 4200.00,
        currency: 'USD',
        taxRate: 0.19,
        taxAmount: 798.00,
        subtotal: 4200.00,
        total: 4998.00,
        items: [
          {
            description: 'AI Chatbot Development',
            quantity: 1,
            unitPrice: 3000.00,
            total: 3000.00,
          },
          {
            description: 'Integration & Training',
            quantity: 1,
            unitPrice: 1200.00,
            total: 1200.00,
          },
        ],
        userId,
      },
    ];

    // Filtrar por estado si se proporciona
    let filteredInvoices = invoices;

    if (status && status !== 'all') {
      filteredInvoices = filteredInvoices.filter(
        invoice => invoice.status === status
      );
    }

    // Filtrar por rango de fechas si se proporciona
    if (startDate) {
      filteredInvoices = filteredInvoices.filter(
        invoice => invoice.issueDate >= startDate
      );
    }

    if (endDate) {
      filteredInvoices = filteredInvoices.filter(
        invoice => invoice.issueDate <= endDate
      );
    }

    res.json({
      success: true,
      data: filteredInvoices,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener facturas',
    });
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Mock data
    const invoice = {
      id,
      invoiceNumber: 'FAC-2025-001',
      projectId: 'PRJ-001',
      projectName: 'Sistema de gestión de inventario',
      clientName: 'Juan Pérez',
      clientEmail: 'juan.perez@example.com',
      clientAddress: {
        street: 'Av. Principal 123',
        city: 'Bogotá',
        state: 'Cundinamarca',
        zipCode: '110111',
        country: 'Colombia',
      },
      companyInfo: {
        name: 'Soluciones Tecnológicas KopTup',
        taxId: 'NIT 900.123.456-7',
        address: 'Calle 50 #10-20',
        phone: '+57 1 234 5678',
        email: 'info@koptup.com',
      },
      status: 'paid',
      issueDate: '2025-09-01',
      dueDate: '2025-09-15',
      paidDate: '2025-09-10',
      paymentMethod: 'credit_card',
      amount: 3500.00,
      currency: 'USD',
      taxRate: 0.19,
      taxAmount: 665.00,
      subtotal: 3500.00,
      total: 4165.00,
      items: [
        {
          id: 1,
          description: 'Backend API Development',
          quantity: 1,
          unitPrice: 2000.00,
          total: 2000.00,
        },
        {
          id: 2,
          description: 'Frontend Dashboard',
          quantity: 1,
          unitPrice: 1000.00,
          total: 1000.00,
        },
        {
          id: 3,
          description: 'Database Setup',
          quantity: 1,
          unitPrice: 500.00,
          total: 500.00,
        },
      ],
      notes: 'Gracias por su negocio. Pago recibido exitosamente.',
      terms: 'Pago neto a 15 días. Penalización por mora del 2% mensual.',
      userId,
      history: [
        {
          date: '2025-09-01',
          action: 'created',
          description: 'Factura creada',
        },
        {
          date: '2025-09-10',
          action: 'paid',
          description: 'Pago recibido',
          amount: 4165.00,
        },
      ],
    };

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Get invoice by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener factura',
    });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const invoiceData = req.body;

    // Calcular totales
    const subtotal = invoiceData.items?.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
      0
    ) || 0;

    const taxAmount = subtotal * (invoiceData.taxRate || 0.19);
    const total = subtotal + taxAmount;

    // Mock creation
    const newInvoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: `FAC-2025-${String(Date.now()).slice(-3)}`,
      ...invoiceData,
      userId,
      status: 'pending',
      issueDate: new Date().toISOString().split('T')[0],
      paidDate: null,
      subtotal,
      taxAmount,
      total,
    };

    res.status(201).json({
      success: true,
      data: newInvoice,
      message: 'Factura creada exitosamente',
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear factura',
    });
  }
};

export const payInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId } = req.body;

    if (!paymentMethod) {
      res.status(400).json({
        success: false,
        message: 'Método de pago requerido',
      });
      return;
    }

    // Mock payment processing
    const paidInvoice = {
      id,
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      transactionId: transactionId || `TXN-${Date.now()}`,
    };

    res.json({
      success: true,
      data: paidInvoice,
      message: 'Pago procesado exitosamente',
    });
  } catch (error) {
    console.error('Pay invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar pago',
    });
  }
};

export const downloadInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // En producción, esto generaría un PDF real
    // Por ahora, retornamos una URL mock
    const downloadUrl = `https://example.com/invoices/${id}/download`;

    res.json({
      success: true,
      data: {
        id,
        downloadUrl,
        fileName: `invoice-${id}.pdf`,
        expiresIn: 3600, // 1 hora
      },
      message: 'Link de descarga generado exitosamente',
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar link de descarga',
    });
  }
};
