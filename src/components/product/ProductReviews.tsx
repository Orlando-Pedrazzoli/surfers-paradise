'use client';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Avaliacoes</h3>
      <p className="text-gray-500 text-sm">Nenhuma avaliacao ainda. Seja o primeiro a avaliar!</p>
    </div>
  );
}
