import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  className?: string;
}

export default function PriceDisplay({ price, originalPrice, className }: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className="text-xl font-bold text-gray-900">{formatCurrency(price)}</span>
      {hasDiscount && <span className="text-sm text-gray-500 line-through">{formatCurrency(originalPrice)}</span>}
    </div>
  );
}
