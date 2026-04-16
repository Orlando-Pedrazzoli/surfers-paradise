import Image from 'next/image';

interface CartItemProps {
  item: { id: string; name: string; price: number; quantity: number; image?: string };
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 py-4 border-b">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{item.name}</h4>
        <p className="text-sm font-bold text-[#FF6600] mt-1">R$ {item.price.toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 border rounded text-sm">-</button>
          <span className="text-sm w-8 text-center">{item.quantity}</span>
          <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 border rounded text-sm">+</button>
          <button onClick={() => onRemove(item.id)} className="ml-auto text-xs text-red-500 hover:underline">Remover</button>
        </div>
      </div>
    </div>
  );
}
