// 📄 src/lib/types/user.ts
// v2 (Google OAuth):
// - password opcional: users criados via Google não têm senha.
// - provider: origem da conta ('credentials' | 'google').
// - image: avatar do perfil Google (opcional).
import { Types } from 'mongoose';

export type UserRole = 'customer' | 'admin';
export type AuthProvider = 'credentials' | 'google';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  provider?: AuthProvider;
  image?: string;
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
