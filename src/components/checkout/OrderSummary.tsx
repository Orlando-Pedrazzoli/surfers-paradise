interface OrderSummaryProps {
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

export default function OrderSummary({ items, total }: OrderSummaryProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-semibold mb-4">Resumo do Pedido</h3>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm py-2 border-b last:border-0">
          <span>{item.quantity}x {item.name}</span>
          <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between font-bold mt-4 pt-4 border-t"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
    </div>
  );
}
