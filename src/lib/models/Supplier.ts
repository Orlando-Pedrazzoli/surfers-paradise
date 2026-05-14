import mongoose, { Schema, Model } from 'mongoose';
import { ISupplier } from '@/lib/types/supplier';

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    cnpj: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    contactPerson: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

supplierSchema.index({ name: 'text' });

const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplier>('Supplier', supplierSchema);

export default Supplier;
