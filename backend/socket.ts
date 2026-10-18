import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import User from './models/usermodel';
import Conversation from './models/conversationmodel';
import { isOriginAllowed } from './utils/origin';
import { sendMessageService } from './services/messageservice';

let io: Server | undefined;

// Map user ID to Set of socket IDs to support multiple devices/tabs
const userSocketMap = new Map<string, Set<string>>();

export const initializeSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          if (isOriginAllowed(undefined)) {
            return callback(null, true);
          }
          return callback(new Error('CORS: Missing Origin header'), false);
        }
        if (isOriginAllowed(origin)) {
          return callback(null, origin);
        }
        return callback(new Error('CORS: Origin not allowed'), false);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Handshake-level validation covering WebSocket transport (cannot be bypassed by transport switch)
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      const allowed = isOriginAllowed(origin);
      if (!allowed) {
        return callback('Origin not allowed', false);
      }
      return callback(null, true);
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Handshake Origin & Authentication Middleware
  io.use(async (socket: Socket, next) => {
    try {
      const origin = socket.handshake.headers.origin;
      if (!isOriginAllowed(origin)) {
        return next(new Error('Authentication error: Origin not allowed'));
      }

      let token = socket.handshake.auth?.token;

      // Check cookies in handshake headers
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

      // Strict JWT verification without production fallback secret
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('Authentication error: Server authentication configuration missing'));
      }

      const decoded = jwt.verify(token, jwtSecret) as { id: string };

      if (!decoded || !decoded.id || !Types.ObjectId.isValid(decoded.id)) {
        return next(new Error('Authentication error: Invalid token'));
      }

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
        if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
          socket.emit('error', { message: 'Invalid conversation ID' });
          return;
        }

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
        socket.emit('error', { message: err.message || 'Error joining conversation' });
      }
    });

    // Leave conversation room
    socket.on('leaveConversation', ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Presence check: authorized strictly by conversation relationship to prevent enumeration
    socket.on(
      'checkPresence',
      async (
        data: { targetUserId: string; conversationId?: string },
        callback?: (res: any) => void
      ) => {
        if (typeof callback !== 'function') return;

        const { targetUserId, conversationId } = data || {};
        if (
          !targetUserId ||
          typeof targetUserId !== 'string' ||
          !Types.ObjectId.isValid(targetUserId)
        ) {
          return callback({ error: 'Invalid or missing target user ID' });
        }

        // Checking own presence is always permitted
        if (targetUserId === userId) {
          return callback({
            userId: targetUserId,
            isOnline: isUserOnline(targetUserId),
          });
        }

        try {
          let authorized = false;

          if (socket.data.user?.role === 'admin') {
            authorized = true;
          } else if (conversationId && Types.ObjectId.isValid(conversationId)) {
            const conv = await Conversation.findOne({
              _id: conversationId,
              participants: { $all: [userId, targetUserId] },
            });
            if (conv) authorized = true;
          } else {
            const sharedConv = await Conversation.findOne({
              participants: { $all: [userId, targetUserId] },
            });
            if (sharedConv) authorized = true;
          }

          if (!authorized) {
            return callback({
              error: 'Not authorized to inspect presence for this user',
            });
          }

          return callback({
            userId: targetUserId,
            isOnline: isUserOnline(targetUserId),
          });
        } catch {
          return callback({ error: 'Failed to verify presence relationship' });
        }
      }
    );

    // Canonical Send Message via Socket (shared service, transactional persist, deduplicated broadcast)
    socket.on(
      'sendMessage',
      async (
        data: {
          conversationId?: string;
          message: string;
          receiverId?: string;
          idempotencyKey?: string;
        },
        callback?: (res: any) => void
      ) => {
        try {
          const { conversationId, message, receiverId, idempotencyKey } = data || {};

          // Delegate to shared messaging service with verified sender identity
          const result = await sendMessageService({
            senderId: userId,
            senderRole: socket.data.user?.role,
            conversationId,
            receiverId,
            message,
            idempotencyKey,
          });

          // If duplicate from idempotencyKey, return acknowledged existing message without rebroadcast
          if (result.duplicate) {
            if (typeof callback === 'function') {
              callback({ success: true, message: result.message, duplicate: true });
            }
            return;
          }

          // Broadcast to room union excluding sender socket:
          // Sockets joined to both conversation room and user room receive exactly 1 copy.
          // Sender socket receives acknowledgment and 0 echo messages.
          socket
            .to(`conversation:${result.conversationId}`)
            .to(`user:${result.effectiveReceiverId}`)
            .emit('receiveMessage', result.message);

          if (typeof callback === 'function') {
            callback({ success: true, message: result.message });
          }
        } catch (error: any) {
          if (typeof callback === 'function') {
            callback({
              error: error.message || 'Failed to send message',
              statusCode: error.statusCode || 500,
            });
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
