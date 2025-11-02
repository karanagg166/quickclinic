import mongoose, { Document, Types } from "mongoose";
export interface INotification extends Document {
    sender: Types.ObjectId;
    userId: Types.ObjectId;
    type: string;
    content: string;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=notificationmodel.d.ts.map