'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface CouponData {
  _id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom: string | Date;
  validUntil: string | Date;
  isActive: boolean;
}

interface CouponFormProps {
  coupon?: CouponData | null;
  onSaved: () => void;
  onCancel: () => void;
}

// Converte Date/ISO para o formato YYYY-MM-DD do input[type=date]
function toDateInput(value?: string | Date): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function CouponForm({
  coupon,
  onSaved,
  onCancel,
}: CouponFormProps) {
  const isEdit = Boolean(coupon?._id);
  const today = new Date().toISOString().slice(0, 10);

  const [code, setCode] = useState(coupon?.code || '');
  const [type, setType] = useState<'percentage' | 'fixed'>(
    coupon?.type || 'percentage',
  );
  const [value, setValue] = useState(coupon?.value?.toString() || '');
  const [minOrderValue, setMinOrderValue] = useState(
    coupon?.minOrderValue?.toString() || '',
  );
  const [maxDiscount, setMaxDiscount] = useState(
    coupon?.maxDiscount?.toString() || '',
  );
  const [usageLimit, setUsageLimit] = useState(
    coupon?.usageLimit?.toString() || '',
  );
  const [validFrom, setValidFrom] = useState(
    toDateInput(coupon?.validFrom) || today,
  );
  const [validUntil, setValidUntil] = useState(toDateInput(coupon?.validUntil));
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Informe o código');
      return;
    }
    const numValue = parseFloat(value);
    if (!numValue || numValue <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    if (type === 'percentage' && numValue > 100) {
      toast.error('Percentual não pode passar de 100%');
      return;
    }
    if (!validFrom || !validUntil) {
      toast.error('Preencha as datas de validade');
      return;
    }
    if (new Date(validUntil) <= new Date(validFrom)) {
      toast.error('A data final deve ser após a inicial');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: numValue,
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : 0,
      usageLimit: usageLimit ? parseInt(usageLimit) : 0,
      validFrom,
      validUntil,
      isActive,
    };

    setSaving(true);
    try {
      const url = isEdit ? `/api/coupons/${coupon!._id}` : '/api/coupons';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Erro ao salvar cupom');
        return;
      }
      toast.success(isEdit ? 'Cupom atualizado!' : 'Cupom criado!');
      onSaved();
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/50';

  return (
    <div className='space-y-4'>
      <Input
        id='cf-code'
        label='CÓDIGO'
        placeholder='EX: VERAO20'
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
      />

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            TIPO
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value as 'percentage' | 'fixed')}
            className={selectClass}
          >
            <option value='percentage'>Percentual (%)</option>
            <option value='fixed'>Valor fixo (R$)</option>
          </select>
        </div>
        <Input
          id='cf-value'
          type='number'
          label={type === 'percentage' ? 'VALOR (%)' : 'VALOR (R$)'}
          placeholder={type === 'percentage' ? '10' : '50.00'}
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <Input
          id='cf-min'
          type='number'
          label='PEDIDO MÍN. (R$)'
          placeholder='0 = sem mínimo'
          value={minOrderValue}
          onChange={e => setMinOrderValue(e.target.value)}
        />
        <Input
          id='cf-max'
          type='number'
          label='DESC. MÁX. (R$)'
          placeholder='0 = sem teto'
          value={maxDiscount}
          onChange={e => setMaxDiscount(e.target.value)}
        />
      </div>

      <Input
        id='cf-limit'
        type='number'
        label='LIMITE DE USOS'
        placeholder='0 = ilimitado'
        value={usageLimit}
        onChange={e => setUsageLimit(e.target.value)}
      />

      <div className='grid grid-cols-2 gap-3'>
        <Input
          id='cf-from'
          type='date'
          label='VÁLIDO DE'
          value={validFrom}
          onChange={e => setValidFrom(e.target.value)}
        />
        <Input
          id='cf-until'
          type='date'
          label='VÁLIDO ATÉ'
          value={validUntil}
          onChange={e => setValidUntil(e.target.value)}
        />
      </div>

      <label className='flex cursor-pointer items-center gap-2'>
        <input
          type='checkbox'
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
          className='h-4 w-4 accent-[#FF6600]'
        />
        <span className='text-sm text-gray-700'>Cupom ativo</span>
      </label>

      <div className='flex gap-3 pt-2'>
        <Button variant='outline' onClick={onCancel} className='flex-1'>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={saving} className='flex-1'>
          {isEdit ? 'Salvar alterações' : 'Criar cupom'}
        </Button>
      </div>
    </div>
  );
}
