"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupids = exports.lastmessage = exports.getconversations = exports.getMessages = exports.sendMessage = void 0;
const conversationmodel_1 = __importDefault(require("../models/conversationmodel"));
const messagemodel_1 = __importDefault(require("../models/messagemodel"));
const usermodel_1 = __importDefault(require("../models/usermodel"));
const socket_1 = require("../socket");
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const errorhander_1 = __importDefault(require("../utils/errorhander"));
exports.sendMessage = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { message, receiverId, conversationId } = req.body;
    const senderId = req.user?._id?.toString();
    if (!senderId) {
        return next(new errorhander_1.default('Authentication required', 401));
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
        return next(new errorhander_1.default('Message content cannot be empty', 400));
    }
    if (message.length > 2000) {
        return next(new errorhander_1.default('Message cannot exceed 2000 characters', 400));
    }
    let conversation;
    if (conversationId) {
        conversation = await conversationmodel_1.default.findById(conversationId);
        if (!conversation) {
            return next(new errorhander_1.default('Conversation not found', 404));
        }
        const isParticipant = conversation.participants.some((p) => p.toString() === senderId);
        if (!isParticipant && req.user?.role !== 'admin') {
            return next(new errorhander_1.default('Not authorized to send messages to this conversation', 403));
        }
    }
    else {
        if (!receiverId) {
            return next(new errorhander_1.default('Receiver ID or conversation ID required', 400));
        }
        const receiver = await usermodel_1.default.findById(receiverId);
        if (!receiver) {
            return next(new errorhander_1.default('Receiver user not found', 404));
        }
        conversation = await conversationmodel_1.default.findOne({
            participants: { $all: [senderId, receiverId] },
        });
        if (!conversation) {
            conversation = await conversationmodel_1.default.create({
                participants: [senderId, receiverId],
            });
        }
    }
    const effectiveReceiverId = receiverId ||
        conversation.participants.find((p) => p.toString() !== senderId)?.toString();
    const newMessage = new messagemodel_1.default({
        senderId,
        receiverId: effectiveReceiverId,
        conversationId: conversation._id,
        message: message.trim(),
    });
    conversation.messages.push(newMessage._id);
    conversation.lastMessage = newMessage.message;
    await Promise.all([conversation.save(), newMessage.save()]);
    await newMessage.populate('senderId', 'name email');
    try {
        if (socket_1.io) {
            socket_1.io.to(`conversation:${conversation._id}`).emit('receiveMessage', newMessage);
            if (effectiveReceiverId) {
                socket_1.io.to(`user:${effectiveReceiverId}`).emit('receiveMessage', newMessage);
            }
        }
    }
    catch (socketError) {
        console.error('Socket broadcast error (non-fatal):', socketError);
    }
    return res.status(201).json(newMessage);
});
exports.getMessages = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { conversationId } = req.params;
    const currentUserId = req.user?._id?.toString();
    const conversation = await conversationmodel_1.default.findById(conversationId).populate({
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
    const isParticipant = conversation.participants.some((p) => p.toString() === currentUserId);
    if (!isParticipant && req.user?.role !== 'admin') {
        return next(new errorhander_1.default('Not authorized to access messages in this conversation', 403));
    }
    return res.status(200).json(conversation.messages);
});
exports.getconversations = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const currentUserId = req.user?._id?.toString();
    if (!id) {
        return next(new errorhander_1.default('User ID is required', 400));
    }
    if (req.user?.role !== 'admin' && currentUserId !== id) {
        return next(new errorhander_1.default('Not authorized to view conversations for another user', 403));
    }
    const conversations = await conversationmodel_1.default.find({
        participants: { $in: [id] },
    })
        .populate('participants', 'name email')
        .sort({ updatedAt: -1 });
    const formattedConversations = conversations
        .map((conversation) => {
        const otherParticipant = conversation.participants.find((participant) => participant._id.toString() !== id);
        if (!otherParticipant) {
            return null;
        }
        return {
            conversationId: conversation._id,
            otherParticipantId: otherParticipant._id,
            otherParticipantName: otherParticipant.name || 'Unknown',
            lastMessage: conversation.lastMessage || null,
            updatedAt: conversation.updatedAt,
        };
    })
        .filter((conv) => conv !== null);
    return res.status(200).json(formattedConversations);
});
exports.lastmessage = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { conversationId } = req.params;
    const currentUserId = req.user?._id?.toString();
    const conversation = await conversationmodel_1.default.findById(conversationId)
        .populate({
        path: 'messages',
        options: { sort: { createdAt: -1 }, limit: 1 },
    })
        .exec();
    if (!conversation) {
        return next(new errorhander_1.default('Conversation not found', 404));
    }
    const isParticipant = conversation.participants.some((p) => p.toString() === currentUserId);
    if (!isParticipant && req.user?.role !== 'admin') {
        return next(new errorhander_1.default('Not authorized to access this conversation', 403));
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
});
exports.groupids = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { conversationId } = req.params;
    const currentUserId = req.user?._id?.toString();
    const conversation = await conversationmodel_1.default.findById(conversationId);
    if (!conversation) {
        return next(new errorhander_1.default('Conversation not found', 404));
    }
    const isParticipant = conversation.participants.some((p) => p.toString() === currentUserId);
    if (!isParticipant && req.user?.role !== 'admin') {
        return next(new errorhander_1.default('Not authorized to access this conversation', 403));
    }
    const participantsInfo = await usermodel_1.default.find({ _id: { $in: conversation.participants } }).select('_id name email role city');
    return res.status(200).json({
        success: true,
        participants: participantsInfo,
    });
});
//# sourceMappingURL=messagecontroller.js.map