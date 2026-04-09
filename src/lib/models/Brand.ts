import mongoose, { Schema, Model } from 'mongoose';
import { IBrand } from '@/lib/types';

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { type: String, default: '' },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

brandSchema.index({ slug: 1 });

const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>('Brand', brandSchema);

export default Brand;
