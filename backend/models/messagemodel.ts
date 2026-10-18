import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  conversationId: Types.ObjectId;
  message: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  idempotencyKey: {
    type: String,
    trim: true,
    index: true,
  },
}, { timestamps: true });

messageSchema.index(
  { senderId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model<IMessage>("Message", messageSchema);
