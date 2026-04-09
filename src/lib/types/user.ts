import { Types } from 'mongoose';

export type UserRole = 'customer' | 'admin';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  cpf?: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  addresses: Types.ObjectId[];
  defaultAddress?: Types.ObjectId;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
