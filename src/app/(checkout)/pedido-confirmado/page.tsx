// 📄 src/app/(checkout)/pedido-confirmado/page.tsx
// v2: mostra o número do pedido (?pedido= enviado pelo PaymentForm).
// v2: CTA condicional — cliente logado vai para "Meus Pedidos"; guest
//     recebe o convite de criar conta (ponte para o vínculo de pedidos
//     por e-mail no cadastro). useSearchParams exige Suspense boundary.
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

function ConfirmadoContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const orderNumber = searchParams.get('pedido');

  return (
    <div className='max-w-2xl mx-auto px-4 py-16 text-center'>
      <CheckCircle2 className='mx-auto mb-4 h-16 w-16 text-green-500' />
      <h1 className='text-2xl font-bold mb-2'>Pedido Confirmado!</h1>

      {orderNumber && (
        <p className='mb-2 text-lg'>
          Número do pedido:{' '}
          <span className='font-bold text-gray-900'>{orderNumber}</span>
        </p>
      )}

      <p className='text-gray-500 mb-8'>
        Obrigado pela sua compra! Você receberá um e-mail com os detalhes do
        pedido e as atualizações de envio.
      </p>

      {user ? (
        // Cliente logado: pedido já vinculado à conta
        <div className='space-y-3'>
          <Link
            href='/meus-pedidos'
            className='flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6600] px-6 py-3 font-semibold text-white transition hover:bg-[#e55b00]'
          >
            <Package className='h-5 w-5' /> Acompanhar meu pedido
          </Link>
          <Link
            href='/produtos'
            className='inline-block text-sm font-medium text-gray-500 hover:text-gray-900'
          >
            Continuar comprando
          </Link>
        </div>
      ) : (
        // Guest: convite para criar conta — o cadastro com o MESMO e-mail
        // da compra vincula os pedidos automaticamente à conta nova.
        <div className='space-y-4'>
          <div className='rounded-lg bg-gray-50 p-5 text-left'>
            <p className='flex items-center gap-2 font-semibold text-gray-900'>
              <UserPlus className='h-5 w-5 text-[#FF6600]' /> Acompanhe seu
              pedido
            </p>
            <p className='mt-1 text-sm text-gray-600'>
              Crie sua conta com o <strong>mesmo e-mail usado na compra</strong>{' '}
              e acompanhe o pedido, o rastreio da entrega e avalie os produtos —
              tudo em um só lugar.
            </p>
            <Link
              href='/cadastro'
              className='mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6600] px-6 py-3 font-semibold text-white transition hover:bg-[#e55b00]'
            >
              Criar minha conta
            </Link>
          </div>
          <Link
            href='/produtos'
            className='inline-block text-sm font-medium text-gray-500 hover:text-gray-900'
          >
            Continuar comprando
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmadoContent />
    </Suspense>
  );
}
