'use client';
import { useState } from 'react';

interface AddressFormProps {
  onSubmit: (address: Record<string, string>) => void;
  initialData?: Record<string, string>;
}

export default function AddressForm({ onSubmit, initialData }: AddressFormProps) {
  const [cep, setCep] = useState(initialData?.cep || '');

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Endereco de Entrega</h3>
      <p className="text-sm text-gray-500">Formulario de endereco em construcao...</p>
    </div>
  );
}
