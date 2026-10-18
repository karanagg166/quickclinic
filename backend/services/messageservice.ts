import { Types } from 'mongoose';
import Conversation from '../models/conversationmodel';
import Message, { IMessage } from '../models/messagemodel';
import User from '../models/usermodel';
import ErrorHander from '../utils/errorhander';

export interface SendMessageParams {
  senderId: string;
  senderRole?: string;
  conversationId?: string;
  receiverId?: string;
  message: string;
  idempotencyKey?: string;
}

export interface SendMessageResult {
  success: boolean;
  message: IMessage;
  conversationId: string;
  effectiveReceiverId: string;
  duplicate: boolean;
}

/**
 * Shared message sending service enforcing recipient authorization,
 * idempotency, persistence integrity, and conversation membership across REST and Socket.IO.
 */
export const sendMessageService = async (
  params: SendMessageParams
): Promise<SendMessageResult> => {
  const { senderId, senderRole, conversationId, receiverId, message, idempotencyKey } = params;

  // 1. Authenticated sender validation
  if (!senderId || !Types.ObjectId.isValid(senderId)) {
    throw new ErrorHander('Valid authenticated sender ID is required', 401);
  }

  // 2. Message content validation
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new ErrorHander('Message content cannot be empty', 400);
  }

  if (message.length > 2000) {
    throw new ErrorHander('Message cannot exceed 2000 characters', 400);
  }

  // 3. Idempotency check: if client sent idempotencyKey and message already exists
  const trimmedKey = idempotencyKey?.trim();
  if (trimmedKey) {
    const existing = await Message.findOne({
      senderId,
      idempotencyKey: trimmedKey,
    }).populate('senderId', 'name email');

    if (existing) {
      return {
        success: true,
        message: existing,
        conversationId: existing.conversationId.toString(),
        effectiveReceiverId: existing.receiverId.toString(),
        duplicate: true,
      };
    }
  }

  // 4. Conversation & Recipient derivation and membership authorization
  let conversation: any;
  let effectiveReceiverId: string | undefined;

  if (conversationId) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new ErrorHander('Invalid conversation ID', 400);
    }

    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new ErrorHander('Conversation not found', 404);
    }

    // Membership check: sender must be in participants (or admin)
    const isSenderParticipant = conversation.participants.some(
      (p: any) => p.toString() === senderId
    );
    if (!isSenderParticipant && senderRole !== 'admin') {
      throw new ErrorHander('Not authorized to send messages to this conversation', 403);
    }

    // Recipient consistency check:
    // If client supplied receiverId, it MUST be a participant in this conversation
    if (receiverId) {
      if (!Types.ObjectId.isValid(receiverId)) {
        throw new ErrorHander('Invalid receiver ID', 400);
      }

      if (receiverId === senderId) {
        throw new ErrorHander('Cannot send message to yourself', 400);
      }

      const isReceiverInConversation = conversation.participants.some(
        (p: any) => p.toString() === receiverId
      );

      if (!isReceiverInConversation) {
        throw new ErrorHander('Receiver is not a participant in this conversation', 400);
      }

      effectiveReceiverId = receiverId;
    } else {
      // Derive recipient strictly from authorized conversation participants
      effectiveReceiverId = conversation.participants
        .find((p: any) => p.toString() !== senderId)
        ?.toString();

      if (!effectiveReceiverId) {
        throw new ErrorHander('No other participant found in this conversation', 400);
      }
    }
  } else {
    // No conversationId provided: must have a valid receiverId
    if (!receiverId || !Types.ObjectId.isValid(receiverId)) {
      throw new ErrorHander('Receiver ID or conversation ID required', 400);
    }

    if (receiverId === senderId) {
      throw new ErrorHander('Cannot send message to yourself', 400);
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new ErrorHander('Receiver user not found', 404);
    }

    // Look for existing conversation or create new
    conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    effectiveReceiverId = receiverId;
  }

  // 5. Message creation & persistence
  const newMessage = new Message({
    senderId,
    receiverId: effectiveReceiverId,
    conversationId: conversation._id,
    message: message.trim(),
    idempotencyKey: trimmedKey || undefined,
  });

  conversation.messages.push(newMessage._id as Types.ObjectId);
  conversation.lastMessage = newMessage.message;

  try {
    await Promise.all([conversation.save(), newMessage.save()]);
  } catch (err: any) {
    // If concurrent duplicate insert on unique idempotencyKey index
    if (err.code === 11000 && trimmedKey) {
      const existing = await Message.findOne({
        senderId,
        idempotencyKey: trimmedKey,
      }).populate('senderId', 'name email');
      if (existing) {
        return {
          success: true,
          message: existing,
          conversationId: existing.conversationId.toString(),
          effectiveReceiverId: existing.receiverId.toString(),
          duplicate: true,
        };
      }
    }

    // Rollback orphaned message if conversation save rejected
    if (newMessage._id) {
      await Message.findByIdAndDelete(newMessage._id).catch(() => {});
    }

    throw new ErrorHander(`Failed to persist message: ${err.message}`, 500);
  }

  // Populate sender info for response and broadcast
  await newMessage.populate('senderId', 'name email');

  return {
    success: true,
    message: newMessage,
    conversationId: conversation._id.toString(),
    effectiveReceiverId: effectiveReceiverId!,
    duplicate: false,
  };
};
