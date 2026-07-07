// 📄 src/lib/services/reviews.ts
// Regras compartilhadas de avaliações — Surfers Paradise

import mongoose from 'mongoose';
import Review from '@/lib/models/Review';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

/**
 * Recalcula averageRating/reviewCount do produto a partir das avaliações
 * APROVADAS. Chamar em toda aprovação, reprovação e exclusão — é o que
 * reflete as avaliações no ProductCard, na página do produto e nos filtros.
 */
export async function recalcProductRating(
  productId: mongoose.Types.ObjectId | string,
): Promise<void> {
  const id = new mongoose.Types.ObjectId(String(productId));
  const [agg] = await Review.aggregate<{
    _id: null;
    avg: number;
    count: number;
  }>([
    { $match: { product: id, isApproved: true, isStoreReview: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { _id: id },
    {
      $set: {
        averageRating: agg ? Math.round(agg.avg * 10) / 10 : 0,
        reviewCount: agg?.count || 0,
      },
    },
  );
}

export type ReviewEligibility =
  | { canReview: true }
  | {
      canReview: false;
      reason: 'not_purchased' | 'not_delivered' | 'already_reviewed';
    };

/**
 * Só pode avaliar quem tem pedido DELIVERED contendo o produto — e uma
 * única vez por produto.
 */
export async function checkReviewEligibility(
  userId: string,
  productId: string,
): Promise<ReviewEligibility> {
  const existing = await Review.exists({ product: productId, user: userId });
  if (existing) return { canReview: false, reason: 'already_reviewed' };

  const delivered = await Order.exists({
    user: userId,
    status: 'delivered',
    'items.product': productId,
  });
  if (delivered) return { canReview: true };

  // Distinguir "comprou mas ainda não recebeu" de "nunca comprou"
  const purchased = await Order.exists({
    user: userId,
    'items.product': productId,
    'payment.status': 'paid',
  });
  return {
    canReview: false,
    reason: purchased ? 'not_delivered' : 'not_purchased',
  };
}
