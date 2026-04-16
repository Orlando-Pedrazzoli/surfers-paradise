import Link from 'next/link';

export default function PedidoConfirmadoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">&#10003;</div>
      <h1 className="text-2xl font-bold mb-2">Pedido Confirmado!</h1>
      <p className="text-gray-500 mb-8">Obrigado pela sua compra. Voce recebera um e-mail com os detalhes do pedido.</p>
      <Link href="/produtos" className="inline-block bg-[#FF6600] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55b00]">Continuar Comprando</Link>
    </div>
  );
}
