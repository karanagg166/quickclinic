import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Conversation from '../models/conversationmodel';
import Message from '../models/messagemodel';
import User from '../models/usermodel';
import { io } from '../socket';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import { AuthRequest } from '../middleware/auth';
import ErrorHander from '../utils/errorhander';

import { sendMessageService } from '../services/messageservice';

export const sendMessage = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { message, receiverId, conversationId, idempotencyKey } = req.body;
    const clientKey = idempotencyKey || (req.headers['x-idempotency-key'] as string);
    // Derive verified sender directly from authenticated session
    const senderId = req.user?._id?.toString();

    if (!senderId) {
      return next(new ErrorHander('Authentication required', 401));
    }

    const result = await sendMessageService({
      senderId,
      senderRole: req.user?.role,
      conversationId,
      receiverId,
      message,
      idempotencyKey: clientKey,
    });

    if (result.duplicate) {
      return res.status(200).json(result.message);
    }

    // Emit via Socket.io with deduplicated room union so receivers in both rooms receive once
    try {
      if (io) {
        io.to(`conversation:${result.conversationId}`)
          .to(`user:${result.effectiveReceiverId}`)
          .emit('receiveMessage', result.message);
      }
    } catch (socketError) {
      console.error('Socket broadcast error (non-fatal):', socketError);
    }

    return res.status(201).json(result.message);
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
