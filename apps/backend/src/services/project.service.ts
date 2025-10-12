import Project from '../models/Project';
import Task from '../models/Task';
import ProjectMember from '../models/ProjectMember';
import ActivityLog from '../models/ActivityLog';
import User from '../models/User';
import mongoose from 'mongoose';

/**
 * Get all projects for a user (as client, manager, or team member)
 */
export const getUserProjects = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Find projects where user is client, manager, or team member
  const memberProjects = await ProjectMember.find({ user_id: userObjectId }).distinct('project_id');

  const projects = await Project.aggregate([
    {
      $match: {
        $or: [
          { client_id: userObjectId },
          { manager_id: userObjectId },
          { _id: { $in: memberProjects } },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'manager_id',
        foreignField: '_id',
        as: 'manager',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'client_id',
        foreignField: '_id',
        as: 'client',
      },
    },
    {
      $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'project_id',
        as: 'tasks',
      },
    },
    {
      $lookup: {
        from: 'projectmembers',
        localField: '_id',
        foreignField: 'project_id',
        as: 'members',
      },
    },
    {
      $addFields: {
        manager_name: { $arrayElemAt: ['$manager.name', 0] },
        manager_email: { $arrayElemAt: ['$manager.email', 0] },
        client_name: { $arrayElemAt: ['$client.name', 0] },
        client_email: { $arrayElemAt: ['$client.email', 0] },
        total_tasks: { $size: '$tasks' },
        completed_tasks: {
          $size: {
            $filter: {
              input: '$tasks',
              cond: { $eq: ['$$this.status', 'completed'] },
            },
          },
        },
        team_size: { $size: '$members' },
      },
    },
    {
      $project: {
        manager: 0,
        client: 0,
        tasks: 0,
        members: 0,
      },
    },
    { $sort: { updated_at: -1 } },
  ]);

  return projects;
};

/**
 * Get a single project by ID with full details
 */
export const getProjectById = async (projectId: string, userId: string) => {
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if user is member
  const isMember = await ProjectMember.findOne({
    project_id: projectObjectId,
    user_id: userObjectId,
  });

  const project = await Project.findOne({
    _id: projectObjectId,
    $or: [
      { client_id: userObjectId },
      { manager_id: userObjectId },
      ...(isMember ? [{ _id: projectObjectId }] : []),
    ],
  })
    .populate('manager_id', 'name email avatar')
    .populate('client_id', 'name email avatar')
    .lean();

  if (!project) return null;

  // Add manager and client info to top level
  const result: any = { ...project };
  if (project.manager_id) {
    result.manager_name = (project.manager_id as any).name;
    result.manager_email = (project.manager_id as any).email;
    result.manager_avatar = (project.manager_id as any).avatar;
  }
  if (project.client_id) {
    result.client_name = (project.client_id as any).name;
    result.client_email = (project.client_id as any).email;
    result.client_avatar = (project.client_id as any).avatar;
  }

  return result;
};

/**
 * Get project team members
 */
export const getProjectMembers = async (projectId: string, userId: string) => {
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if user has access to this project
  const isMember = await ProjectMember.findOne({
    project_id: projectObjectId,
    user_id: userObjectId,
  });

  const hasAccess = await Project.findOne({
    _id: projectObjectId,
    $or: [{ client_id: userObjectId }, { manager_id: userObjectId }],
  });

  if (!hasAccess && !isMember) {
    return [];
  }

  const members = await ProjectMember.aggregate([
    { $match: { project_id: projectObjectId } },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'tasks',
        let: { userId: '$user_id', projectId: '$project_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$project_id', '$$projectId'] },
                  { $eq: ['$assigned_to', '$$userId'] },
                ],
              },
            },
          },
        ],
        as: 'tasks',
      },
    },
    {
      $addFields: {
        user_id: '$user._id',
        name: '$user.name',
        email: '$user.email',
        avatar: '$user.avatar',
        assigned_tasks: { $size: '$tasks' },
        completed_tasks: {
          $size: {
            $filter: {
              input: '$tasks',
              cond: { $eq: ['$$this.status', 'completed'] },
            },
          },
        },
      },
    },
    {
      $project: {
        user: 0,
        tasks: 0,
      },
    },
    { $sort: { assigned_at: 1 } },
  ]);

  return members;
};

