import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '@/lib/types';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    cpf: { type: String, default: '' },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isEmailVerified: { type: Boolean, default: false },
    addresses: [{ type: Schema.Types.ObjectId, ref: 'Address' }],
    defaultAddress: { type: Schema.Types.ObjectId, ref: 'Address' },
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: { type: Date },
  },
  { timestamps: true },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
