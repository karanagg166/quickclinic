"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = exports.sendNotificationToUser = exports.getReceiverSocketIds = exports.getReceiverSocketId = exports.isUserOnline = exports.io = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = require("mongoose");
const usermodel_1 = __importDefault(require("./models/usermodel"));
const conversationmodel_1 = __importDefault(require("./models/conversationmodel"));
const origin_1 = require("./utils/origin");
const messageservice_1 = require("./services/messageservice");
let io;
const userSocketMap = new Map();
const initializeSocket = (server) => {
    exports.io = io = new socket_io_1.Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) {
                    if ((0, origin_1.isOriginAllowed)(undefined)) {
                        return callback(null, true);
                    }
                    return callback(new Error('CORS: Missing Origin header'), false);
                }
                if ((0, origin_1.isOriginAllowed)(origin)) {
                    return callback(null, origin);
                }
                return callback(new Error('CORS: Origin not allowed'), false);
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
        allowRequest: (req, callback) => {
            const origin = req.headers.origin;
            const allowed = (0, origin_1.isOriginAllowed)(origin);
            if (!allowed) {
                return callback('Origin not allowed', false);
            }
            return callback(null, true);
        },
        pingTimeout: 30000,
        pingInterval: 25000,
    });
    io.use(async (socket, next) => {
        try {
            const origin = socket.handshake.headers.origin;
            if (!(0, origin_1.isOriginAllowed)(origin)) {
                return next(new Error('Authentication error: Origin not allowed'));
            }
            let token = socket.handshake.auth?.token;
            if (!token && socket.handshake.headers.cookie) {
                const cookies = socket.handshake.headers.cookie.split(';');
                for (const cookie of cookies) {
                    const [key, value] = cookie.trim().split('=');
                    if (key === 'token') {
                        token = decodeURIComponent(value);
                        break;
                    }
                }
            }
            if (!token && socket.handshake.headers.authorization) {
                const parts = socket.handshake.headers.authorization.split(' ');
                if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
                    token = parts[1];
                }
            }
            if (!token) {
                return next(new Error('Authentication error: Missing token'));
            }
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                return next(new Error('Authentication error: Server authentication configuration missing'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            if (!decoded || !decoded.id || !mongoose_1.Types.ObjectId.isValid(decoded.id)) {
                return next(new Error('Authentication error: Invalid token'));
            }
            const user = await usermodel_1.default.findById(decoded.id).select('_id name email role');
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }
            socket.data.user = user;
            next();
        }
        catch (err) {
            return next(new Error('Authentication error: ' + (err.message || 'Invalid token')));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.user?._id?.toString();
        if (!userId) {
            socket.disconnect(true);
            return;
        }
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId).add(socket.id);
        socket.join(`user:${userId}`);
        socket.on('joinConversation', async ({ conversationId }) => {
            try {
                if (!conversationId || !mongoose_1.Types.ObjectId.isValid(conversationId)) {
                    socket.emit('error', { message: 'Invalid conversation ID' });
                    return;
                }
                const conversation = await conversationmodel_1.default.findById(conversationId);
                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
                    return;
                }
                const isParticipant = socket.data.user?.role === 'admin' ||
                    conversation.participants.some((p) => p.toString() === userId);
                if (!isParticipant) {
                    socket.emit('error', { message: 'Not authorized to join this conversation' });
                    return;
                }
                socket.join(`conversation:${conversationId}`);
                socket.emit('joinedConversation', { conversationId });
            }
            catch (err) {
                socket.emit('error', { message: err.message || 'Error joining conversation' });
            }
        });
        socket.on('leaveConversation', ({ conversationId }) => {
            if (conversationId) {
                socket.leave(`conversation:${conversationId}`);
            }
        });
        socket.on('checkPresence', async (data, callback) => {
            if (typeof callback !== 'function')
                return;
            const { targetUserId, conversationId } = data || {};
            if (!targetUserId ||
                typeof targetUserId !== 'string' ||
                !mongoose_1.Types.ObjectId.isValid(targetUserId)) {
                return callback({ error: 'Invalid or missing target user ID' });
            }
            if (targetUserId === userId) {
                return callback({
                    userId: targetUserId,
                    isOnline: (0, exports.isUserOnline)(targetUserId),
                });
            }
            try {
                let authorized = false;
                if (socket.data.user?.role === 'admin') {
                    authorized = true;
                }
                else if (conversationId && mongoose_1.Types.ObjectId.isValid(conversationId)) {
                    const conv = await conversationmodel_1.default.findOne({
                        _id: conversationId,
                        participants: { $all: [userId, targetUserId] },
                    });
                    if (conv)
                        authorized = true;
                }
                else {
                    const sharedConv = await conversationmodel_1.default.findOne({
                        participants: { $all: [userId, targetUserId] },
                    });
                    if (sharedConv)
                        authorized = true;
                }
                if (!authorized) {
                    return callback({
                        error: 'Not authorized to inspect presence for this user',
                    });
                }
                return callback({
                    userId: targetUserId,
                    isOnline: (0, exports.isUserOnline)(targetUserId),
                });
            }
            catch {
                return callback({ error: 'Failed to verify presence relationship' });
            }
        });
        socket.on('sendMessage', async (data, callback) => {
            try {
                const { conversationId, message, receiverId, idempotencyKey } = data || {};
                const result = await (0, messageservice_1.sendMessageService)({
                    senderId: userId,
                    senderRole: socket.data.user?.role,
                    conversationId,
                    receiverId,
                    message,
                    idempotencyKey,
                });
                if (result.duplicate) {
                    if (typeof callback === 'function') {
                        callback({ success: true, message: result.message, duplicate: true });
                    }
                    return;
                }
                socket
                    .to(`conversation:${result.conversationId}`)
                    .to(`user:${result.effectiveReceiverId}`)
                    .emit('receiveMessage', result.message);
                if (typeof callback === 'function') {
                    callback({ success: true, message: result.message });
                }
            }
            catch (error) {
                if (typeof callback === 'function') {
                    callback({
                        error: error.message || 'Failed to send message',
                        statusCode: error.statusCode || 500,
                    });
                }
            }
        });
        socket.on('disconnect', () => {
            const userSockets = userSocketMap.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    userSocketMap.delete(userId);
                }
            }
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
const isUserOnline = (userId) => {
    return (userSocketMap.get(userId)?.size || 0) > 0;
};
exports.isUserOnline = isUserOnline;
const getReceiverSocketId = (receiverId) => {
    const sockets = userSocketMap.get(receiverId);
    if (sockets && sockets.size > 0) {
        return Array.from(sockets)[0];
    }
    return undefined;
};
exports.getReceiverSocketId = getReceiverSocketId;
const getReceiverSocketIds = (receiverId) => {
    const sockets = userSocketMap.get(receiverId);
    return sockets ? Array.from(sockets) : [];
};
exports.getReceiverSocketIds = getReceiverSocketIds;
const sendNotificationToUser = (userId, notification) => {
    if (io) {
        io.to(`user:${userId}`).emit('receiveNotification', notification);
    }
};
exports.sendNotificationToUser = sendNotificationToUser;
exports.setupSocket = exports.initializeSocket;
//# sourceMappingURL=socket.js.map