'use client';
import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const displayImages = images.length > 0 ? images : ['/images/placeholder.jpg'];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
        <Image src={displayImages[selected]} alt={productName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {displayImages.map((img, i) => (
            <button key={i} onClick={() => setSelected(i)} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === selected ? 'border-[#FF6600]' : 'border-transparent'}`}>
              <Image src={img} alt={`${productName} ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
