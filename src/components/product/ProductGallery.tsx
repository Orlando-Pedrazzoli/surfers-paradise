'use client';

import { useState, useRef, type MouseEvent } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, ZoomIn } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

const MAX_THUMBS = 5;

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Desktop hover-zoom (lens effect like Amazon)
  const [hovering, setHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const mainImageRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className='aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400'>
        Sem imagem
      </div>
    );
  }

  const visibleThumbs = images.slice(thumbStart, thumbStart + MAX_THUMBS);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const openLightbox = () => setLightboxOpen(true);

  return (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-[100px_1fr] gap-4'>
        {/* ─── Thumbnails (desktop, vertical) ─── */}
        <div className='hidden lg:flex flex-col items-center gap-2'>
          {images.length > MAX_THUMBS && thumbStart > 0 && (
            <button
              onClick={() => setThumbStart(prev => Math.max(0, prev - 1))}
              className='w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors'
              aria-label='Miniaturas anteriores'
            >
              <ChevronUp size={20} />
            </button>
          )}
          {visibleThumbs.map((img, i) => {
            const realIndex = thumbStart + i;
            const isActive = currentImage === realIndex;
            return (
              <button
                key={realIndex}
                onClick={() => setCurrentImage(realIndex)}
                onMouseEnter={() => setCurrentImage(realIndex)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  isActive
                    ? 'border-[#FF6600] ring-2 ring-[#FF6600]/20'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                aria-label={`Ver imagem ${realIndex + 1}`}
                aria-current={isActive}
              >
                <Image
                  src={img}
                  alt={`${productName} miniatura ${realIndex + 1}`}
                  width={80}
                  height={80}
                  className='w-full h-full object-contain p-1'
                />
              </button>
            );
          })}
          {images.length > MAX_THUMBS &&
            thumbStart + MAX_THUMBS < images.length && (
              <button
                onClick={() => setThumbStart(prev => prev + 1)}
                className='w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors'
                aria-label='Próximas miniaturas'
              >
                <ChevronDown size={20} />
              </button>
            )}
        </div>

        {/* ─── Main image ─── */}
        <div
          ref={mainImageRef}
          className='relative aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden group cursor-zoom-in'
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onMouseMove={handleMouseMove}
          onClick={openLightbox}
          role='button'
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openLightbox();
            }
          }}
          aria-label='Clique para ampliar imagem'
        >
          <Image
            src={images[currentImage]}
            alt={productName}
            fill
            priority
            sizes='(max-width: 768px) 100vw, 50vw'
            className='object-contain p-6 transition-transform duration-200'
            style={{
              transform: hovering ? 'scale(1.6)' : 'scale(1)',
              transformOrigin: `${lensPos.x}% ${lensPos.y}%`,
            }}
            draggable={false}
          />

          {/* Zoom hint badge */}
          <div className='absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
            <ZoomIn size={14} />
            <span className='hidden md:inline'>Ampliar</span>
          </div>

          {/* Mobile dots indicator */}
          {images.length > 1 && (
            <div className='lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5'>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => {
                    e.stopPropagation();
                    setCurrentImage(i);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === currentImage ? 'bg-[#FF6600]' : 'bg-gray-300'
                  }`}
                  aria-label={`Ir para imagem ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile thumbnails strip (below main image) ─── */}
      {images.length > 1 && (
        <div className='lg:hidden mt-3 flex gap-2 overflow-x-auto pb-1'>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                i === currentImage
                  ? 'border-[#FF6600]'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              aria-label={`Ver imagem ${i + 1}`}
              aria-current={i === currentImage}
            >
              <Image
                src={img}
                alt={`${productName} miniatura ${i + 1}`}
                fill
                sizes='64px'
                className='object-contain p-0.5'
              />
            </button>
          ))}
        </div>
      )}

      {/* ─── Lightbox modal ─── */}
      <ImageLightbox
        images={images}
        isOpen={lightboxOpen}
        initialIndex={currentImage}
        productName={productName}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
