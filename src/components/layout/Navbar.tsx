// src/components/layout/Navbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Search, User, Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { mainCategories } from '@/lib/config/navigation';
import CartIcon from '@/components/layout/CartIcon';

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
}

interface CatalogData {
  categories: SubCategory[];
  brands: { _id: string; name: string; slug: string }[];
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DOS MEGA-MENUS
// ═══════════════════════════════════════════════════════════════
// Cada categoria com submenu pode ter uma imagem promocional com
// CTA. Quando a Adriana enviar as fotos finais, substitua os
// ficheiros em /public/images/ com os nomes abaixo.

interface MegaPromo {
  image: string;
  title: string;
  subtitle: string;
  cta: string;
}

const megaPromos: Record<string, MegaPromo> = {
  pranchas: {
    image: '/images/mega-pranchas.jpg',
    title: 'Pranchas em destaque',
    subtitle: 'Performance que muda tudo',
    cta: 'Ver coleção',
  },
  quilhas: {
    image: '/images/mega-quilhas.jpg',
    title: 'Tecnologia FCS II',
    subtitle: 'Encaixe perfeito, troca rápida',
    cta: 'Ver quilhas',
  },
  wetsuits: {
    image: '/images/mega-wetsuits.jpg',
    title: 'Inverno chegando',
    subtitle: 'Wetsuits para o ano todo',
    cta: 'Ver wetsuits',
  },
  capas: {
    image: '/images/mega-capas.jpg',
    title: 'Proteção essencial',
    subtitle: 'Para tua prancha durar mais',
    cta: 'Ver capas',
  },
};

// ═══════════════════════════════════════════════════════════════
// LARGURAS DOS MEGA-MENUS POR CATEGORIA
// ═══════════════════════════════════════════════════════════════
// Wetsuits tem 6 subcategorias → precisa de mais espaço para
// 2 colunas de links + promo image. Quilhas e capas têm menos
// subcategorias, então o menu compacto funciona melhor.

const MEGA_MENU_WIDTHS: Record<string, number> = {
  pranchas: 560,
  quilhas: 560,
  wetsuits: 680, // mais largo para acomodar 2 colunas de links + promo
  capas: 560,
  decks: 560,
  leashes: 560,
};

const DEFAULT_MENU_WIDTH = 560;

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isLoggedIn = !!session?.user;
  const firstName = session?.user?.name?.split(' ')[0] || '';

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data.success) setCatalog(data);
      } catch {
        console.error('Erro ao carregar catálogo');
      }
    };
    fetchCatalog();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/busca?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const getSlugFromHref = (href: string) => {
    const parts = href.split('/');
    return parts[parts.length - 1];
  };

  const getSubcategories = (slug: string): SubCategory[] => {
    if (!catalog) return [];
    const parent = catalog.categories.find(c => c.slug === slug);
    if (!parent) return [];
    return catalog.categories.filter(c => c.parent === parent._id);
  };

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(slug);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const closeMega = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(null);
  };

  return (
    <>
      <header className='bg-white border-b border-gray-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex items-center justify-between h-16 md:h-20 gap-4'>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='md:hidden p-2 text-gray-600'
              aria-label='Abrir menu'
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link href='/' className='flex-shrink-0'>
              <div className='flex items-center gap-2'>
                <Image
                  src='/images/logo-navbar.png'
                  alt='Surfers Paradise'
                  width={56}
                  height={56}
                  className='w-12 h-12 md:w-14 md:h-14 object-contain'
                />
                <Image
                  src='/images/logo-surfers-texto.jpeg'
                  alt='Surfers Paradise'
                  width={200}
                  height={40}
                  className='hidden sm:block h-6 md:h-7 w-auto object-contain mix-blend-multiply'
                />
              </div>
            </Link>

            <form
              onSubmit={handleSearch}
              className='hidden md:flex flex-1 max-w-xl mx-8'
            >
              <div className='relative w-full'>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='O que você procura?'
                  className='w-full pl-4 pr-12 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6600] transition-colors'
                />
                <button
                  type='submit'
                  className='absolute right-0 top-0 h-full px-4 bg-[#FF6600] text-white rounded-r-lg hover:bg-[#e55b00] transition-colors'
                  aria-label='Buscar'
                >
                  <Search size={18} />
                </button>
              </div>
            </form>

            <div className='flex items-center gap-3 sm:gap-5'>
              {isLoggedIn ? (
                <Link
                  href='/minha-conta'
                  className='hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-[#FF6600] transition-colors'
                >
                  <div className='w-8 h-8 bg-[#FF6600] text-white rounded-full flex items-center justify-center text-xs font-bold'>
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className='hidden lg:block'>
                    <p className='text-xs text-gray-400'>Olá, {firstName}!</p>
                    <p className='font-medium text-xs'>MINHA CONTA</p>
                  </div>
                </Link>
              ) : (
                <Link
                  href='/login'
                  className='hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-[#FF6600] transition-colors'
                >
                  <User size={20} />
                  <div className='hidden lg:block'>
                    <p className='text-xs text-gray-400'>
                      Olá, seja bem vindo!
                    </p>
                    <p className='font-medium text-xs'>ENTRAR | CADASTRE-SE</p>
                  </div>
                </Link>
              )}
              <CartIcon />
            </div>
          </div>

          <form onSubmit={handleSearch} className='md:hidden pb-3'>
            <div className='relative'>
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='O que você procura?'
                className='w-full pl-4 pr-12 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6600] text-sm'
              />
              <button
                type='submit'
                className='absolute right-0 top-0 h-full px-3 bg-[#FF6600] text-white rounded-r-lg'
                aria-label='Buscar'
              >
                <Search size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* ═══ CATEGORY NAV BAR WITH MEGA-MENU ═══ */}
        <nav className='bg-gray-900 hidden md:block relative'>
          <div className='max-w-7xl mx-auto px-4'>
            <ul className='flex items-center justify-center gap-0'>
              {mainCategories.map((cat, idx) => {
                const slug = getSlugFromHref(cat.href);
                const subcategories = getSubcategories(slug);
                const hasSubmenu = subcategories.length > 0;
                const isActive = activeMenu === slug;
                const showDropdown = isActive && hasSubmenu;
                // Alinhar à direita se for uma das 2 últimas categorias com submenu
                // para não cortar nas bordas do ecrã
                const alignRight = idx >= mainCategories.length - 2;

                // Largura customizada por categoria
                const menuWidth = MEGA_MENU_WIDTHS[slug] || DEFAULT_MENU_WIDTH;

                return (
                  <li
                    key={cat.href}
                    className='relative'
                    onMouseEnter={() => hasSubmenu && handleMouseEnter(slug)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={cat.href}
                      className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors ${
                        cat.label === 'Promoção'
                          ? 'text-[#FF6600] hover:text-white'
                          : isActive
                            ? 'text-white bg-gray-800'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {cat.label}
                      {hasSubmenu && (
                        <ChevronDown
                          size={12}
                          className={`opacity-50 transition-transform ${isActive ? 'rotate-180' : ''}`}
                        />
                      )}
                    </Link>

                    {/* Dropdown ancorado ao botão */}
                    {showDropdown && (
                      <div
                        className={`absolute top-full bg-white border-t-2 border-[#FF6600] shadow-2xl rounded-b-lg overflow-hidden ${
                          alignRight ? 'right-0' : 'left-0'
                        }`}
                        style={{ width: `${menuWidth}px` }}
                      >
                        <div className='p-6'>
                          <MegaMenuContent
                            categorySlug={slug}
                            subcategories={subcategories}
                            promo={megaPromos[slug]}
                            onLinkClick={closeMega}
                          />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* ═══ MOBILE MENU ═══ */}
      {mobileMenuOpen && (
        <div className='fixed inset-0 z-40 md:hidden'>
          <div
            className='absolute inset-0 bg-black/50'
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className='absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto'>
            <div className='p-4 border-b bg-gray-900'>
              <p className='text-white font-bold font-[family-name:var(--font-original-surfer)]'>
                SURFERS PARADISE
              </p>
              <p className='text-gray-400 text-xs'>Authentic Board Shop</p>
            </div>

            {isLoggedIn && (
              <div className='p-4 border-b border-gray-100 bg-orange-50'>
                <Link
                  href='/minha-conta'
                  onClick={() => setMobileMenuOpen(false)}
                  className='flex items-center gap-3'
                >
                  <div className='w-9 h-9 bg-[#FF6600] text-white rounded-full flex items-center justify-center text-sm font-bold'>
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      Olá, {firstName}!
                    </p>
                    <p className='text-xs text-[#FF6600]'>Minha Conta</p>
                  </div>
                </Link>
              </div>
            )}

            <nav className='py-2'>
              {mainCategories.map(cat => {
                const slug = getSlugFromHref(cat.href);
                const subcategories = getSubcategories(slug);
                const hasSubmenu = subcategories.length > 0;
                const isExpanded = expandedMobile === slug;

                return (
                  <div key={cat.href}>
                    <div className='flex items-center border-b border-gray-100'>
                      <Link
                        href={cat.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${
                          cat.label === 'Promoção'
                            ? 'text-[#FF6600]'
                            : 'text-gray-700 hover:text-[#FF6600]'
                        } hover:bg-gray-50`}
                      >
                        {cat.label}
                      </Link>
                      {hasSubmenu && (
                        <button
                          onClick={() =>
                            setExpandedMobile(isExpanded ? null : slug)
                          }
                          className='px-4 py-3 text-gray-400'
                          aria-label={`Expandir ${cat.label}`}
                        >
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                    {isExpanded && subcategories.length > 0 && (
                      <div className='bg-gray-50'>
                        {subcategories.map(sub => (
                          <Link
                            key={sub._id}
                            href={`/categoria/${sub.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className='block pl-8 pr-4 py-2.5 text-sm text-gray-500 hover:text-[#FF6600] border-b border-gray-100'
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {!isLoggedIn && (
                <div className='border-t border-gray-200 mt-2 pt-2'>
                  <Link
                    href='/login'
                    onClick={() => setMobileMenuOpen(false)}
                    className='block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    Entrar / Cadastre-se
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE INTERNO: Conteúdo do Mega-Menu
// ═══════════════════════════════════════════════════════════════

interface MegaMenuContentProps {
  categorySlug: string;
  subcategories: SubCategory[];
  promo?: MegaPromo;
  onLinkClick: () => void;
}

// Labels customizados para o header de secção
const SECTION_HEADERS: Record<string, string> = {
  pranchas: 'Por tipo',
  quilhas: 'Por sistema',
  wetsuits: 'Por tipo',
  capas: 'Por modelo',
  decks: 'Por modelo',
  leashes: 'Por modelo',
};

function MegaMenuContent({
  categorySlug,
  subcategories,
  promo,
  onLinkClick,
}: MegaMenuContentProps) {
  // Se não há subcategorias, mostrar mensagem
  if (subcategories.length === 0) {
    return (
      <div className='py-4'>
        <p className='text-sm text-gray-500'>
          Nenhuma subcategoria disponível.
        </p>
      </div>
    );
  }

  const sectionHeader = SECTION_HEADERS[categorySlug] || 'Categorias';
  const hasPromo = !!promo;

  // ═══════════════════════════════════════════════════════════════
  // LÓGICA DE LAYOUT: distribuir subcategorias em colunas
  // ═══════════════════════════════════════════════════════════════
  // Casos:
  //   1. ≤ 5 items, com promo     → 1 coluna de links + promo (5/7)
  //   2. ≤ 5 items, sem promo     → 1 coluna única
  //   3. > 5 items, com promo     → 2 colunas estreitas + promo (6/6)
  //   4. > 5 items, sem promo     → 2 colunas (sem promo)

  const itemsPerColumn = 5;
  const needsTwoColumns = subcategories.length > 5;
  const columns: SubCategory[][] = [];

  if (needsTwoColumns) {
    // Distribui o mais equilibrado possível entre 2 colunas
    // Ex: 6 items → [3, 3]; 7 items → [4, 3]; 8 items → [4, 4]
    const half = Math.ceil(subcategories.length / 2);
    columns.push(subcategories.slice(0, half));
    columns.push(subcategories.slice(half));
  } else {
    columns.push(subcategories);
  }

  // Grid spans: ajusta conforme tem promo ou não, e quantas colunas
  // de links existem.
  let linksColSpan = '';
  let promoColSpan = '';

  if (hasPromo) {
    if (needsTwoColumns) {
      linksColSpan = 'col-span-6';
      promoColSpan = 'col-span-6';
    } else {
      linksColSpan = 'col-span-5';
      promoColSpan = 'col-span-7';
    }
  }

  return (
    <div className={hasPromo ? 'grid grid-cols-12 gap-5' : ''}>
      {/* ═══ COLUNA(S) DE LINKS ═══ */}
      <div
        className={`${linksColSpan} ${
          needsTwoColumns ? 'grid grid-cols-2 gap-5' : ''
        }`}
      >
        {columns.map((column, ci) => (
          <div key={ci}>
            {/* Section header — só na primeira coluna */}
            {ci === 0 && (
              <h3 className='text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100'>
                {sectionHeader}
              </h3>
            )}
            {ci > 0 && (
              // Espaçador para alinhar 2ª coluna com a 1ª
              <div className='h-[29px]' aria-hidden='true' />
            )}

            <ul className='space-y-0'>
              {column.map(sub => (
                <li key={sub._id}>
                  <Link
                    href={`/categoria/${sub.slug}`}
                    onClick={onLinkClick}
                    className='group flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-[#FF6600] transition-colors'
                  >
                    <span className='border-b border-transparent group-hover:border-[#FF6600] transition-colors'>
                      {sub.name}
                    </span>
                    <ArrowRight
                      size={12}
                      className='opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FF6600] flex-shrink-0 ml-2'
                    />
                  </Link>
                </li>
              ))}
            </ul>

            {/* "Ver todos" — só no fim da última coluna */}
            {ci === columns.length - 1 && (
              <Link
                href={`/categoria/${categorySlug}`}
                onClick={onLinkClick}
                className='inline-flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 text-[11px] font-bold text-[#FF6600] hover:text-[#e55b00] uppercase tracking-wide transition-colors'
              >
                Ver todos
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ═══ COLUNA DE IMAGEM PROMO ═══ */}
      {hasPromo && (
        <div className={promoColSpan}>
          <Link
            href={`/categoria/${categorySlug}`}
            onClick={onLinkClick}
            className='group relative block rounded-lg overflow-hidden bg-gray-100 aspect-[4/3]'
          >
            <Image
              src={promo.image}
              alt={promo.title}
              fill
              sizes='320px'
              className='object-cover group-hover:scale-105 transition-transform duration-500'
            />
            {/* Gradient overlay */}
            <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent' />

            {/* Text content */}
            <div className='absolute inset-x-0 bottom-0 p-4 text-white'>
              <p className='text-[10px] uppercase tracking-widest opacity-90 mb-1'>
                {promo.subtitle}
              </p>
              <h4 className='text-base font-bold mb-2.5 leading-tight'>
                {promo.title}
              </h4>
              <span className='inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide bg-[#FF6600] text-white px-2.5 py-1.5 rounded group-hover:bg-white group-hover:text-[#FF6600] transition-colors'>
                {promo.cta}
                <ArrowRight size={11} />
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
