import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Conversation from '../models/conversationmodel';
import Message from '../models/messagemodel';
import User from '../models/usermodel';
import { getReceiverSocketId, io } from '../socket';
import catchAsyncErrors from '../middleware/catchAsyncErrors';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message, receiverId, conversationId } = req.body;

    const { id: senderId } = req.params;

    let conversation;
    
    // If conversationId is provided, use it; otherwise find or create one
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
        });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      conversationId: conversation._id,
      message,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id as Types.ObjectId);
      conversation.lastMessage = newMessage.message;
    }

    // Save both conversation and message in parallel
    await Promise.all([conversation.save(), newMessage.save()]);

    // Populate sender info for real-time display
    await newMessage.populate('senderId', 'name');

    // Emit the message to the receiver via Socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    // console.log('Error in sendMessage controller:', (error as Error).message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = catchAsyncErrors(async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  // Fetch conversation and populate messages with sender info
  const conversation = await Conversation.findOne({
    _id: conversationId
  }).populate({
    path: 'messages',
    populate: {
      path: 'senderId',
      select: 'name'
    },
    options: {
      sort: { createdAt: -1 } // Sort messages by createdAt descending (newest first)
    }
  });

  if (!conversation) return res.status(200).json([]);

  // Send sorted messages as response
  res.status(200).json(conversation.messages);
});

export const getconversations = catchAsyncErrors(async (req: Request, res: Response) => {
  const { id } = req.params; // The ID of the requesting user

  // Find conversations where the user is one of the participants
  const conversations = await Conversation.find({
    participants: { $in: [id] },
  }).populate('participants', 'name'); // Populating participants' names from the User model

  // Create a list of conversations with the other participant's details (excluding the requesting user)
  const formattedConversations = conversations.map((conversation) => {
    // Find the other participant
    const otherParticipant = conversation.participants.find(
      (participant: any) => participant._id.toString() !== id
    );

    return {
      conversationId: conversation._id,
      otherParticipantId: otherParticipant._id,
      otherParticipantName: (otherParticipant as any).name,
      lastMessage: conversation.lastMessage
    };
  });

  // Send the formatted conversations as response
  res.status(200).json(formattedConversations);
});

export const lastmessage = catchAsyncErrors(async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  // Fetch the conversation by its ID
  const conversation = await Conversation.findById(conversationId)
    .populate({
      path: 'messages',
      options: { sort: { createdAt: -1 }, limit: 1 }, // Fetch the latest message
    })
    .exec();

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
    });
  }

  // Check if there are messages in the conversation
  if (!conversation.messages.length) {
    return res.status(404).json({
      success: false,
      message: 'No messages found for this conversation',
    });
  }

  // Return the last message
  const lastMessage = conversation.messages[0];

  res.status(200).json({
    success: true,
    lastMessage,
  });
});

export const groupids = catchAsyncErrors(async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  // Find the conversation by its ID
  const conversation = await Conversation.findById(conversationId);

  // Check if the conversation exists
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
    });
  }

  // Get the participant IDs
  const participantIds = conversation.participants;

  // Fetch the detailed information for each participant
  const participantsInfo = await User.find({ _id: { $in: participantIds } })
    .select('_id name email'); // Select only necessary fields (adjust as needed)

  // Send the array of participant details
  res.status(200).json({
    success: true,
    participants: participantsInfo,
  });
});
