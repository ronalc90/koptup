import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  getNotificationStats,
} from '../controllers/notifications.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for authenticated user
 * @access  Private
 */
router.get('/', getNotifications);

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/:id/read', markNotificationAsRead);

/**
 * @route   POST /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/read-all', markAllNotificationsAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

/**
 * @route   POST /api/notifications
 * @desc    Create notification (admin/project_manager only)
 * @access  Private (Admin)
 */
router.post('/', createNotification);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', getNotificationStats);

export default router;
