import mongoose, { Document, Types } from "mongoose";
export interface ITimeSlot {
    startTime: string;
    endTime: string;
}
export interface IOccupiedTimeSlot {
    timeSlot: string;
    appointmentId: Types.ObjectId;
}
export interface IOccupiedSlot {
    date: Date;
    timeSlots: IOccupiedTimeSlot[];
}
export interface IDoctorSchedule extends Document {
    doctor: Types.ObjectId;
    schedule: {
        morning: ITimeSlot[];
        evening: ITimeSlot[];
    };
    occupiedSlots: IOccupiedSlot[];
}
declare const _default: mongoose.Model<IDoctorSchedule, {}, {}, {}, mongoose.Document<unknown, {}, IDoctorSchedule, {}, {}> & IDoctorSchedule & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=doctorschedulemodel.d.ts.map