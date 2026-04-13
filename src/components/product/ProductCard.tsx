'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
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
    productFamily?: string;
    variantType?: 'color' | 'size' | 'both';
    color?: string;
    colorCode?: string;
    colorCode2?: string;
    size?: string;
    isMainVariant?: boolean;
  };
}

interface FamilySibling {
  _id: string;
  name: string;
  slug: string;
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  variantType?: 'color' | 'size' | 'both';
  images: string[];
  thumbnail?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [familySiblings, setFamilySiblings] = useState<FamilySibling[]>([]);
  const [activeVariant, setActiveVariant] = useState<FamilySibling | null>(
    null,
  );

  const displayed = activeVariant || {
    _id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    images: product.images,
    thumbnail: product.thumbnail,
    stock: 999,
  };

  const pixPrice = calculatePixPrice(displayed.price);
  const installment = calculateInstallments(displayed.price);
  const images = displayed.images.length > 0 ? displayed.images : [];
  const hasDiscount = !!(
    displayed.compareAtPrice &&
    displayed.compareAtPrice > 0 &&
    displayed.compareAtPrice > displayed.price
  );

  useEffect(() => {
    if (product.productFamily) {
      fetch(`/api/products/family/${encodeURIComponent(product.productFamily)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.products.length > 1) {
            setFamilySiblings(data.products);
          }
        })
        .catch(() => {});
    }
  }, [product.productFamily]);

  const colorSiblings = familySiblings.filter(
    s => ['color', 'both'].includes(s.variantType || '') && s.colorCode,
  );
  const sizeSiblings = familySiblings.filter(
    s => ['size', 'both'].includes(s.variantType || '') && s.size,
  );

  const isLight = (c: string) =>
    ['#FFFFFF', '#FFF', '#ffffff', '#fff', '#F5F5F5', '#FAFAFA'].includes(c);

  const handleVariantClick = (e: React.MouseEvent, sibling: FamilySibling) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveVariant(sibling);
    setCurrentImage(0);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage(prev => (prev - 1 + images.length) % images.length);
  };
  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage(prev => (prev + 1) % images.length);
  };
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(prev => !prev);
  };

  return (
    <Link
      href={`/produtos/${displayed.slug}`}
      className='group block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow'
    >
      <div className='relative aspect-square bg-gray-50 overflow-hidden'>
        {images.length > 0 ? (
          <Image
            src={images[currentImage]}
            alt={displayed.name}
            fill
            sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
            className='object-contain p-4 group-hover:scale-105 transition-transform duration-300'
          />
        ) : (
          <div className='flex items-center justify-center h-full text-gray-300 text-sm'>
            Sem imagem
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className='absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 text-gray-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm'
              aria-label='Imagem anterior'
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImage}
              className='absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 text-gray-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm'
              aria-label='Próxima imagem'
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        <button
          onClick={toggleFavorite}
          className='absolute top-2 right-2 w-8 h-8 flex items-center justify-center'
          aria-label='Favoritar'
        >
          <Heart
            size={20}
            className={
              isFavorite
                ? 'fill-[#FF6600] text-[#FF6600]'
                : 'text-gray-400 hover:text-[#FF6600] transition-colors'
            }
          />
        </button>

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
          {hasDiscount && (
            <span className='bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded'>
              {product.salePercentage
                ? `-${product.salePercentage}%`
                : `-${Math.round(((displayed.compareAtPrice! - displayed.price) / displayed.compareAtPrice!) * 100)}%`}
            </span>
          )}
        </div>

        {images.length > 1 && (
          <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1'>
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === currentImage ? 'bg-[#FF6600]' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className='p-3 text-center'>
        <h3 className='text-sm text-gray-800 font-medium line-clamp-2 mb-2 min-h-[2.5rem]'>
          {displayed.name}
        </h3>

        {/* Family Color Variants */}
        {colorSiblings.length > 1 && (
          <div className='flex items-center justify-center gap-1.5 mb-2'>
            {colorSiblings.map(sibling => {
              const isDual =
                sibling.colorCode2 && sibling.colorCode2 !== sibling.colorCode;
              const isActive = sibling._id === displayed._id;
              return (
                <button
                  key={sibling._id}
                  onClick={e => handleVariantClick(e, sibling)}
                  className={`w-4 h-4 rounded-full inline-block cursor-pointer transition-all hover:scale-125 ${isActive ? 'ring-2 ring-[#FF6600] ring-offset-1' : 'border border-gray-300'}`}
                  style={
                    isDual
                      ? {
                          background: `linear-gradient(135deg, ${sibling.colorCode} 50%, ${sibling.colorCode2} 50%)`,
                          border:
                            isLight(sibling.colorCode!) ||
                            isLight(sibling.colorCode2!)
                              ? '1px solid #d1d5db'
                              : undefined,
                        }
                      : {
                          backgroundColor: sibling.colorCode,
                          border: isLight(sibling.colorCode!)
                            ? '1px solid #d1d5db'
                            : undefined,
                        }
                  }
                  title={sibling.color}
                  aria-label={`Cor: ${sibling.color}`}
                />
              );
            })}
          </div>
        )}

        {/* Family Size Variants */}
        {sizeSiblings.length > 1 && (
          <div className='flex items-center justify-center gap-1 mb-2 flex-wrap'>
            {sizeSiblings.map(sibling => {
              const isActive = sibling._id === displayed._id;
              return (
                <button
                  key={sibling._id}
                  onClick={e => handleVariantClick(e, sibling)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all hover:scale-110 ${isActive ? 'bg-[#FF6600] text-white' : 'bg-gray-100 text-gray-600 border border-gray-300'} ${sibling.stock <= 0 ? 'opacity-40' : ''}`}
                  title={sibling.size}
                  aria-label={`Tamanho: ${sibling.size}`}
                >
                  {sibling.size}
                </button>
              );
            })}
          </div>
        )}

        {/* Prices */}
        <p className='text-[#FF6600] font-bold text-xl leading-tight'>
          {formatCurrency(pixPrice)}
        </p>
        <p className='text-xs text-[#FF6600]'>10% de desconto</p>
        <p className='text-[11px] text-gray-400'>* PIX / Boleto</p>

        {hasDiscount && (
          <p className='text-xs text-gray-400 line-through mt-2'>
            de {formatCurrency(displayed.compareAtPrice!)}
          </p>
        )}

        <p className='text-base font-bold text-gray-900 mt-1'>
          {formatCurrency(displayed.price)}
        </p>
        <p className='text-xs text-gray-500'>
          {installment.count}X DE {formatCurrency(installment.value)} SEM JUROS
        </p>
      </div>
    </Link>
  );
}
