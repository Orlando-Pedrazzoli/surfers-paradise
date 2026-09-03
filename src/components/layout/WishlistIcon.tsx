// 📄 src/components/layout/WishlistIcon.tsx
// Coração na navbar (acesso pela navegação do topo — best practice) com
// badge de contagem, ao lado do carrinho. Leva à página /lista-de-desejos.
// Badge só aparece com itens (diferente do carrinho, que sempre mostra 0):
// coração vazio sem número é o estado neutro convencional.
'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/lib/context/WishlistProvider';

export default function WishlistIcon() {
  const { count, hydrated } = useWishlist();

  return (
    <Link
      href='/lista-de-desejos'
      className='relative flex items-center gap-1 text-gray-600 hover:text-[#FF6600] transition-colors'
      aria-label={`Lista de desejos${count > 0 ? ` (${count} itens)` : ''}`}
    >
      <Heart
        size={22}
        className={count > 0 ? 'fill-[#FF6600] text-[#FF6600]' : ''}
      />
      {hydrated && count > 0 && (
        <span className='absolute -top-1 -right-2 bg-[#FF6600] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center'>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
