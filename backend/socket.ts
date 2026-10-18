import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/usermodel';
import Conversation from './models/conversationmodel';
import Message from './models/messagemodel';
import { Types } from 'mongoose';

let io: Server | undefined;

// Map user ID to Set of socket IDs to support multiple devices/tabs
const userSocketMap = new Map<string, Set<string>>();

export const initializeSocket = (server: HttpServer): Server => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.SOCKET_CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://quickclinic.vercel.app',
  ];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          defaultOrigins.includes(origin) ||
          /^https:\/\/quickclinic-[a-z0-9-]+-karan-aggarwals-projects\.vercel\.app$/.test(origin)
        ) {
          return callback(null, origin);
        }
        return callback(null, origin); // Fallback for local testing
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Authentication Middleware for Socket Handshake
  io.use(async (socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Also check cookies in handshake headers
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

      // Check auth header
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
      const decoded = jwt.verify(token, jwtSecret) as { id: string };

      const user = await User.findById(decoded.id).select('_id name email role');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = user;
      next();
    } catch (err: any) {
      return next(new Error('Authentication error: ' + (err.message || 'Invalid token')));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?._id?.toString();
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // Add socket to multi-device map
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId)!.add(socket.id);

    // Auto-join personal user room for targeted notifications
    socket.join(`user:${userId}`);

    // Join authorized conversation room
    socket.on('joinConversation', async ({ conversationId }: { conversationId: string }) => {
      try {
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const isParticipant =
          socket.data.user?.role === 'admin' ||
          conversation.participants.some((p: any) => p.toString() === userId);

        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('joinedConversation', { conversationId });
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // Leave conversation room
    socket.on('leaveConversation', ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Presence check for authorized relationship
    socket.on(
      'checkPresence',
      ({ targetUserId }: { targetUserId: string }, callback?: (res: any) => void) => {
        const isOnline = isUserOnline(targetUserId);
        if (typeof callback === 'function') {
          callback({ userId: targetUserId, isOnline });
        }
      }
    );

    // Canonical Send Message via Socket (validates, persists before broadcasting)
    socket.on(
      'sendMessage',
      async (
        data: { conversationId: string; message: string; receiverId?: string },
        callback?: (res: any) => void
      ) => {
        try {
          const { conversationId, message, receiverId } = data;
          if (!message || !message.trim()) {
            if (typeof callback === 'function') callback({ error: 'Message cannot be empty' });
            return;
          }

          let conversation;
          if (conversationId) {
            conversation = await Conversation.findById(conversationId);
          } else if (receiverId) {
            conversation = await Conversation.findOne({
              participants: { $all: [userId, receiverId] },
            });
            if (!conversation) {
              conversation = await Conversation.create({
                participants: [userId, receiverId],
              });
            }
          }

          if (!conversation) {
            if (typeof callback === 'function') callback({ error: 'Conversation not found' });
            return;
          }

          const isParticipant =
            socket.data.user?.role === 'admin' ||
            conversation.participants.some((p: any) => p.toString() === userId);

          if (!isParticipant) {
            if (typeof callback === 'function') callback({ error: 'Not authorized in conversation' });
            return;
          }

          const effectiveReceiverId =
            receiverId ||
            conversation.participants.find((p: any) => p.toString() !== userId)?.toString();

          const newMessage = new Message({
            senderId: userId,
            receiverId: effectiveReceiverId,
            conversationId: conversation._id,
            message: message.trim(),
          });

          conversation.messages.push(newMessage._id as Types.ObjectId);
          conversation.lastMessage = newMessage.message;

          await Promise.all([conversation.save(), newMessage.save()]);
          await newMessage.populate('senderId', 'name email');

          // Broadcast to conversation room and receiver user room
          io?.to(`conversation:${conversation._id}`).emit('receiveMessage', newMessage);
          if (effectiveReceiverId) {
            io?.to(`user:${effectiveReceiverId}`).emit('receiveMessage', newMessage);
          }

          if (typeof callback === 'function') {
            callback({ success: true, message: newMessage });
          }
        } catch (error: any) {
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
        }
      }
    );

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

export { io };

export const isUserOnline = (userId: string): boolean => {
  return (userSocketMap.get(userId)?.size || 0) > 0;
};

export const getReceiverSocketId = (receiverId: string): string | undefined => {
  const sockets = userSocketMap.get(receiverId);
  if (sockets && sockets.size > 0) {
    return Array.from(sockets)[0];
  }
  return undefined;
};

export const getReceiverSocketIds = (receiverId: string): string[] => {
  const sockets = userSocketMap.get(receiverId);
  return sockets ? Array.from(sockets) : [];
};

export const sendNotificationToUser = (userId: string, notification: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit('receiveNotification', notification);
  }
};

export const setupSocket = initializeSocket;
