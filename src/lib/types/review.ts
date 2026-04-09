import { Types } from 'mongoose';

export interface IReview {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user?: Types.ObjectId;
  name: string;
  email: string;
  city?: string;
  state?: string;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  isStoreReview: boolean;
  createdAt: Date;
}
