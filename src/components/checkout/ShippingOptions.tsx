'use client';

interface ShippingOption {
  id: number;
  name: string;
  price: number;
  deliveryDays: number;
  company: string;
}

interface ShippingOptionsProps {
  options: ShippingOption[];
  selectedId?: number;
  onSelect: (option: ShippingOption) => void;
}

export default function ShippingOptions({ options, selectedId, onSelect }: ShippingOptionsProps) {
  if (!options.length) return <p className="text-sm text-gray-500">Informe o CEP para calcular o frete.</p>;
  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <button key={opt.id} onClick={() => onSelect(opt)} className={`w-full flex items-center justify-between p-4 border rounded-lg ${opt.id === selectedId ? 'border-[#FF6600] bg-orange-50' : 'border-gray-200'}`}>
          <div>
            <p className="font-medium text-sm">{opt.name} - {opt.company}</p>
            <p className="text-xs text-gray-500">{opt.deliveryDays} dias uteis</p>
          </div>
          <span className="font-bold text-sm">R$ {opt.price.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}
