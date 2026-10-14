import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth';
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

// Project routes
router.get('/', getUserProjects as RequestHandler);
router.post('/', createProject as RequestHandler);
router.get('/:id', getProjectById as RequestHandler);
router.put('/:id', updateProject as RequestHandler);
router.delete('/:id', deleteProject as RequestHandler);

// Project members
router.get('/:id/members', getProjectMembers as RequestHandler);

// Project tasks
router.get('/:id/tasks', getProjectTasks as RequestHandler);
router.post('/:id/tasks', createTask as RequestHandler);

// Task routes
router.put('/tasks/:id', updateTask as RequestHandler);

export default router;
