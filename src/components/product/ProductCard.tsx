'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {
  calculateInstallments,
  calculatePixPrice,
} from '@/lib/utils/installments';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: string[];
    thumbnail?: string;
    isOnSale?: boolean;
    isNewArrival?: boolean;
    isFeatured?: boolean;
    salePercentage?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const pixPrice = calculatePixPrice(product.price);
  const installment = calculateInstallments(product.price);
  const image = product.thumbnail || product.images[0] || '';
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className='group block bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow'
    >
      {/* Image */}
      <div className='relative aspect-square bg-gray-50 overflow-hidden'>
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
            className='object-contain p-4 group-hover:scale-105 transition-transform duration-300'
          />
        ) : (
          <div className='flex items-center justify-center h-full text-gray-300 text-sm'>
            Sem imagem
          </div>
        )}

        {/* Badges */}
        <div className='absolute top-2 left-2 flex flex-col gap-1'>
          {product.isNewArrival && (
            <span className='bg-[#FF6600] text-white text-[10px] font-bold px-2 py-0.5 rounded'>
              NOVIDADE
            </span>
          )}
          {product.isOnSale && (
            <span className='bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded'>
              PROMOÇÃO
            </span>
          )}
          {product.isFeatured && !product.isNewArrival && !product.isOnSale && (
            <span className='bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded'>
              EM ESTOQUE
            </span>
          )}
          {hasDiscount && (
            <span className='bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded'>
              {product.salePercentage
                ? `-${product.salePercentage}%`
                : `-${Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)}%`}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className='p-3'>
        <h3 className='text-sm text-gray-800 font-medium line-clamp-2 mb-2 min-h-[2.5rem]'>
          {product.name}
        </h3>

        {/* PIX Price */}
        <p className='text-[#FF6600] font-bold text-lg leading-tight'>
          {formatCurrency(pixPrice)}
        </p>
        <p className='text-[11px] text-gray-500'>10% de desconto</p>
        <p className='text-[11px] text-gray-400'>* PIX / Boleto</p>

        {/* Full Price + Installments */}
        {hasDiscount && (
          <p className='text-xs text-gray-400 line-through mt-1'>
            de {formatCurrency(product.compareAtPrice!)}
          </p>
        )}
        <p className='text-sm font-semibold text-gray-900 mt-1'>
          {formatCurrency(product.price)}
        </p>
        <p className='text-[11px] text-gray-500'>
          {installment.count}X DE {formatCurrency(installment.value)} SEM JUROS
        </p>
      </div>
    </Link>
  );
}
