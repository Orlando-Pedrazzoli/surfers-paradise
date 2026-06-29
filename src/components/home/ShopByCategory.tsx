// src/components/home/ShopByCategory.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// COMPRE POR CATEGORIA
// ═══════════════════════════════════════════════════════════════
// Mostra as categorias em círculos navegáveis. O toggle no topo
// filtra por categoria-pai (departamento) e os círculos mostram as
// subcategorias desse departamento — seguindo o mesmo padrão do
// FeaturedWetsuits (toggle + carrossel + setas + dots).
//
// Dados via /api/catalog (mesmo endpoint usado na Navbar).
//   → categories: { _id, name, slug, parent }

interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  image?: string;
}

interface CatalogData {
  success?: boolean;
  categories?: Category[];
}

interface ShopByCategoryProps {
  title?: string;
}

// ═══════════════════════════════════════════════════════════════
// IMAGENS DOS CÍRCULOS — geridas pelo admin (/admin/categorias)
// ═══════════════════════════════════════════════════════════════
// A imagem de cada categoria vem do campo `image` (URL Cloudinary),
// enviado pelo CategoryForm e devolvido pelo /api/catalog.
// Se a categoria não tiver imagem (ou falhar a carregar), o círculo
// cai no fallback (inicial em laranja) — nunca mostra imagem partida.

