import { Types } from 'mongoose';

export interface IBrand {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}
