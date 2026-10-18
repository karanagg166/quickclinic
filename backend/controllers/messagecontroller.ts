import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Conversation from '../models/conversationmodel';
import Message from '../models/messagemodel';
import User from '../models/usermodel';
import { io } from '../socket';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import { AuthRequest } from '../middleware/auth';
import ErrorHander from '../utils/errorhander';

export const sendMessage = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { message, receiverId, conversationId } = req.body;
    // Derive verified sender directly from authenticated session
    const senderId = req.user?._id?.toString();

    if (!senderId) {
      return next(new ErrorHander('Authentication required', 401));
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return next(new ErrorHander('Message content cannot be empty', 400));
    }

    if (message.length > 2000) {
      return next(new ErrorHander('Message cannot exceed 2000 characters', 400));
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return next(new ErrorHander('Conversation not found', 404));
      }

      // Check membership
      const isParticipant = conversation.participants.some(
        (p: any) => p.toString() === senderId
      );
      if (!isParticipant && req.user?.role !== 'admin') {
        return next(new ErrorHander('Not authorized to send messages to this conversation', 403));
      }
    } else {
      if (!receiverId) {
        return next(new ErrorHander('Receiver ID or conversation ID required', 400));
      }

      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return next(new ErrorHander('Receiver user not found', 404));
      }

      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
        });
      }
    }

    // Determine target receiver
    const effectiveReceiverId =
      receiverId ||
      conversation.participants.find((p: any) => p.toString() !== senderId)?.toString();

    const newMessage = new Message({
      senderId,
      receiverId: effectiveReceiverId,
      conversationId: conversation._id,
      message: message.trim(),
    });

    conversation.messages.push(newMessage._id as Types.ObjectId);
    conversation.lastMessage = newMessage.message;

    // Persist before publishing
    await Promise.all([conversation.save(), newMessage.save()]);

    // Populate sender info for canonical client response and realtime broadcast
    await newMessage.populate('senderId', 'name email');

    // Emit via Socket.io to conversation room and receiver room if socket server is active
    try {
      if (io) {
        io.to(`conversation:${conversation._id}`).emit('receiveMessage', newMessage);
        if (effectiveReceiverId) {
          io.to(`user:${effectiveReceiverId}`).emit('receiveMessage', newMessage);
        }
      }
    } catch (socketError) {
      console.error('Socket broadcast error (non-fatal):', socketError);
    }

    return res.status(201).json(newMessage);
  }
);

export const getMessages = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;
    const currentUserId = req.user?._id?.toString();

    const conversation = await Conversation.findById(conversationId).populate({
      path: 'messages',
      populate: {
        path: 'senderId',
        select: 'name email',
      },
      options: {
        sort: { createdAt: -1 },
      },
    });

    if (!conversation) {
      return res.status(200).json([]);
    }

    // Verify membership
    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === currentUserId
    );
    if (!isParticipant && req.user?.role !== 'admin') {
      return next(new ErrorHander('Not authorized to access messages in this conversation', 403));
    }

    return res.status(200).json(conversation.messages);
  }
);

export const getconversations = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params; // The ID of the requesting user
    const currentUserId = req.user?._id?.toString();

    if (!id) {
      return next(new ErrorHander('User ID is required', 400));
    }

    if (req.user?.role !== 'admin' && currentUserId !== id) {
      return next(new ErrorHander('Not authorized to view conversations for another user', 403));
    }

    const conversations = await Conversation.find({
      participants: { $in: [id] },
    })
      .populate('participants', 'name email')
      .sort({ updatedAt: -1 });

    const formattedConversations = conversations
      .map((conversation) => {
        const otherParticipant = conversation.participants.find(
          (participant: any) => participant._id.toString() !== id
        );

        if (!otherParticipant) {
          return null;
        }

        return {
          conversationId: conversation._id,
          otherParticipantId: otherParticipant._id,
          otherParticipantName: (otherParticipant as any).name || 'Unknown',
          lastMessage: conversation.lastMessage || null,
          updatedAt: (conversation as any).updatedAt,
        };
      })
      .filter((conv) => conv !== null);

    return res.status(200).json(formattedConversations);
  }
);

export const lastmessage = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;
    const currentUserId = req.user?._id?.toString();

    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: 'messages',
        options: { sort: { createdAt: -1 }, limit: 1 },
      })
      .exec();

    if (!conversation) {
      return next(new ErrorHander('Conversation not found', 404));
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === currentUserId
    );
    if (!isParticipant && req.user?.role !== 'admin') {
      return next(new ErrorHander('Not authorized to access this conversation', 403));
    }

    if (!conversation.messages.length) {
      return res.status(200).json({
        success: true,
        lastMessage: null,
      });
    }

    return res.status(200).json({
      success: true,
      lastMessage: conversation.messages[0],
    });
  }
);

export const groupids = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;
    const currentUserId = req.user?._id?.toString();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new ErrorHander('Conversation not found', 404));
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === currentUserId
    );
    if (!isParticipant && req.user?.role !== 'admin') {
      return next(new ErrorHander('Not authorized to access this conversation', 403));
    }

    const participantsInfo = await User.find({ _id: { $in: conversation.participants } }).select(
      '_id name email role city'
    );

    return res.status(200).json({
      success: true,
      participants: participantsInfo,
    });
  }
);
