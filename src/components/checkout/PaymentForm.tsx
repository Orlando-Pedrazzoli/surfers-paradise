'use client';

interface PaymentFormProps {
  total: number;
  onSubmit: (method: string) => void;
}

export default function PaymentForm({ total, onSubmit }: PaymentFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Forma de Pagamento</h3>
      <div className="grid gap-3">
        <button onClick={() => onSubmit('credit_card')} className="p-4 border rounded-lg text-left hover:border-[#FF6600]">Cartao de Credito</button>
        <button onClick={() => onSubmit('boleto')} className="p-4 border rounded-lg text-left hover:border-[#FF6600]">Boleto Bancario</button>
        <button onClick={() => onSubmit('pix')} className="p-4 border rounded-lg text-left hover:border-[#FF6600]">PIX</button>
      </div>
    </div>
  );
}
