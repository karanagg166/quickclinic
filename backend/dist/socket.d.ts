import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
declare let io: Server | undefined;
export declare const initializeSocket: (server: HttpServer) => Server;
export { io };
export declare const isUserOnline: (userId: string) => boolean;
export declare const getReceiverSocketId: (receiverId: string) => string | undefined;
export declare const getReceiverSocketIds: (receiverId: string) => string[];
export declare const sendNotificationToUser: (userId: string, notification: any) => void;
export declare const setupSocket: (server: HttpServer) => Server;
//# sourceMappingURL=socket.d.ts.map