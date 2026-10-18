"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllNotifications = exports.deleteNotification = exports.markNotificationAsRead = exports.markNotificationsAsRead = exports.getAllNotifications = exports.sendNotification = void 0;
const notificationmodel_1 = __importDefault(require("../models/notificationmodel"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const errorhander_1 = __importDefault(require("../utils/errorhander"));
const socket_1 = require("../socket");
const sendNotification = async (senderId, userId, type, content) => {
    try {
        const notification = new notificationmodel_1.default({
            sender: senderId,
            userId,
            type,
            content,
        });
        await notification.save();
        try {
            if (typeof socket_1.sendNotificationToUser === 'function') {
                (0, socket_1.sendNotificationToUser)(userId, {
                    _id: notification._id,
                    sender: senderId,
                    userId,
                    type,
                    content,
                    read: false,
                    createdAt: notification.createdAt,
                });
            }
        }
        catch (socketErr) {
            console.error('Socket notification error (non-fatal):', socketErr);
        }
        return notification;
    }
    catch (error) {
        throw new Error('Error sending notification: ' + error.message);
    }
};
exports.sendNotification = sendNotification;
exports.getAllNotifications = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const currentUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && currentUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access these notifications', 403));
    }
    const notifications = await notificationmodel_1.default.find({ userId: id }).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        notifications,
    });
});
exports.markNotificationsAsRead = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const currentUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && currentUserId !== id) {
        return next(new errorhander_1.default('Not authorized to modify these notifications', 403));
    }
    const existing = await notificationmodel_1.default.findOne({ userId: id });
    if (!existing) {
        return res.status(200).json({
            success: true,
            message: 'No notifications',
        });
    }
    await notificationmodel_1.default.updateMany({ userId: id, read: false }, { $set: { read: true } });
    return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
    });
});
exports.markNotificationAsRead = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { notificationId } = req.params;
    const currentUserId = req.user?._id?.toString();
    const notification = await notificationmodel_1.default.findById(notificationId);
    if (!notification) {
        return next(new errorhander_1.default('Notification not found', 404));
    }
    if (req.user?.role !== 'admin' && notification.userId.toString() !== currentUserId) {
        return next(new errorhander_1.default('Not authorized to modify this notification', 403));
    }
    notification.read = true;
    await notification.save();
    res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        notification,
    });
});
exports.deleteNotification = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { notificationId } = req.params;
    const currentUserId = req.user?._id?.toString();
    const notification = await notificationmodel_1.default.findById(notificationId);
    if (!notification) {
        return next(new errorhander_1.default('Notification not found', 404));
    }
    if (req.user?.role !== 'admin' && notification.userId.toString() !== currentUserId) {
        return next(new errorhander_1.default('Not authorized to delete this notification', 403));
    }
    await notification.deleteOne();
    res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
    });
});
exports.deleteAllNotifications = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const currentUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && currentUserId !== id) {
        return next(new errorhander_1.default('Not authorized to delete these notifications', 403));
    }
    await notificationmodel_1.default.deleteMany({ userId: id });
    res.status(200).json({
        success: true,
        message: 'All notifications deleted successfully',
    });
});
//# sourceMappingURL=notification.controller.js.map