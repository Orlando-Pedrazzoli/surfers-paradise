// 📄 src/components/home/StoreShowcase.tsx
// Seção institucional da homepage: "Nós somos a Surfers Paradise" +
// "Visite nossa loja", com CAROUSEL de 10 fotos da loja física
// (public/images/loja01.JPG … loja10.JPG — extensão .JPG MAIÚSCULA:
// o filesystem da Vercel é case-sensitive).
//
// Vantagens sobre a referência (concorrente com foto estática):
//   • carousel com autoplay (5s), pausa no hover/toque, setas, dots
//     clicáveis, contador e SWIPE no mobile;
//   • dados de endereço/horário/telefone vindos de company.ts (fonte
//     única — mudou na config, mudou aqui);
//   • CTAs de ação: "Como chegar" (Google Maps) e "Fale Conosco"
//     (/contato) — a referência não convida a nenhuma ação;
//   • destaque para retirada grátis na loja (integra com o checkout v7);
//   • Next/Image com lazy-loading e sizes correto (a referência carrega
//     imagem crua).
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Clock,
  Phone,
  ChevronLeft,
  ChevronRight,
  Store,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { company } from '@/lib/config/company';

// loja01.JPG … loja10.JPG (case-sensitive na Vercel!)
const STORE_IMAGES = Array.from({ length: 10 }, (_, i) => ({
  src: `/images/loja${String(i + 1).padStart(2, '0')}.JPG`,
  alt: `Loja física Surfers Paradise em ${company.address.city} — foto ${i + 1}`,
}));

const AUTOPLAY_MS = 5000;

const mapsQuery = encodeURIComponent(
  `${company.name}, ${company.address.street}, ${company.address.number} - ${company.address.neighborhood}, ${company.address.city} - ${company.address.state}`,
);
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;

export default function StoreShowcase() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = STORE_IMAGES.length;
  const goTo = useCallback(
    (index: number) => setCurrent((index + total) % total),
    [total],
  );
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Autoplay com pausa no hover/toque
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setCurrent(c => (c + 1) % total), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, total]);

  // Swipe no mobile
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 40) (delta < 0 ? next : prev)();
      touchStartX.current = null;
    }
    setPaused(false);
  };

  return (
    <section className='py-10 bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
          {/* ═══ CONTEÚDO ═══ */}
          <div>
            <p className='text-[11px] font-bold text-[#FF6600] uppercase tracking-widest mb-2'>
              <Store size={12} className='inline -mt-0.5 mr-1.5' />
              Loja física em {company.address.city} - {company.address.state}
            </p>
            <h2 className='text-3xl md:text-4xl font-black text-gray-900 mb-4'>
              Nós somos a Surfers Paradise
            </h2>
            <p className='text-gray-600 leading-relaxed mb-3'>
              Há mais de <strong>20 anos</strong> no mercado de acessórios e
              equipamentos para o surf, a Surfers Paradise nasceu da paixão de
              quem vive o esporte dentro e fora d&apos;água. Mais do que uma
              loja, somos um ponto de encontro de surfistas — do iniciante
              escolhendo a primeira prancha ao atleta em busca do quilhame
              perfeito.
            </p>
            <p className='text-gray-600 leading-relaxed mb-6'>
              Aqui você encontra as melhores marcas do surf mundial —{' '}
              <strong>
                FCS, Futures, Rip Curl, O&apos;Neill, Hurley, Vissla
              </strong>{' '}
              e muito mais — em quilhas, wetsuits, decks, leashes, capas e
              acessórios, com atendimento de quem realmente surfa.
            </p>

            {/* Info da loja (fonte única: company.ts) */}
            <div className='space-y-3 mb-6'>
              <div className='flex items-start gap-3'>
                <MapPin
                  size={18}
                  className='text-[#FF6600] mt-0.5 flex-shrink-0'
                />
                <p className='text-sm text-gray-700'>
                  {company.address.street}, {company.address.number} —{' '}
                  {company.address.neighborhood}, {company.address.city} -{' '}
                  {company.address.state}
                </p>
              </div>
              <div className='flex items-start gap-3'>
                <Clock
                  size={18}
                  className='text-[#FF6600] mt-0.5 flex-shrink-0'
                />
                <p className='text-sm text-gray-700'>{company.businessHours}</p>
              </div>
              <div className='flex items-start gap-3'>
                <Phone
                  size={18}
                  className='text-[#FF6600] mt-0.5 flex-shrink-0'
                />
                <a
                  href={`https://wa.me/${company.whatsapp}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm text-gray-700 hover:text-[#FF6600] transition-colors'
                >
                  {company.phone} (WhatsApp)
                </a>
              </div>
            </div>

            {/* Badge retirada na loja — integra com o checkout */}
            <p className='inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-3 py-2 rounded-md mb-6'>
              <Store size={14} />
              Compre no site e retire na loja sem pagar frete!
            </p>

            {/* CTAs */}
            <div className='flex flex-col sm:flex-row gap-3'>
              <a
                href={DIRECTIONS_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6600] text-white text-sm font-bold rounded-md hover:bg-[#e55b00] transition-colors'
              >
                <ExternalLink size={16} />
                Como Chegar
              </a>
              <Link
                href='/contato'
                className='inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-900 text-gray-900 text-sm font-bold rounded-md hover:bg-gray-900 hover:text-white transition-colors'
              >
                <MessageCircle size={16} />
                Fale Conosco
              </Link>
            </div>
          </div>

          {/* ═══ CAROUSEL DA LOJA ═══ */}
          <div
            className='relative rounded-xl overflow-hidden shadow-lg group select-none'
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-roledescription='carousel'
            aria-label='Fotos da loja física Surfers Paradise'
          >
            <div className='relative aspect-[4/3]'>
              {STORE_IMAGES.map((img, i) => (
                <Image
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes='(max-width: 1024px) 100vw, 50vw'
                  priority={i === 0}
                  className={`object-cover transition-opacity duration-700 ${
                    i === current ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              {/* Gradiente sutil para dots/contador legíveis */}
              <div className='absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none' />
            </div>

            {/* Setas */}
            <button
              type='button'
              onClick={prev}
              aria-label='Foto anterior'
              className='absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 text-gray-800 flex items-center justify-center shadow hover:bg-[#FF6600] hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100'
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type='button'
              onClick={next}
              aria-label='Próxima foto'
              className='absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 text-gray-800 flex items-center justify-center shadow hover:bg-[#FF6600] hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100'
            >
              <ChevronRight size={18} />
            </button>

            {/* Contador */}
            <span className='absolute top-3 right-3 bg-black/55 text-white text-[11px] font-semibold px-2 py-1 rounded'>
              {current + 1} / {total}
            </span>

            {/* Dots */}
            <div className='absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5'>
              {STORE_IMAGES.map((_, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => goTo(i)}
                  aria-label={`Ir para a foto ${i + 1}`}
                  aria-current={i === current}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current
                      ? 'w-5 bg-[#FF6600]'
                      : 'w-1.5 bg-white/70 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}