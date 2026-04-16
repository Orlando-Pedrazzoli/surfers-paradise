import { formatCurrency } from '@/lib/utils/formatCurrency';

interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
  discount?: number;
  total: number;
}

export default function CartSummary({ subtotal, shipping = 0, discount = 0, total }: CartSummaryProps) {
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
      {shipping > 0 && <div className="flex justify-between text-sm"><span>Frete</span><span>{formatCurrency(shipping)}</span></div>}
      {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>}
      <div className="flex justify-between font-bold text-lg border-t pt-3"><span>Total</span><span>{formatCurrency(total)}</span></div>
    </div>
  );
}
