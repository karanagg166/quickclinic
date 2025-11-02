import mongoose, { Document, Types } from "mongoose";
export interface IAppointment extends Document {
    doctor: Types.ObjectId;
    patient: Types.ObjectId;
    date: Date;
    time: string;
    fees: number;
    paid: boolean;
    appointmentNumber: string;
    status: 'Scheduled' | 'Canceled' | 'Completed';
}
declare const _default: mongoose.Model<IAppointment, {}, {}, {}, mongoose.Document<unknown, {}, IAppointment, {}, {}> & IAppointment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=appointmentmodel.d.ts.map