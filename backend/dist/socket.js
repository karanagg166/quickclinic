"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = exports.sendNotificationToUser = exports.getReceiverSocketIds = exports.getReceiverSocketId = exports.isUserOnline = exports.io = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const usermodel_1 = __importDefault(require("./models/usermodel"));
const conversationmodel_1 = __importDefault(require("./models/conversationmodel"));
const messagemodel_1 = __importDefault(require("./models/messagemodel"));
let io;
const userSocketMap = new Map();
const initializeSocket = (server) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.SOCKET_CORS_ORIGIN || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const defaultOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://quickclinic.vercel.app',
    ];
    exports.io = io = new socket_io_1.Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins.includes(origin) ||
                    defaultOrigins.includes(origin) ||
                    /^https:\/\/quickclinic-[a-z0-9-]+-karan-aggarwals-projects\.vercel\.app$/.test(origin)) {
                    return callback(null, origin);
                }
                return callback(null, origin);
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 30000,
        pingInterval: 25000,
    });
    io.use(async (socket, next) => {
        try {
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
            const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_tests';
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
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
                if (!conversationId)
                    return;
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
                socket.emit('error', { message: err.message });
            }
        });
        socket.on('leaveConversation', ({ conversationId }) => {
            if (conversationId) {
                socket.leave(`conversation:${conversationId}`);
            }
        });
        socket.on('checkPresence', ({ targetUserId }, callback) => {
            const isOnline = (0, exports.isUserOnline)(targetUserId);
            if (typeof callback === 'function') {
                callback({ userId: targetUserId, isOnline });
            }
        });
        socket.on('sendMessage', async (data, callback) => {
            try {
                const { conversationId, message, receiverId } = data;
                if (!message || !message.trim()) {
                    if (typeof callback === 'function')
                        callback({ error: 'Message cannot be empty' });
                    return;
                }
                let conversation;
                if (conversationId) {
                    conversation = await conversationmodel_1.default.findById(conversationId);
                }
                else if (receiverId) {
                    conversation = await conversationmodel_1.default.findOne({
                        participants: { $all: [userId, receiverId] },
                    });
                    if (!conversation) {
                        conversation = await conversationmodel_1.default.create({
                            participants: [userId, receiverId],
                        });
                    }
                }
                if (!conversation) {
                    if (typeof callback === 'function')
                        callback({ error: 'Conversation not found' });
                    return;
                }
                const isParticipant = socket.data.user?.role === 'admin' ||
                    conversation.participants.some((p) => p.toString() === userId);
                if (!isParticipant) {
                    if (typeof callback === 'function')
                        callback({ error: 'Not authorized in conversation' });
                    return;
                }
                const effectiveReceiverId = receiverId ||
                    conversation.participants.find((p) => p.toString() !== userId)?.toString();
                const newMessage = new messagemodel_1.default({
                    senderId: userId,
                    receiverId: effectiveReceiverId,
                    conversationId: conversation._id,
                    message: message.trim(),
                });
                conversation.messages.push(newMessage._id);
                conversation.lastMessage = newMessage.message;
                await Promise.all([conversation.save(), newMessage.save()]);
                await newMessage.populate('senderId', 'name email');
                io?.to(`conversation:${conversation._id}`).emit('receiveMessage', newMessage);
                if (effectiveReceiverId) {
                    io?.to(`user:${effectiveReceiverId}`).emit('receiveMessage', newMessage);
                }
                if (typeof callback === 'function') {
                    callback({ success: true, message: newMessage });
                }
            }
            catch (error) {
                if (typeof callback === 'function') {
                    callback({ error: error.message });
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