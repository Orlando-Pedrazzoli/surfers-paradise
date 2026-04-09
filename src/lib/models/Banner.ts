import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IBanner {
  _id: Types.ObjectId;
  title: string;
  image: string;
  mobileImage?: string;
  link?: string;
  position: 'hero' | 'mid_promo' | 'category' | 'brand';
  order: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    mobileImage: { type: String, default: '' },
    link: { type: String, default: '' },
    position: {
      type: String,
      enum: ['hero', 'mid_promo', 'category', 'brand'],
      required: true,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true },
);

bannerSchema.index({ position: 1, isActive: 1, order: 1 });

const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>('Banner', bannerSchema);

export default Banner;
