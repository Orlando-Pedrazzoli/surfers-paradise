import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IOtpVerification {
  _id: Types.ObjectId;
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const otpSchema = new Schema<IOtpVerification>(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpVerification: Model<IOtpVerification> =
  mongoose.models.OtpVerification ||
  mongoose.model<IOtpVerification>('OtpVerification', otpSchema);

export default OtpVerification;
