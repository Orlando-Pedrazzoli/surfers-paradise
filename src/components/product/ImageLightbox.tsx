'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  isOpen: boolean;
  initialIndex?: number;
  productName: string;
  onClose: () => void;
}

const ZOOM_LEVELS = [1, 2, 3, 4] as const;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const SWIPE_THRESHOLD = 60;
const DRAG_THRESHOLD = 8; // px movement before we treat as drag (not click)

export default function ImageLightbox({
  images,
  isOpen,
  initialIndex = 0,
  productName,
  onClose,
}: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMovedRef = useRef(false); // distinguishes click vs drag/swipe
  const pinchRef = useRef<{
    initialDistance: number;
    initialZoom: number;
  } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // ─── Portal mount (SSR-safe) ───────────────────────────────
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // ─── Sync initial index when opening ───────────────────────
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // ─── Body scroll lock ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // focus close button for keyboard a11y
    const t = setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(t);
    };
  }, [isOpen]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const goToIndex = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= images.length) return;
      setCurrentIndex(idx);
      resetZoom();
    },
    [images.length, resetZoom],
  );

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    resetZoom();
  }, [images.length, resetZoom]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
    resetZoom();
  }, [images.length, resetZoom]);

  const zoomIn = useCallback(() => {
    setZoom(prev => {
      const next = ZOOM_LEVELS.find(z => z > prev);
      return next ?? MAX_ZOOM;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const reversed = [...ZOOM_LEVELS].reverse();
      const next = reversed.find(z => z < prev);
      if (!next || next <= MIN_ZOOM) {
        setPan({ x: 0, y: 0 });
        return MIN_ZOOM;
      }
      return next;
    });
  }, []);

  // ─── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, goPrev, goNext, zoomIn, zoomOut, resetZoom]);

  // ─── Pointer events: pan / swipe / pinch ───────────────────
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pointerMovedRef.current = false;

    // Pinch start (2 pointers)
    if (pointersRef.current.size === 2) {
      const points = Array.from(pointersRef.current.values());
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      pinchRef.current = {
        initialDistance: Math.hypot(dx, dy),
        initialZoom: zoom,
      };
      return;
    }

    // Single pointer: store start position for swipe AND pan
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    if (zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Track if pointer moved beyond threshold (to distinguish click)
    if (pointerStartRef.current) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        pointerMovedRef.current = true;
      }
    }

    // Pinch zoom
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const points = Array.from(pointersRef.current.values());
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      const distance = Math.hypot(dx, dy);
      const scale = distance / pinchRef.current.initialDistance;
      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, pinchRef.current.initialZoom * scale),
      );
      setZoom(newZoom);
      if (newZoom <= 1) setPan({ x: 0, y: 0 });
      return;
    }

    // Pan when zoomed
    if (isDragging && zoom > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointersRef.current.delete(e.pointerId);

    // End of pinch
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }

    // Swipe detection (only when not zoomed and was last pointer)
    if (
      zoom === 1 &&
      start &&
      pointersRef.current.size === 0 &&
      pointerMovedRef.current
    ) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) goPrev();
        else goNext();
      }
    }

    if (pointersRef.current.size === 0) {
      pointerStartRef.current = null;
    }
    setIsDragging(false);
  };

  // ─── Wheel zoom (desktop) ──────────────────────────────────
  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  // ─── Click image to cycle zoom (only if not dragged/swiped) ─
  const handleImageClick = () => {
    if (pointerMovedRef.current) return; // user dragged or swiped, don't toggle zoom
    if (zoom >= MAX_ZOOM) resetZoom();
    else zoomIn();
  };

  if (!mounted || !isOpen) return null;

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const lightbox = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 z-[100] bg-black/95 flex flex-col'
          role='dialog'
          aria-modal='true'
          aria-label={`Galeria de imagens de ${productName}`}
        >
          {/* ─── Top bar ─────────────────────────────── */}
          <div className='flex items-center justify-between px-4 py-3 text-white shrink-0'>
            <div className='flex items-center gap-3'>
              <span className='text-sm font-medium tabular-nums'>
                {currentIndex + 1} / {images.length}
              </span>
              <span className='hidden md:inline text-xs text-white/60 max-w-md truncate'>
                {productName}
              </span>
            </div>

            <div className='flex items-center gap-1'>
              <button
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                className='p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white'
                aria-label='Diminuir zoom'
              >
                <ZoomOut size={20} />
              </button>
              <span className='text-xs font-medium tabular-nums w-12 text-center text-white'>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                className='p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white'
                aria-label='Aumentar zoom'
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={resetZoom}
                disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                className='p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white ml-1'
                aria-label='Redefinir zoom'
              >
                <Maximize2 size={20} />
              </button>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className='p-2 rounded-full hover:bg-white/10 transition-colors text-white ml-2'
                aria-label='Fechar'
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* ─── Image viewport ──────────────────────── */}
          <div
            className='flex-1 relative overflow-hidden select-none touch-none'
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
            onClick={handleImageClick}
          >
            <AnimatePresence mode='wait' initial={false}>
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className='absolute inset-0 flex items-center justify-center p-4 md:p-12'
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.25s ease-out',
                  transformOrigin: 'center center',
                  willChange: 'transform',
                }}
              >
                <div className='relative w-full h-full'>
                  <Image
                    src={currentImage}
                    alt={`${productName} — imagem ${currentIndex + 1}`}
                    fill
                    sizes='100vw'
                    priority={currentIndex === initialIndex}
                    draggable={false}
                    className='object-contain pointer-events-none'
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ─── Nav arrows (desktop) ─────────────── */}
            {hasMultiple && (
              <>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className='hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-sm transition-colors z-10'
                  aria-label='Imagem anterior'
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className='hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-sm transition-colors z-10'
                  aria-label='Próxima imagem'
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>

          {/* ─── Thumbnails strip ────────────────────── */}
          {hasMultiple && (
            <div
              className='shrink-0 px-2 md:px-4 py-3 bg-black/40 backdrop-blur-sm'
              onClick={e => e.stopPropagation()}
            >
              <div className='flex gap-2 overflow-x-auto justify-start md:justify-center'>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goToIndex(i)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentIndex
                        ? 'border-[#FF6600] opacity-100 scale-105'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`Ver imagem ${i + 1}`}
                    aria-current={i === currentIndex}
                  >
                    <Image
                      src={img}
                      alt={`${productName} miniatura ${i + 1}`}
                      fill
                      sizes='80px'
                      className='object-contain bg-white p-1'
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(lightbox, document.body);
}
