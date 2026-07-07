// 📄 src/lib/models/Review.ts
// v2: isVerifiedPurchase (selo "compra verificada" — setado pelo servidor
//     quando o cliente tem pedido delivered com o produto).
// v2: índice único PARCIAL {product, user} — uma avaliação por produto por
//     cliente. Parcial (só quando user existe) para não conflitar com
//     avaliações de loja (isStoreReview) ou legadas sem user.
// ⚠️ Adicionar na interface IReview (lib/types/review.ts):
//     isVerifiedPurchase?: boolean;

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
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, isApproved: 1 });
reviewSchema.index({ isStoreReview: 1, isApproved: 1, rating: -1 });
// Uma avaliação por produto por cliente (só quando há user)
reviewSchema.index(
  { product: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } },
);

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);

export default Review;
