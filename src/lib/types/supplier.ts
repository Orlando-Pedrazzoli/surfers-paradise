import { Types } from 'mongoose';

export interface ISupplier {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
