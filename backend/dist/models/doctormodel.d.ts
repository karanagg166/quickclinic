import mongoose, { Document, Types } from "mongoose";
export interface IDoctor extends Document {
    user: Types.ObjectId;
    specialization: string;
    experience: number;
    fees: number;
}
declare const Doctor: mongoose.Model<IDoctor, {}, {}, {}, mongoose.Document<unknown, {}, IDoctor, {}, {}> & IDoctor & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Doctor;
//# sourceMappingURL=doctormodel.d.ts.map