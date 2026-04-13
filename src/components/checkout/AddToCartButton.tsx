'use client';

import { useCart, type CartItem } from '@/lib/context/CartProvider';
import toast from 'react-hot-toast';

interface AddToCartButtonProps {
  product: Omit<CartItem, 'quantity'>;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function AddToCartButton({
  product,
  quantity = 1,
  disabled = false,
  className,
  children,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();

  const handleClick = () => {
    addToCart(product, quantity);
    toast.success('Produto adicionado ao carrinho!');
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={
        className ||
        'px-8 py-3 bg-[#FF6600] text-white font-bold text-lg rounded-md hover:bg-[#e55b00] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
      }
    >
      {children || 'COMPRAR'}
    </button>
  );
}
