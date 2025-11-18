import { Response } from 'express';
import { AuthRequest } from '../types';
import Deliverable from '../models/Deliverable';
import Project from '../models/Project';
import User from '../models/User';
import mongoose from 'mongoose';

// Obtener todos los entregables
export const getDeliverables = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, projectId } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const query: any = { userId };
    if (status && status !== 'all') query.status = status;
    if (projectId) query.projectId = projectId;

    const deliverables = await Deliverable.find(query)
      .populate('projectId', 'name')
      .populate('uploadedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const formattedDeliverables = deliverables.map((del: any) => ({
      id: del.deliverableId,
      projectId: del.projectId?._id,
      projectName: del.projectId?.name || 'Sin proyecto',
      title: del.title,
      description: del.description,
      type: del.type,
      status: del.status,
      uploadDate: del.uploadDate.toISOString().split('T')[0],
      approvedDate: del.approvedDate ? del.approvedDate.toISOString().split('T')[0] : null,
      fileUrl: del.fileUrl,
      fileName: del.fileName,
      fileSize: del.fileSize,
      version: del.version,
      uploadedBy: del.uploadedBy?.name || 'Desconocido',
      reviewedBy: del.reviewedBy?.name || null,
      comments: del.comments,
    }));

    res.json({ success: true, data: formattedDeliverables });
  } catch (error) {
    console.error('Get deliverables error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener entregables' });
  }
};

export const getDeliverableById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const deliverable = await Deliverable.findOne({ deliverableId: id })
      .populate('projectId', 'name description')
      .populate('uploadedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('history.user', 'name')
      .lean();

    if (!deliverable) {
      res.status(404).json({ success: false, message: 'Entregable no encontrado' });
      return;
    }

    res.json({ success: true, data: deliverable });
  } catch (error) {
    console.error('Get deliverable by id error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener entregable' });
  }
};

export const uploadDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = req.user;
    const { projectId, title, description, type, fileUrl, fileName, fileSize, fileType, metadata } = req.body;

    if (!userId || !user) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (!projectId || !title || !type || !fileUrl || !fileName || !fileSize) {
      res.status(400).json({ success: false, message: 'Todos los campos requeridos deben ser proporcionados' });
      return;
    }

    const newDeliverable = new Deliverable({
      projectId,
      userId,
      title,
      description: description || '',
      type,
      status: 'pending',
      uploadDate: new Date(),
      fileUrl,
      fileName,
      fileSize,
      fileType,
      version: 1,
      uploadedBy: userId,
      metadata: metadata ? new Map(Object.entries(metadata)) : undefined,
      history: [{
        date: new Date(),
        action: 'uploaded',
        user: userId,
        userName: user.name || user.email,
        description: 'Entregable subido',
      }],
    });

    await newDeliverable.save();
    res.status(201).json({ success: true, data: { id: newDeliverable.deliverableId }, message: 'Entregable subido exitosamente' });
  } catch (error) {
    console.error('Upload deliverable error:', error);
    res.status(500).json({ success: false, message: 'Error al subir entregable' });
  }
};

export const updateDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const user = req.user;
    const updateData = req.body;

    if (!userId || !user) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const deliverable = await Deliverable.findOne({ deliverableId: id });
    if (!deliverable) {
      res.status(404).json({ success: false, message: 'Entregable no encontrado' });
      return;
    }

    if (deliverable.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'No tienes permiso para actualizar este entregable' });
      return;
    }

    if (updateData.title) deliverable.title = updateData.title;
    if (updateData.description) deliverable.description = updateData.description;

    deliverable.history.push({
      date: new Date(),
      action: 'updated',
      user: new mongoose.Types.ObjectId(userId),
      userName: user.name || user.email,
      description: 'Entregable actualizado',
    });

    await deliverable.save();
    res.json({ success: true, message: 'Entregable actualizado exitosamente' });
  } catch (error) {
    console.error('Update deliverable error:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar entregable' });
  }
};

export const approveDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const user = req.user;
    const { comments } = req.body;

    if (!userId || !user) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const deliverable = await Deliverable.findOne({ deliverableId: id });
    if (!deliverable) {
      res.status(404).json({ success: false, message: 'Entregable no encontrado' });
      return;
    }

    deliverable.status = 'approved';
    deliverable.approvedDate = new Date();
    deliverable.reviewedBy = new mongoose.Types.ObjectId(userId);
    deliverable.comments = comments || 'Aprobado';
    deliverable.history.push({
      date: new Date(),
      action: 'approved',
      user: new mongoose.Types.ObjectId(userId),
      userName: user.name || user.email,
      description: 'Entregable aprobado',
    });

    await deliverable.save();
    res.json({ success: true, message: 'Entregable aprobado exitosamente' });
  } catch (error) {
    console.error('Approve deliverable error:', error);
    res.status(500).json({ success: false, message: 'Error al aprobar entregable' });
  }
};

export const rejectDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const user = req.user;
    const { comments } = req.body;

    if (!userId || !user) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (!comments) {
      res.status(400).json({ success: false, message: 'Los comentarios son requeridos para rechazar un entregable' });
      return;
    }

    const deliverable = await Deliverable.findOne({ deliverableId: id });
    if (!deliverable) {
      res.status(404).json({ success: false, message: 'Entregable no encontrado' });
      return;
    }

    deliverable.status = 'rejected';
    deliverable.rejectedDate = new Date();
    deliverable.reviewedBy = new mongoose.Types.ObjectId(userId);
    deliverable.comments = comments;
    deliverable.history.push({
      date: new Date(),
      action: 'rejected',
      user: new mongoose.Types.ObjectId(userId),
      userName: user.name || user.email,
      description: `Entregable rechazado: ${comments}`,
    });

    await deliverable.save();
    res.json({ success: true, message: 'Entregable rechazado exitosamente' });
  } catch (error) {
    console.error('Reject deliverable error:', error);
    res.status(500).json({ success: false, message: 'Error al rechazar entregable' });
  }
};
