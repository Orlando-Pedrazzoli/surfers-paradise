import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ISubscriber {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  birthday?: Date | null;
  consent: boolean;
  source: string;
  couponCode?: string;
  status: 'active' | 'unsubscribed';
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, default: '', trim: true },
    birthday: { type: Date, default: null },
    consent: { type: Boolean, required: true, default: false },
    source: { type: String, default: 'newsletter_modal' },
    couponCode: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
      index: true,
    },
    ip: { type: String, default: '' },
  },
  { timestamps: true },
);

subscriberSchema.index({ createdAt: -1 });

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ||
  mongoose.model<ISubscriber>('Subscriber', subscriberSchema);

export default Subscriber;
