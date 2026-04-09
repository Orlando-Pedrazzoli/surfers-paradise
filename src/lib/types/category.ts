import { Types } from 'mongoose';

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: Types.ObjectId | null;
  level: number;
  order: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}
