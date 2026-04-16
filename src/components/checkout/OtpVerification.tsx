'use client';
import { useState } from 'react';

interface OtpVerificationProps {
  email: string;
  onVerify: (code: string) => void;
}

export default function OtpVerification({ email, onVerify }: OtpVerificationProps) {
  const [code, setCode] = useState('');
  return (
    <div className="space-y-4 text-center">
      <h3 className="font-semibold">Verificacao por E-mail</h3>
      <p className="text-sm text-gray-500">Enviamos um codigo para <strong>{email}</strong></p>
      <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-2xl tracking-[0.5em] border rounded-lg px-4 py-3 w-48 mx-auto block" maxLength={6} />
      <button onClick={() => code.length === 6 && onVerify(code)} className="bg-[#FF6600] text-white px-6 py-2 rounded-lg text-sm">Verificar</button>
    </div>
  );
}
