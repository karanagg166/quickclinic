import mongoose, { Document, Types } from "mongoose";
export interface IPatient extends Document {
    user: Types.ObjectId;
    medicalHistory?: string;
    allergies?: string;
    currentMedications?: string;
}
declare const _default: mongoose.Model<IPatient, {}, {}, {}, mongoose.Document<unknown, {}, IPatient, {}, {}> & IPatient & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=patientmodel.d.ts.map