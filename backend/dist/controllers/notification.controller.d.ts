import { Request, Response } from 'express';
export declare const sendNotification: (senderId: string, userId: string, type: string, content: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/notificationmodel").INotification, {}, {}> & import("../models/notificationmodel").INotification & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export declare const getAllNotifications: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const markNotificationsAsRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const markNotificationAsRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteNotification: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteAllNotifications: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=notification.controller.d.ts.map