/**
 * Get all tasks for a project
 */
export const getProjectTasks = async (projectId: string, userId: string) => {
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if user has access
  const isMember = await ProjectMember.findOne({
    project_id: projectObjectId,
    user_id: userObjectId,
  });

  const hasAccess = await Project.findOne({
    _id: projectObjectId,
    $or: [{ client_id: userObjectId }, { manager_id: userObjectId }],
  });

  if (!hasAccess && !isMember) {
    return [];
  }

  const tasks = await Task.find({ project_id: projectObjectId })
    .populate('assigned_to', 'name email avatar')
    .populate('created_by', 'name email')
    .sort({
      status: 1,
      due_date: 1,
      created_at: -1,
    })
    .lean();

  return tasks.map((task: any) => ({
    ...task,
    assigned_to_name: task.assigned_to?.name,
    assigned_to_email: task.assigned_to?.email,
    assigned_to_avatar: task.assigned_to?.avatar,
    created_by_name: task.created_by?.name,
    created_by_email: task.created_by?.email,
  }));
};

/**
 * Create a new project
 */
export const createProject = async (userId: string, projectData: any) => {
  const {
    name,
    description,
    client_id,
    manager_id,
    status = 'planning',
    priority = 'medium',
    budget,
    start_date,
    end_date,
    estimated_hours,
  } = projectData;

  const project = new Project({
    name,
    description,
    client_id: client_id ? new mongoose.Types.ObjectId(client_id) : undefined,
    manager_id: manager_id ? new mongoose.Types.ObjectId(manager_id) : new mongoose.Types.ObjectId(userId),
    status,
    priority,
    budget,
    start_date,
    end_date,
    estimated_hours,
  });

  await project.save();

  // Log activity
  await logActivity(
    project._id.toString(),
    userId,
    'created_project',
    'project',
    project._id.toString(),
    'Created new project'
  );

  return project;
};

/**
 * Update a project
 */
export const updateProject = async (projectId: string, userId: string, updates: any) => {
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if user is manager or client
  const project = await Project.findOne({
    _id: projectObjectId,
    $or: [{ manager_id: userObjectId }, { client_id: userObjectId }],
  });

  if (!project) {
    return null;
  }

  const allowedFields = [
    'name',
    'description',
    'status',
    'priority',
    'budget',
    'start_date',
    'end_date',
    'estimated_hours',
    'actual_hours',
    'progress',
  ];

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      (project as any)[key] = updates[key];
    }
  });

  await project.save();

  // Log activity
  await logActivity(projectId, userId, 'updated_project', 'project', projectId, 'Updated project');

  return project;
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string, userId: string) => {
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if user is manager
  const project = await Project.findOne({
    _id: projectObjectId,
    manager_id: userObjectId,
  });

  if (!project) {
    throw new Error('Project not found or access denied');
  }

  await Project.deleteOne({ _id: projectObjectId });

  // Delete related data
  await Task.deleteMany({ project_id: projectObjectId });
  await ProjectMember.deleteMany({ project_id: projectObjectId });
  await ActivityLog.deleteMany({ project_id: projectObjectId });
};

/**
 * Create a task
 */
export const createTask = async (projectId: string, userId: string, taskData: any) => {
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if user has access
  const isMember = await ProjectMember.findOne({
    project_id: projectObjectId,
    user_id: userObjectId,
  });

  const hasAccess = await Project.findOne({
    _id: projectObjectId,
    $or: [{ client_id: userObjectId }, { manager_id: userObjectId }],
  });

  if (!hasAccess && !isMember) {
    throw new Error('Project not found or access denied');
  }

  const {
    title,
    description,
    status = 'todo',
    priority = 'medium',
    assigned_to,
    estimated_hours,
    due_date,
  } = taskData;

  const task = new Task({
    project_id: projectObjectId,
    title,
    description,
    status,
    priority,
    assigned_to: assigned_to ? new mongoose.Types.ObjectId(assigned_to) : undefined,
    created_by: userObjectId,
    estimated_hours,
    due_date,
  });

  await task.save();

  // Log activity
  await logActivity(projectId, userId, 'created_task', 'task', task._id.toString(), `Created task: ${title}`);

  return task;
};

