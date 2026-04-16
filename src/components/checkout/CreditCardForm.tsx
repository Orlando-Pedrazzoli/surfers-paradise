'use client';

interface CreditCardFormProps {
  onSubmit: (data: Record<string, string>) => void;
}

export default function CreditCardForm({ onSubmit }: CreditCardFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Cartao de Credito</h3>
      <p className="text-sm text-gray-500">Formulario de cartao em construcao...</p>
    </div>
  );
}
