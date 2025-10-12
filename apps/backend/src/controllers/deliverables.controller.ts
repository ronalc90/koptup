import { Response } from 'express';
import { AuthRequest } from '../types';

// Controlador para entregables
export const getDeliverables = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, projectId } = req.query;

    // Mock data - En producción, consultar base de datos
    const deliverables = [
      {
        id: 'DEL-001',
        projectId: 'PRJ-001',
        projectName: 'Sistema de gestión de inventario',
        title: 'Diseño UI/UX completo',
        description: 'Wireframes y diseños de alta fidelidad para todas las pantallas',
        type: 'design',
        status: 'approved',
        uploadDate: '2025-10-05',
        approvedDate: '2025-10-06',
        fileUrl: 'https://example.com/files/design-v1.fig',
        fileName: 'design-v1.fig',
        fileSize: 15234567,
        version: 1,
        userId,
        uploadedBy: 'Juan Pérez',
        reviewedBy: 'María García',
        comments: 'Excelente trabajo, aprobado sin cambios',
      },
      {
        id: 'DEL-002',
        projectId: 'PRJ-001',
        projectName: 'Sistema de gestión de inventario',
        title: 'Backend API - Módulo de inventario',
        description: 'API REST para gestión de inventario con documentación Swagger',
        type: 'code',
        status: 'pending',
        uploadDate: '2025-10-08',
        approvedDate: null,
        fileUrl: 'https://example.com/files/api-v1.zip',
        fileName: 'api-v1.zip',
        fileSize: 45678901,
        version: 1,
        userId,
        uploadedBy: 'Juan Pérez',
        reviewedBy: null,
        comments: null,
      },
      {
        id: 'DEL-003',
        projectId: 'PRJ-002',
        projectName: 'Aplicación móvil iOS/Android',
        title: 'Prototipo funcional v1',
        description: 'Primera versión del prototipo con navegación básica',
        type: 'prototype',
        status: 'rejected',
        uploadDate: '2025-10-03',
        approvedDate: null,
        fileUrl: 'https://example.com/files/prototype-v1.apk',
        fileName: 'prototype-v1.apk',
        fileSize: 23456789,
        version: 1,
        userId,
        uploadedBy: 'Juan Pérez',
        reviewedBy: 'Carlos López',
        comments: 'Necesita ajustes en la navegación y corrección de errores en el login',
      },
      {
        id: 'DEL-004',
        projectId: 'PRJ-001',
        projectName: 'Sistema de gestión de inventario',
        title: 'Documentación técnica',
        description: 'Manual técnico completo y guía de instalación',
        type: 'documentation',
        status: 'in_review',
        uploadDate: '2025-10-10',
        approvedDate: null,
        fileUrl: 'https://example.com/files/docs-v1.pdf',
        fileName: 'docs-v1.pdf',
        fileSize: 3456789,
        version: 1,
        userId,
        uploadedBy: 'Juan Pérez',
        reviewedBy: null,
        comments: null,
      },
    ];

    // Filtrar por estado si se proporciona
    let filteredDeliverables = deliverables;

    if (status && status !== 'all') {
      filteredDeliverables = filteredDeliverables.filter(
        deliverable => deliverable.status === status
      );
    }

    // Filtrar por proyecto si se proporciona
    if (projectId) {
      filteredDeliverables = filteredDeliverables.filter(
        deliverable => deliverable.projectId === projectId
      );
    }

    res.json({
      success: true,
      data: filteredDeliverables,
    });
  } catch (error) {
    console.error('Get deliverables error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener entregables',
    });
  }
};

export const getDeliverableById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Mock data
    const deliverable = {
      id,
      projectId: 'PRJ-001',
      projectName: 'Sistema de gestión de inventario',
      title: 'Diseño UI/UX completo',
      description: 'Wireframes y diseños de alta fidelidad para todas las pantallas del sistema',
      type: 'design',
      status: 'approved',
      uploadDate: '2025-10-05',
      approvedDate: '2025-10-06',
      fileUrl: 'https://example.com/files/design-v1.fig',
      fileName: 'design-v1.fig',
      fileSize: 15234567,
      version: 1,
      userId,
      uploadedBy: {
        id: userId,
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
      },
      reviewedBy: {
        id: 'USR-002',
        name: 'María García',
        email: 'maria.garcia@example.com',
      },
      comments: 'Excelente trabajo, aprobado sin cambios',
      history: [
        {
          date: '2025-10-05',
          action: 'uploaded',
          user: 'Juan Pérez',
          description: 'Entregable subido',
        },
        {
          date: '2025-10-06',
          action: 'approved',
          user: 'María García',
          description: 'Entregable aprobado',
        },
      ],
      metadata: {
        format: 'Figma',
        screens: 15,
        components: 45,
      },
    };

    res.json({
      success: true,
      data: deliverable,
    });
  } catch (error) {
    console.error('Get deliverable by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener entregable',
    });
  }
};

export const uploadDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const deliverableData = req.body;

    // Mock creation
    const newDeliverable = {
      id: `DEL-${Date.now()}`,
      ...deliverableData,
      userId,
      status: 'pending',
      uploadDate: new Date().toISOString().split('T')[0],
      approvedDate: null,
      reviewedBy: null,
      version: 1,
      uploadedBy: req.user?.email,
    };

    res.status(201).json({
      success: true,
      data: newDeliverable,
      message: 'Entregable subido exitosamente',
    });
  } catch (error) {
    console.error('Upload deliverable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir entregable',
    });
  }
};

export const updateDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    // Mock update
    const updatedDeliverable = {
      id,
      ...updateData,
      userId,
      updatedDate: new Date().toISOString().split('T')[0],
    };

    res.json({
      success: true,
      data: updatedDeliverable,
      message: 'Entregable actualizado exitosamente',
    });
  } catch (error) {
    console.error('Update deliverable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar entregable',
    });
  }
};

export const approveDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user?.id;

    // Mock approval
    const approvedDeliverable = {
      id,
      status: 'approved',
      approvedDate: new Date().toISOString().split('T')[0],
      reviewedBy: {
        id: userId,
        name: req.user?.email,
      },
      comments: comments || 'Aprobado',
    };

    res.json({
      success: true,
      data: approvedDeliverable,
      message: 'Entregable aprobado exitosamente',
    });
  } catch (error) {
    console.error('Approve deliverable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar entregable',
    });
  }
};

export const rejectDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user?.id;

    if (!comments) {
      res.status(400).json({
        success: false,
        message: 'Los comentarios son requeridos para rechazar un entregable',
      });
      return;
    }

    // Mock rejection
    const rejectedDeliverable = {
      id,
      status: 'rejected',
      rejectedDate: new Date().toISOString().split('T')[0],
      reviewedBy: {
        id: userId,
        name: req.user?.email,
      },
      comments,
    };

    res.json({
      success: true,
      data: rejectedDeliverable,
      message: 'Entregable rechazado exitosamente',
    });
  } catch (error) {
    console.error('Reject deliverable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar entregable',
    });
  }
};