// ───── Card circular individual (com fallback) ─────
function CategoryCircle({ category }: { category: Category }) {
  const [errored, setErrored] = useState(false);
  const hasImage = !!category.image && !errored;

  return (
    <Link
      href={`/categoria/${category.slug}`}
      className='group flex-shrink-0 w-24 sm:w-28 md:w-32 snap-start flex flex-col items-center gap-3'
    >
      <div className='relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-100 ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-[#FF6600]/30'>
        {hasImage ? (
          <Image
            src={category.image as string}
            alt={category.name}
            fill
            sizes='112px'
            className='object-cover transition-transform duration-500 group-hover:scale-105'
            onError={() => setErrored(true)}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200'>
            <span className='text-2xl font-bold text-[#FF6600]'>
              {category.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <span className='text-center text-xs sm:text-sm font-medium text-gray-700 transition-colors group-hover:text-[#FF6600]'>
        {category.name}
      </span>
    </Link>
  );
}

export default function ShopByCategory({
  title = 'Compre por categoria',
}: ShopByCategoryProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(''); // _id do departamento ativo
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Busca do catálogo
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/catalog', { cache: 'no-store' });
        const data: CatalogData = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch {
        console.error('Erro ao carregar categorias');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // ───── Derivação de raízes e filhos ─────
  const roots = useMemo(() => categories.filter(c => !c.parent), [categories]);

  const childrenByParent = useMemo(() => {
    const map: Record<string, Category[]> = {};
    for (const c of categories) {
      if (c.parent) {
        (map[c.parent] ??= []).push(c);
      }
    }
    return map;
  }, [categories]);

  // Tabs = TODOS os departamentos (raízes) ativos.
  // Mesmo sem subcategorias, o departamento aparece como toggle (e
  // mostra-se a si próprio como círculo), para que categorias novas
  // criadas no admin surjam de imediato.
  const tabs = useMemo(() => roots, [roots]);

  // Define o tab inicial assim que os dados chegam
  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0]._id);
    }
  }, [tabs, activeTab]);

  const activeRoot = useMemo(
    () => roots.find(r => r._id === activeTab),
    [roots, activeTab],
  );

  // Itens a mostrar: subcategorias do tab ativo. Se o departamento
  // não tiver subcategorias, mostra-se a si próprio como único círculo
  // (assim a categoria nova é visível e clicável de imediato).
  const items = useMemo(() => {
    const kids = childrenByParent[activeTab] ?? [];
    if (kids.length > 0) return kids;
    return activeRoot ? [activeRoot] : [];
  }, [childrenByParent, activeTab, activeRoot]);

  // ───── Estado de scroll: setas + dots ─────
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPageCount(pages);
    setActivePage(
      Math.min(pages - 1, Math.round(el.scrollLeft / el.clientWidth)),
    );
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, loading]);

  // Ao trocar de tab (ou quando a lista muda), volta ao início
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    const id = requestAnimationFrame(updateScrollState);
    return () => cancelAnimationFrame(id);
  }, [activeTab, items.length, updateScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const goToPage = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  // ───── Loading ─────
  if (loading) {
    return (
      <section className='py-8'>
        <div className='max-w-7xl mx-auto px-4'>
          <h2 className='text-xl font-bold text-gray-900 mb-6 uppercase'>
            {title}
          </h2>
          <div className='flex gap-4 sm:gap-6 overflow-hidden'>
            {[...Array(8)].map((_, i) => (
              <div key={i} className='flex flex-col items-center gap-3'>
                <div className='w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gray-100 animate-pulse' />
                <div className='h-3 w-16 rounded bg-gray-100 animate-pulse' />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Sem categorias → não renderiza nada
  if (items.length === 0 && roots.length === 0) return null;

  return (
    <section className='py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* Header em duas linhas: título à esquerda em cima,
            toggle centrado embaixo. O wrapper interno com mx-auto
            centra os pills quando cabem e ativa scroll horizontal
            (sem cortar) quando há departamentos a mais. */}
        <div className='mb-6'>
          <h2 className='text-xl font-bold text-gray-900 uppercase'>{title}</h2>

          {tabs.length > 0 && (
            <div className='mt-4 flex overflow-x-auto scrollbar-none'>
              <div className='mx-auto inline-flex gap-1 rounded-full bg-gray-100 p-1'>
                {tabs.map(tab => (
                  <button
                    key={tab._id}
                    onClick={() => setActiveTab(tab._id)}
                    className={`shrink-0 whitespace-nowrap px-5 py-2 text-sm font-bold uppercase rounded-full transition-colors ${
                      activeTab === tab._id
                        ? 'bg-[#FF6600] text-white shadow'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Carrossel de categorias */}
        <div className='relative'>
          {items.length === 0 ? (
            <div className='py-12 text-center text-sm text-gray-400'>
              Nenhuma categoria nesta seção no momento.
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className='flex overflow-x-auto scrollbar-none snap-x snap-mandatory pt-3 pb-4'
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Wrapper com mx-auto: centra quando os itens cabem;
                    quando transbordam, o margin colapsa para 0 e o
                    scroll volta a alinhar à esquerda (carrossel). */}
                <div className='mx-auto flex gap-4 sm:gap-6'>
                  {items.map(cat => (
                    <CategoryCircle key={cat._id} category={cat} />
                  ))}
                </div>
              </div>

              {/* Seta circular ESQUERDA (desktop) — alinhada ao centro do círculo */}
              <button
                onClick={() => scroll('left')}
                aria-label='Anteriores'
                className={`hidden sm:flex absolute left-1 top-14 md:top-16 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition hover:bg-gray-50 ${
                  canLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              {/* Seta circular DIREITA (desktop) */}
              <button
                onClick={() => scroll('right')}
                aria-label='Próximos'
                className={`hidden sm:flex absolute right-1 top-14 md:top-16 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition hover:bg-gray-50 ${
                  canRight ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Dots de página */}
        {items.length > 0 && pageCount > 1 && (
          <div className='mt-4 flex justify-center gap-2'>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                aria-label={`Página ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === activePage
                    ? 'w-6 bg-[#FF6600]'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}

        {/* Ver tudo no departamento ativo */}
        {activeRoot && (
          <div className='mt-6 flex justify-center'>
            <Link
              href={`/categoria/${activeRoot.slug}`}
              className='inline-flex items-center gap-2 rounded-full border-2 border-[#FF6600] px-8 py-2.5 text-sm font-bold uppercase tracking-wide text-[#FF6600] transition-colors hover:bg-[#FF6600] hover:text-white'
            >
              Ver tudo em {activeRoot.name}
              <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
