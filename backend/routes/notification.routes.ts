import express from 'express';
import {
  getAllNotifications,
  markNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notification.controller';
import { isauthenticateuser } from '../middleware/auth';

const router = express.Router();

router.route('/notifications/:id').get(isauthenticateuser, getAllNotifications);
router.route('/notifications/:id/mark-read').put(isauthenticateuser, markNotificationsAsRead);
router.route('/notifications/:id/delete-all').delete(isauthenticateuser, deleteAllNotifications);
router.route('/notification/:notificationId/mark-read').put(isauthenticateuser, markNotificationAsRead);
router.route('/notification/:notificationId').delete(isauthenticateuser, deleteNotification);

export default router;
