'use client';
import { useState } from 'react';

interface CouponInputProps {
  onApply: (code: string) => void;
}

export default function CouponInput({ onApply }: CouponInputProps) {
  const [code, setCode] = useState('');
  return (
    <div className="flex gap-2">
      <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Cupom de desconto" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
      <button onClick={() => code.trim() && onApply(code.trim())} className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm hover:bg-black">Aplicar</button>
    </div>
  );
}
