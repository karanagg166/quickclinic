import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILeave extends Document {
  doctor: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status?: string;
}

const leaveSchema = new Schema<ILeave>({
  doctor: {
    type: Schema.Types.ObjectId,
    ref: "Doctor", // Reference to the Doctor model
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Approved',
  },
});

export default mongoose.model<ILeave>("Leave", leaveSchema);
