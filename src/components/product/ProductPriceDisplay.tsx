import { formatCurrency } from '@/lib/utils/formatCurrency';
import { calculateInstallments } from '@/lib/utils/installments';

interface ProductPriceDisplayProps {
  price: number;
  originalPrice?: number;
}

export default function ProductPriceDisplay({
  price,
  originalPrice,
}: ProductPriceDisplayProps) {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const installment = calculateInstallments(price);

  return (
    <div className='space-y-1'>
      {originalPrice && originalPrice > price && (
        <p className='text-sm text-gray-500 line-through'>
          {formatCurrency(originalPrice)}
        </p>
      )}
      <p className='text-2xl font-bold text-gray-900'>
        {formatCurrency(price)}
      </p>
      {discount > 0 && (
        <span className='text-sm font-semibold text-green-600'>
          {discount}% OFF
        </span>
      )}
      {installment.count > 1 && (
        <p className='text-sm text-gray-500'>
          {installment.count}x de {formatCurrency(installment.value)} sem juros
        </p>
      )}
    </div>
  );
}
