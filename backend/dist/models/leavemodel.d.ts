import mongoose, { Document, Types } from "mongoose";
export interface ILeave extends Document {
    doctor: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    reason?: string;
}
declare const _default: mongoose.Model<ILeave, {}, {}, {}, mongoose.Document<unknown, {}, ILeave, {}, {}> & ILeave & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=leavemodel.d.ts.map