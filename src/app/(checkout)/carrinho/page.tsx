'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingCart, Truck, Tag } from 'lucide-react';
import { useCart } from '@/lib/context/CartProvider';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { calculateInstallments } from '@/lib/utils/installments';

export default function CarrinhoPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    pixTotal,
  } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [cep, setCep] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const installment = calculateInstallments(subtotal);

  const handleCouponApply = () => {
    if (!couponCode.trim()) return;
    // TODO: validate coupon via API
    setCouponMessage('Cupom inválido');
  };

  const handleShippingCalc = () => {
    if (!cep.trim()) return;
    // TODO: calculate shipping via Melhor Envio API
  };

  if (items.length === 0) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-16 text-center'>
        <ShoppingCart size={64} className='mx-auto mb-6 text-gray-200' />
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>
          Seu carrinho está vazio
        </h1>
        <p className='text-gray-500 mb-8'>
          Descubra nossos produtos e encontre o que precisa para suas sessões de
          surf
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
      {/* Breadcrumb */}
      <nav className='text-sm text-gray-500 mb-6'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Carrinho</span>
      </nav>

      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>
          Meu Carrinho
          <span className='text-sm font-normal text-gray-500 ml-2'>
            ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
          </span>
        </h1>
        <button
          onClick={clearCart}
          className='text-sm text-red-500 hover:text-red-700 transition-colors'
        >
          Limpar carrinho
        </button>
      </div>

      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Cart Items */}
        <div className='flex-1'>
          {/* Header — Desktop */}
          <div className='hidden md:grid grid-cols-[1fr_120px_120px_100px_40px] gap-4 pb-3 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase'>
            <span>Produto</span>
            <span className='text-center'>Preço</span>
            <span className='text-center'>Quantidade</span>
            <span className='text-center'>Total</span>
            <span />
          </div>

          {/* Items */}
          <div className='divide-y divide-gray-100'>
            {items.map(item => (
              <div key={item.productId} className='py-4'>
                {/* Desktop */}
                <div className='hidden md:grid grid-cols-[1fr_120px_120px_100px_40px] gap-4 items-center'>
                  {/* Product */}
                  <div className='flex items-center gap-4'>
                    <Link
                      href={`/produtos/${item.slug}`}
                      className='flex-shrink-0'
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className='w-20 h-20 object-contain bg-gray-50 rounded-lg p-1'
                      />
                    </Link>
                    <div>
                      <Link
                        href={`/produtos/${item.slug}`}
                        className='text-sm font-medium text-gray-900 hover:text-[#FF6600] line-clamp-2'
                      >
                        {item.name}
                      </Link>
                      {(item.color || item.size) && (
                        <div className='flex gap-1 mt-1'>
                          {item.color && (
                            <span className='text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded'>
                              {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className='text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded'>
                              {item.size}
                            </span>
                          )}
                        </div>
                      )}
                      <p className='text-[10px] text-gray-400 mt-0.5'>
                        SKU: {item.sku}
                      </p>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <p className='text-sm text-gray-700 text-center'>
                    {formatCurrency(item.price)}
                  </p>

                  {/* Quantity */}
                  <div className='flex items-center justify-center'>
                    <div className='flex items-center border border-gray-300 rounded-md'>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className='px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      >
                        <Minus size={14} />
                      </button>
                      <span className='px-3 py-1 text-sm font-medium border-x border-gray-300 min-w-[32px] text-center'>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        className='px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30'
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <p className='text-sm font-bold text-gray-900 text-center'>
                    {formatCurrency(item.price * item.quantity)}
                  </p>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className='p-1 text-gray-400 hover:text-red-500 transition-colors'
                    title='Remover'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Mobile */}
                <div className='md:hidden flex gap-3'>
                  <Link
                    href={`/produtos/${item.slug}`}
                    className='flex-shrink-0'
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className='w-20 h-20 object-contain bg-gray-50 rounded-lg p-1'
                    />
                  </Link>
                  <div className='flex-1'>
                    <Link
                      href={`/produtos/${item.slug}`}
                      className='text-sm font-medium text-gray-900 line-clamp-2'
                    >
                      {item.name}
                    </Link>
                    <p className='text-sm font-bold text-[#FF6600] mt-1'>
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <div className='flex items-center justify-between mt-2'>
                      <div className='flex items-center border border-gray-300 rounded-md'>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className='px-2 py-1 text-gray-500'
                        >
                          <Minus size={12} />
                        </button>
                        <span className='px-2 py-1 text-xs font-medium border-x border-gray-300'>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          className='px-2 py-1 text-gray-500 disabled:opacity-30'
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className='text-gray-400 hover:text-red-500'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Shopping */}
          <div className='mt-6'>
            <Link
              href='/produtos'
              className='text-sm text-gray-500 hover:text-[#FF6600] transition-colors'
            >
              ← Continuar comprando
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className='w-full lg:w-[360px] flex-shrink-0'>
          <div className='bg-gray-50 rounded-lg p-6 sticky top-24 space-y-5'>
            <h2 className='text-lg font-bold text-gray-900'>
              Resumo do Pedido
            </h2>

            {/* Coupon */}
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <Tag size={14} className='text-gray-500' />
                <span className='text-sm font-medium text-gray-700'>
                  Cupom de desconto
                </span>
              </div>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={couponCode}
                  onChange={e => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponMessage('');
                  }}
                  placeholder='CÓDIGO'
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
                <button
                  onClick={handleCouponApply}
                  className='px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors'
                >
                  Aplicar
                </button>
              </div>
              {couponMessage && (
                <p className='text-xs text-red-500 mt-1'>{couponMessage}</p>
              )}
            </div>

            {/* Shipping */}
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <Truck size={14} className='text-gray-500' />
                <span className='text-sm font-medium text-gray-700'>
                  Calcular frete
                </span>
              </div>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={cep}
                  onChange={e =>
                    setCep(e.target.value.replace(/\D/g, '').slice(0, 8))
                  }
                  placeholder='CEP'
                  maxLength={8}
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
                <button
                  onClick={handleShippingCalc}
                  className='px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors'
                >
                  Calcular
                </button>
              </div>
              <a
                href='https://buscacepinter.correios.com.br/app/endereco/index.php'
                target='_blank'
                rel='noopener noreferrer'
                className='text-[10px] text-gray-400 hover:text-[#FF6600] mt-1 inline-block'
              >
                Não sei meu CEP
              </a>
            </div>

            {/* Totals */}
            <div className='border-t border-gray-200 pt-4 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Subtotal</span>
                <span className='text-gray-900 font-medium'>
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Frete</span>
                <span className='text-gray-400 text-xs'>Calcule acima</span>
              </div>
            </div>

            {/* Total */}
            <div className='border-t border-gray-200 pt-4'>
              <div className='flex justify-between items-center mb-1'>
                <span className='text-base font-bold text-gray-900'>Total</span>
                <span className='text-xl font-black text-gray-900'>
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className='flex justify-between items-center mb-1'>
                <span className='text-sm text-[#FF6600] font-medium'>
                  No PIX / Boleto
                </span>
                <span className='text-lg font-black text-[#FF6600]'>
                  {formatCurrency(pixTotal)}
                </span>
              </div>
              <p className='text-xs text-gray-500'>
                ou {installment.count}x de {formatCurrency(installment.value)}{' '}
                sem juros
              </p>
            </div>

            {/* Checkout Button */}
            <Link
              href='/checkout'
              className='block w-full py-3.5 bg-[#FF6600] text-white text-center font-bold text-base rounded-md hover:bg-[#e55b00] transition-colors'
            >
              FINALIZAR COMPRA
            </Link>

            {/* Trust Badges */}
            <div className='flex items-center justify-center gap-4 pt-2'>
              <div className='flex items-center gap-1 text-[10px] text-gray-400'>
                <span>🔒</span> Compra Segura
              </div>
              <div className='flex items-center gap-1 text-[10px] text-gray-400'>
                <span>↩️</span> Troca Garantida
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
