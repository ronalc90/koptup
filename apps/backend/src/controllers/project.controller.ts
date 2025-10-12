import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import * as projectService from '../services/project.service';

/**
 * @desc    Get all projects for the authenticated user
 * @route   GET /api/projects
 * @access  Private
 */
export const getUserProjects = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const projects = await projectService.getUserProjects(userId);

    res.status(200).json({
      success: true,
      data: projects,
    });
  }
);

/**
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProjectById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const project = await projectService.getProjectById(id, userId);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  }
);

/**
 * @desc    Get project team members
 * @route   GET /api/projects/:id/members
 * @access  Private
 */
export const getProjectMembers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const members = await projectService.getProjectMembers(id, userId);

    res.status(200).json({
      success: true,
      data: members,
    });
  }
);

/**
 * @desc    Get project tasks
 * @route   GET /api/projects/:id/tasks
 * @access  Private
 */
export const getProjectTasks = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const tasks = await projectService.getProjectTasks(id, userId);

    res.status(200).json({
      success: true,
      data: tasks,
    });
  }
);

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (admin/manager)
 */
export const createProject = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const projectData = req.body;

    const project = await projectService.createProject(userId, projectData);

    res.status(201).json({
      success: true,
      data: project,
    });
  }
);

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private (admin/manager)
 */
export const updateProject = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    const project = await projectService.updateProject(id, userId, updates);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  }
);

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private (admin/manager)
 */
export const deleteProject = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    await projectService.deleteProject(id, userId);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  }
);

/**
 * @desc    Create a task for a project
 * @route   POST /api/projects/:id/tasks
 * @access  Private
 */
export const createTask = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const taskData = req.body;

    const task = await projectService.createTask(id, userId, taskData);

    res.status(201).json({
      success: true,
      data: task,
    });
  }
);

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
export const updateTask = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    const task = await projectService.updateTask(id, userId, updates);

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  }
);

/**
 * @desc    Get project statistics/dashboard data
 * @route   GET /api/projects/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const stats = await projectService.getDashboardStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  }
);
