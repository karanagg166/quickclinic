"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("../controllers/notification.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.route('/notifications/:id').get(auth_1.isauthenticateuser, notification_controller_1.getAllNotifications);
router.route('/notifications/:id/mark-read').put(auth_1.isauthenticateuser, notification_controller_1.markNotificationsAsRead);
router.route('/notifications/:id/delete-all').delete(auth_1.isauthenticateuser, notification_controller_1.deleteAllNotifications);
router.route('/notification/:notificationId/mark-read').put(auth_1.isauthenticateuser, notification_controller_1.markNotificationAsRead);
router.route('/notification/:notificationId').delete(auth_1.isauthenticateuser, notification_controller_1.deleteNotification);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map