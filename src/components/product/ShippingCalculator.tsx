'use client';
import { useState } from 'react';

interface ShippingCalculatorProps {
  productId: string;
}

export default function ShippingCalculator({ productId }: ShippingCalculatorProps) {
  const [cep, setCep] = useState('');

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Calcular frete</label>
      <div className="flex gap-2">
        <input type="text" value={cep} onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="00000-000" className="flex-1 border rounded-lg px-3 py-2 text-sm" maxLength={9} />
        <button className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm hover:bg-black">Calcular</button>
      </div>
    </div>
  );
}
