// src/components/admin/ImageLightbox.tsx
// Visualizador de imagens em tamanho grande (admin).
// Fecha no X, no fundo escuro ou com Esc; setas (ecrã e teclado) navegam
// entre as imagens. Estilos críticos inline (Tailwind v4 em produção).
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export default function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: ImageLightboxProps) {
  const total = images.length;
  const hasMany = total > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (total > 1 && e.key === 'ArrowLeft') {
        onIndexChange((index - 1 + total) % total);
      }
      if (total > 1 && e.key === 'ArrowRight') {
        onIndexChange((index + 1) % total);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, total, onClose, onIndexChange]);

  // Trava o scroll da página enquanto o visualizador está aberto
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const src = images[index];
  if (!src) return null;

  const roundButton: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 9999,
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={`Imagem ${index + 1} de ${total}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <button
        type='button'
        onClick={onClose}
        aria-label='Fechar'
        style={{ ...roundButton, position: 'absolute', top: 16, right: 16 }}
      >
        <X size={22} />
      </button>

      {hasMany && (
        <button
          type='button'
          onClick={e => {
            e.stopPropagation();
            onIndexChange((index - 1 + total) % total);
          }}
          aria-label='Imagem anterior'
          style={{
            ...roundButton,
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <Image
        key={src}
        src={src}
        alt={`Imagem ${index + 1} de ${total}`}
        width={1600}
        height={1600}
        sizes='100vw'
        onClick={e => e.stopPropagation()}
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 120px)',
          objectFit: 'contain',
          borderRadius: 8,
          background: '#fff',
        }}
      />

      {hasMany && (
        <button
          type='button'
          onClick={e => {
            e.stopPropagation();
            onIndexChange((index + 1) % total);
          }}
          aria-label='Próxima imagem'
          style={{
            ...roundButton,
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <ChevronRight size={24} />
        </button>
      )}

      <span
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontSize: 13,
          background: 'rgba(0,0,0,0.6)',
          padding: '4px 12px',
          borderRadius: 9999,
        }}
      >
        {index + 1} / {total}
        {index === 0 ? ' · Principal' : ''}
      </span>
    </div>
  );
}
