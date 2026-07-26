// 📄 src/components/checkout/CouponInput.tsx
// v3 (cupons restritos por categoria/marca):
// - Envia os ITENS do carrinho (não só o subtotal) ao /api/coupons/validate —
//   necessário para o servidor determinar a elegibilidade por categoria/marca.
// - Guarda no CartProvider o AppliedCoupon no formato novo, com o discount
//   CALCULADO PELO SERVIDOR + eligibleCount/totalCount/isRestricted.
// - Chip do cupom ativo mostra "válido para X de Y itens" quando o cupom é
//   restrito e o carrinho é misto.
// - Exibe o couponNotice do CartProvider (cupom removido automaticamente
//   porque o carrinho mudou e deixou de ter itens elegíveis).
//
// v2: componente autossuficiente — valida em /api/coupons/validate, aplica
// no CartProvider, mostra loading/erro, e exibe chip removível quando há
// cupom ativo. Uso: <CouponInput /> (sem props).
'use client';
import { useState } from 'react';
import { Tag, X, Loader2, Info } from 'lucide-react';
import { useCart } from '@/lib/context/CartProvider';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface ValidateResponse {
  valid: boolean;
  message?: string;
  code?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  discount?: number;
  eligibleSubtotal?: number;
  eligibleCount?: number;
  totalCount?: number;
  isRestricted?: boolean;
}

export default function CouponInput() {
  const {
    items,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discount,
    couponNotice,
    clearCouponNotice,
  } = useCart();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleApply() {
    const normalized = code.trim().toUpperCase();
    if (!normalized || loading) return;
    setError('');
    clearCouponNotice();
    setLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: normalized,
          items: items.map(i => ({
            productId: i.productId,
            sku: i.sku,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });
      const data: ValidateResponse = await res.json();
      if (
        !data.valid ||
        !data.code ||
        !data.type ||
        data.value == null ||
        data.discount == null
      ) {
        setError(data.message || 'Cupom inválido');
        return;
      }
      applyCoupon({
        code: data.code,
        type: data.type,
        value: data.value,
        minOrderValue: data.minOrderValue ?? 0,
        maxDiscount: data.maxDiscount ?? 0,
        discount: data.discount,
        eligibleCount: data.eligibleCount ?? items.length,
        totalCount: data.totalCount ?? items.length,
        isRestricted: data.isRestricted ?? false,
      });
      setCode('');
    } catch {
      setError('Erro ao validar o cupom. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Cupom ativo: chip com o código, o desconto atual e o X para remover
  if (appliedCoupon) {
    const partial =
      appliedCoupon.isRestricted &&
      appliedCoupon.eligibleCount < appliedCoupon.totalCount;
    return (
      <div className='space-y-1.5'>
        <div className='flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2'>
          <div className='flex items-center gap-2 text-sm'>
            <Tag className='h-4 w-4 text-green-600' />
            <span className='font-semibold text-green-700'>
              {appliedCoupon.code}
            </span>
            {discount > 0 && (
              <span className='text-green-600'>
                (- {formatCurrency(discount)})
              </span>
            )}
          </div>
          <button
            type='button'
            onClick={removeCoupon}
            aria-label='Remover cupom'
            className='rounded p-1 text-green-700 transition hover:bg-green-100'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        {partial && (
          <p className='flex items-center gap-1 text-xs text-gray-500'>
            <Info className='h-3.5 w-3.5 shrink-0' />
            Desconto válido para {appliedCoupon.eligibleCount} de{' '}
            {appliedCoupon.totalCount} itens do carrinho
          </p>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-1.5'>
      <div className='flex gap-2'>
        <input
          type='text'
          value={code}
          onChange={e => {
            setCode(e.target.value.toUpperCase());
            if (error) setError('');
            if (couponNotice) clearCouponNotice();
          }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder='Cupom de desconto'
          className='flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#FF6600]'
        />
        <button
          type='button'
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className='flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm text-white transition hover:bg-black disabled:opacity-50'
        >
          {loading && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
          {loading ? 'Validando...' : 'Aplicar'}
        </button>
      </div>
      {error && <p className='text-xs text-red-600'>{error}</p>}
      {!error && couponNotice && (
        <p className='flex items-center gap-1 text-xs text-amber-600'>
          <Info className='h-3.5 w-3.5 shrink-0' />
          {couponNotice}
        </p>
      )}
    </div>
  );
}
