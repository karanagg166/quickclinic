import { Request, Response, NextFunction } from 'express';
import Notification from '../models/notificationmodel';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import { AuthRequest } from '../middleware/auth';
import ErrorHander from '../utils/errorhander';
import { sendNotificationToUser } from '../socket';

export const sendNotification = async (senderId: string, userId: string, type: string, content: string) => {
  try {
    const notification = new Notification({
      sender: senderId,
      userId,
      type,
      content,
    });
    await notification.save();

    // Send real-time notification via socket.io if available
    try {
      if (typeof sendNotificationToUser === 'function') {
        sendNotificationToUser(userId, {
          _id: notification._id,
          sender: senderId,
          userId,
          type,
          content,
          read: false,
          createdAt: notification.createdAt,
        });
      }
    } catch (socketErr) {
      console.error('Socket notification error (non-fatal):', socketErr);
    }

    return notification;
  } catch (error) {
    throw new Error('Error sending notification: ' + (error as Error).message);
  }
};

export const getAllNotifications = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const currentUserId = req.user?._id?.toString();

    // Verify ownership
    if (req.user?.role !== 'admin' && currentUserId !== id) {
      return next(new ErrorHander('Not authorized to access these notifications', 403));
    }

    const notifications = await Notification.find({ userId: id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications,
    });
  }
);

export const markNotificationsAsRead = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const currentUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && currentUserId !== id) {
      return next(new ErrorHander('Not authorized to modify these notifications', 403));
    }

    const existing = await Notification.findOne({ userId: id });
    if (!existing) {
      return res.status(200).json({
        success: true,
        message: 'No notifications',
      });
    }

    await Notification.updateMany({ userId: id, read: false }, { $set: { read: true } });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  }
);

export const markNotificationAsRead = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { notificationId } = req.params;
    const currentUserId = req.user?._id?.toString();

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return next(new ErrorHander('Notification not found', 404));
    }

    if (req.user?.role !== 'admin' && notification.userId.toString() !== currentUserId) {
      return next(new ErrorHander('Not authorized to modify this notification', 403));
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  }
);

export const deleteNotification = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { notificationId } = req.params;
    const currentUserId = req.user?._id?.toString();

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return next(new ErrorHander('Notification not found', 404));
    }

    if (req.user?.role !== 'admin' && notification.userId.toString() !== currentUserId) {
      return next(new ErrorHander('Not authorized to delete this notification', 403));
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  }
);

export const deleteAllNotifications = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const currentUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && currentUserId !== id) {
      return next(new ErrorHander('Not authorized to delete these notifications', 403));
    }

    await Notification.deleteMany({ userId: id });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
    });
  }
);
