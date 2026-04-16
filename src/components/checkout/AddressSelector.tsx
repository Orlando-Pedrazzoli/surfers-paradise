'use client';

interface AddressSelectorProps {
  addresses: Array<{ _id: string; street: string; number: string; city: string; state: string; cep: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function AddressSelector({ addresses, selectedId, onSelect }: AddressSelectorProps) {
  if (!addresses.length) return <p className="text-sm text-gray-500">Nenhum endereco cadastrado.</p>;
  return (
    <div className="space-y-3">
      {addresses.map((addr) => (
        <button key={addr._id} onClick={() => onSelect(addr._id)} className={`w-full text-left p-4 border rounded-lg ${addr._id === selectedId ? 'border-[#FF6600] bg-orange-50' : 'border-gray-200'}`}>
          <p className="font-medium">{addr.street}, {addr.number}</p>
          <p className="text-sm text-gray-500">{addr.city} - {addr.state} | CEP {addr.cep}</p>
        </button>
      ))}
    </div>
  );
}