/**
 * Update a task
 */
export const updateTask = async (taskId: string, userId: string, updates: any) => {
  const taskObjectId = new mongoose.Types.ObjectId(taskId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Find task and check access
  const task = await Task.findById(taskObjectId);
  if (!task) {
    return null;
  }

  const isMember = await ProjectMember.findOne({
    project_id: task.project_id,
    user_id: userObjectId,
  });

  const hasAccess = await Project.findOne({
    _id: task.project_id,
    $or: [{ client_id: userObjectId }, { manager_id: userObjectId }],
  });

  const isAssigned = task.assigned_to?.equals(userObjectId);

  if (!hasAccess && !isMember && !isAssigned) {
    return null;
  }

  const allowedFields = [
    'title',
    'description',
    'status',
    'priority',
    'assigned_to',
    'estimated_hours',
    'actual_hours',
    'due_date',
  ];

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      if (key === 'assigned_to' && updates[key]) {
        (task as any)[key] = new mongoose.Types.ObjectId(updates[key]);
      } else {
        (task as any)[key] = updates[key];
      }
    }
  });

  // If status is being set to completed, set completed_at
  if (updates.status === 'completed' && task.status !== 'completed') {
    task.completed_at = new Date();
  }

  await task.save();

  // Log activity
  await logActivity(
    task.project_id.toString(),
    userId,
    'updated_task',
    'task',
    taskId,
    'Updated task'
  );

  return task;
};

/**
 * Get dashboard statistics for a user
 */
export const getDashboardStats = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Find projects where user is involved
  const memberProjects = await ProjectMember.find({ user_id: userObjectId }).distinct('project_id');

  const projectQuery = {
    $or: [
      { client_id: userObjectId },
      { manager_id: userObjectId },
      { _id: { $in: memberProjects } },
    ],
  };

  // Total projects
  const totalProjects = await Project.countDocuments(projectQuery);

  // Active projects
  const activeProjects = await Project.countDocuments({
    ...projectQuery,
    status: 'active',
  });

  // Tasks assigned to user
  const taskStats = await Task.aggregate([
    { $match: { assigned_to: userObjectId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        in_progress: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
        },
        todo: {
          $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] },
        },
      },
    },
  ]);

  const tasks = taskStats[0] || { total: 0, completed: 0, in_progress: 0, todo: 0 };

  // Get all project IDs for recent activity
  const allProjects = await Project.find(projectQuery).select('_id');
  const projectIds = allProjects.map((p) => p._id);

  // Recent activity
  const recentActivity = await ActivityLog.find({
    project_id: { $in: projectIds },
  })
    .populate('user_id', 'name avatar')
    .populate('project_id', 'name')
    .sort({ created_at: -1 })
    .limit(10)
    .lean();

  return {
    totalProjects,
    activeProjects,
    tasks: {
      total: tasks.total,
      completed: tasks.completed,
      inProgress: tasks.in_progress,
      todo: tasks.todo,
    },
    recentActivity: recentActivity.map((activity: any) => ({
      ...activity,
      user_name: activity.user_id?.name,
      user_avatar: activity.user_id?.avatar,
      project_name: activity.project_id?.name,
    })),
  };
};

/**
 * Helper function to log activity
 */
const logActivity = async (
  projectId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string
) => {
  const activity = new ActivityLog({
    project_id: new mongoose.Types.ObjectId(projectId),
    user_id: new mongoose.Types.ObjectId(userId),
    action,
    entity_type: entityType,
    entity_id: new mongoose.Types.ObjectId(entityId),
    details,
  });

  await activity.save();
};
