'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/context/CartProvider';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default function CartSidebar() {
  const {
    items,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    itemCount,
    subtotal,
    pixTotal,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className='fixed inset-0 z-50'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 transition-opacity'
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className='absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between px-4 py-4 border-b border-gray-200'>
          <div className='flex items-center gap-2'>
            <ShoppingCart size={20} className='text-[#FF6600]' />
            <h2 className='text-lg font-bold text-gray-900'>
              Meu Carrinho
              {itemCount > 0 && (
                <span className='text-sm font-normal text-gray-500 ml-1'>
                  ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className='flex-1 flex flex-col items-center justify-center px-4 text-center'>
            <ShoppingCart size={56} className='text-gray-200 mb-4' />
            <p className='text-gray-500 text-lg font-medium mb-2'>
              Seu carrinho está vazio
            </p>
            <p className='text-gray-400 text-sm mb-6'>
              Adicione produtos para começar a comprar
            </p>
            <button
              onClick={closeCart}
              className='px-6 py-2.5 bg-[#FF6600] text-white font-medium rounded-md hover:bg-[#e55b00] transition-colors'
            >
              Continuar Comprando
            </button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className='flex-1 overflow-y-auto px-4 py-4 space-y-4'>
              {items.map(item => (
                <div
                  key={item.productId}
                  className='flex gap-3 pb-4 border-b border-gray-100'
                >
                  {/* Image */}
                  <Link
                    href={`/produtos/${item.slug}`}
                    onClick={closeCart}
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

                  {/* Info */}
                  <div className='flex-1 min-w-0'>
                    <Link
                      href={`/produtos/${item.slug}`}
                      onClick={closeCart}
                      className='text-sm font-medium text-gray-900 hover:text-[#FF6600] transition-colors line-clamp-2'
                    >
                      {item.name}
                    </Link>

                    {/* Color / Size badges */}
                    {(item.color || item.size) && (
                      <div className='flex items-center gap-2 mt-1'>
                        {item.color && (
                          <span className='text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded'>
                            {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className='text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded'>
                            {item.size}
                          </span>
                        )}
                      </div>
                    )}

                    <p className='text-xs text-gray-400 mt-0.5'>
                      SKU: {item.sku}
                    </p>

                    {/* Price */}
                    <p className='text-sm font-bold text-[#FF6600] mt-1'>
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    {item.quantity > 1 && (
                      <p className='text-[10px] text-gray-400'>
                        {item.quantity}x {formatCurrency(item.price)}
                      </p>
                    )}

                    {/* Quantity Controls */}
                    <div className='flex items-center justify-between mt-2'>
                      <div className='flex items-center border border-gray-300 rounded-md'>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className='px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors'
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
                          className='px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className='p-1.5 text-gray-400 hover:text-red-500 transition-colors'
                        title='Remover'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer — Totals + Actions */}
            <div className='border-t border-gray-200 px-4 py-4 space-y-3 bg-gray-50'>
              {/* Subtotal */}
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>Subtotal</span>
                <span className='text-base font-bold text-gray-900'>
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* PIX Price */}
              <div className='flex items-center justify-between bg-orange-50 -mx-4 px-4 py-2'>
                <span className='text-sm text-[#FF6600] font-medium'>
                  No PIX / Boleto
                </span>
                <div className='text-right'>
                  <span className='text-lg font-black text-[#FF6600]'>
                    {formatCurrency(pixTotal)}
                  </span>
                  <span className='text-xs text-[#FF6600] ml-1'>(10% off)</span>
                </div>
              </div>

              <p className='text-[10px] text-gray-400 text-center'>
                Frete calculado no checkout
              </p>

              {/* Buttons */}
              <Link
                href='/carrinho'
                onClick={closeCart}
                className='block w-full py-3 bg-gray-900 text-white text-center font-bold text-sm rounded-md hover:bg-gray-800 transition-colors'
              >
                VER CARRINHO
              </Link>
              <Link
                href='/checkout'
                onClick={closeCart}
                className='block w-full py-3 bg-[#FF6600] text-white text-center font-bold text-sm rounded-md hover:bg-[#e55b00] transition-colors'
              >
                FINALIZAR COMPRA
              </Link>
              <button
                onClick={closeCart}
                className='block w-full text-center text-sm text-gray-500 hover:text-[#FF6600] transition-colors py-1'
              >
                Continuar comprando
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
