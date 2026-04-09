import mongoose, { Schema, Model } from 'mongoose';
import { IReview } from '@/lib/types';

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    comment: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
    isStoreReview: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, isApproved: 1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);

export default Review;
