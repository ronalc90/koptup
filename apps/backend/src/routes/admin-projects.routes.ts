/**
 * Proyectos de los clientes (Admin › Proyectos) y búsqueda de cuentas de
 * cliente para los selectores del panel. Admin o manager (rol leído de la BD).
 *
 *  /api/admin/projects
 *    GET   /       ?q=&status=&clientId=   lista con conteos (facturas, entregables, pedidos) y conversación
 *    POST  /       { clientId, name, description?, budget?, currency?, status?, priority?, startDate?, endDate?, managerId?, welcomeMessage? }
 *    PATCH /:id    { name?, description?, budget?, currency?, status?, priority?, progress?, startDate?, endDate? }
 *  /api/admin/clients
 *    GET   /       ?q=   cuentas `client`, `user` o `prospect` (máx. 50)
 */
import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRole } from '../middleware/access';
import { AuthRequest } from '../types';
import { zodToAppError } from './demo-public.routes';
import Project from '../models/Project';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  adminProjectView,
  createClientProject,
  listClientProjects,
  searchClientAccounts,
  updateClientProject,
} from '../services/client-projects.service';

const OPS_ROLES = ['admin', 'manager'];

function actorOf(req: AuthRequest) {
  const u = req.user!;
  return { id: u.id, email: u.email, role: u.role, name: u.name };
}

function queryText(value: unknown, max = 100): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

export const adminProjectsRouter = Router();
adminProjectsRouter.use(...requireRole(...OPS_ROLES));

adminProjectsRouter.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await listClientProjects({
      q: queryText(req.query.q),
      status: queryText(req.query.status, 20),
      clientId: queryText(req.query.clientId, 40),
    });
    res.json({ success: true, data });
  }),
);

adminProjectsRouter.post(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = CreateProjectSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw zodToAppError(parsed.error);
    const project = await createClientProject(parsed.data, actorOf(req), { req });
    const populated = await Project.findById(project._id).populate('client_id', 'name email company').populate('manager_id', 'name email').lean();
    res.status(201).json({ success: true, message: 'Proyecto creado.', data: populated ? adminProjectView(populated) : { id: String(project._id) } });
  }),
);

adminProjectsRouter.patch(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = UpdateProjectSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw zodToAppError(parsed.error);
    const project = await updateClientProject(String(req.params.id), parsed.data, actorOf(req), req);
    const populated = await Project.findById(project._id).populate('client_id', 'name email company').populate('manager_id', 'name email').lean();
    res.json({ success: true, message: 'Proyecto actualizado.', data: populated ? adminProjectView(populated) : { id: String(project._id) } });
  }),
);

export const adminClientsRouter = Router();
adminClientsRouter.use(...requireRole(...OPS_ROLES));

adminClientsRouter.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ success: true, data: await searchClientAccounts(queryText(req.query.q)) });
  }),
);
