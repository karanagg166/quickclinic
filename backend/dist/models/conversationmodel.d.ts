import mongoose, { Document, Types } from "mongoose";
export interface IConversation extends Document {
    participants: Types.ObjectId[];
    messages: Types.ObjectId[];
    lastMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IConversation, {}, {}, {}, mongoose.Document<unknown, {}, IConversation, {}, {}> & IConversation & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=conversationmodel.d.ts.map