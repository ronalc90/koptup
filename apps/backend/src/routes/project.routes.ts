import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/access';
import {
  getUserProjects,
  getProjectById,
  getProjectMembers,
  getProjectTasks,
  createProject,
  updateProject,
  deleteProject,
  createTask,
  updateTask,
  getDashboardStats,
} from '../controllers/project.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats as RequestHandler);

// Project routes. El cliente solo consulta sus proyectos; crearlos y
// cambiarlos es del equipo (Admin › Proyectos usa /api/admin/projects, que
// además avisa al cliente y deja la conversación del proyecto).
router.get('/', getUserProjects as RequestHandler);
router.post('/', ...requireRole('admin', 'manager'), createProject as RequestHandler);
router.get('/:id', getProjectById as RequestHandler);
router.put('/:id', ...requireRole('admin', 'manager'), updateProject as RequestHandler);
router.delete('/:id', ...requireRole('admin', 'manager'), deleteProject as RequestHandler);

// Project members
router.get('/:id/members', getProjectMembers as RequestHandler);

// Project tasks
router.get('/:id/tasks', getProjectTasks as RequestHandler);
router.post('/:id/tasks', createTask as RequestHandler);

// Task routes
router.put('/tasks/:id', updateTask as RequestHandler);

export default router;
