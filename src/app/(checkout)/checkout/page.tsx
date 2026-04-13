'use client';

import Link from 'next/link';
import { useCart } from '@/lib/context/CartProvider';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { ShoppingCart } from 'lucide-react';

export default function CheckoutPage() {
  const { items, subtotal, pixTotal, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-16 text-center'>
        <ShoppingCart size={64} className='mx-auto mb-6 text-gray-200' />
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>
          Seu carrinho está vazio
        </h1>
        <p className='text-gray-500 mb-8'>
          Adicione produtos antes de finalizar a compra
        </p>
        <Link
          href='/produtos'
          className='inline-block px-8 py-3 bg-[#FF6600] text-white font-bold rounded-md hover:bg-[#e55b00] transition-colors'
        >
          Explorar Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <nav className='text-sm text-gray-500 mb-6'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <Link href='/carrinho' className='hover:text-[#FF6600]'>
          Carrinho
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Checkout</span>
      </nav>

      <h1 className='text-2xl font-bold text-gray-900 mb-8'>
        Finalizar Compra
      </h1>

      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Checkout Form */}
        <div className='flex-1 space-y-6'>
          {/* TODO: Address, Shipping, Payment forms will be implemented with Pagar.me V5 and Melhor Envio */}
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <h2 className='text-lg font-semibold mb-4'>Endereço de Entrega</h2>
            <p className='text-sm text-gray-500'>
              Em breve — integração com Melhor Envio para cálculo de frete
            </p>
          </div>

          <div className='bg-white rounded-lg shadow-sm p-6'>
            <h2 className='text-lg font-semibold mb-4'>Forma de Pagamento</h2>
            <p className='text-sm text-gray-500'>
              Em breve — integração com Pagar.me V5 (Cartão, Boleto, PIX)
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className='w-full lg:w-[360px] flex-shrink-0'>
          <div className='bg-gray-50 rounded-lg p-6 sticky top-24 space-y-4'>
            <h2 className='text-lg font-bold text-gray-900'>
              Resumo do Pedido
            </h2>

            <div className='divide-y divide-gray-200'>
              {items.map(item => (
                <div
                  key={item.productId}
                  className='flex items-center gap-3 py-3'
                >
                  <div className='w-12 h-12 bg-gray-100 rounded flex-shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm text-gray-900 line-clamp-1'>
                      {item.name}
                    </p>
                    <p className='text-xs text-gray-500'>
                      Qtd: {item.quantity}
                    </p>
                  </div>
                  <p className='text-sm font-medium text-gray-900'>
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className='border-t border-gray-200 pt-4 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>
                  Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
                </span>
                <span className='font-medium'>{formatCurrency(subtotal)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Frete</span>
                <span className='text-gray-400'>A calcular</span>
              </div>
            </div>

            <div className='border-t border-gray-200 pt-4'>
              <div className='flex justify-between items-center'>
                <span className='text-base font-bold'>Total</span>
                <span className='text-xl font-black'>
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className='flex justify-between items-center mt-1'>
                <span className='text-sm text-[#FF6600] font-medium'>
                  No PIX / Boleto
                </span>
                <span className='text-lg font-black text-[#FF6600]'>
                  {formatCurrency(pixTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
