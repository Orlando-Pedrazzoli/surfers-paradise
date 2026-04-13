'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Search, User, Menu, X, ChevronDown } from 'lucide-react';
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

const megaImages: Record<string, string> = {
  pranchas: '/images/mega-pranchas.jpg',
  quilhas: '/images/mega-quilhas.jpg',
  deck: '/images/mega-deck.jpg',
  leash: '/images/mega-leash.jpg',
  wetsuit: '/images/mega-wetsuit.jpg',
  parafinas: '/images/mega-parafinas.jpg',
  acessorios: '/images/mega-acessorios.jpg',
  'sup-longboard-funboard': '/images/mega-sup.jpg',
  capas: '/images/mega-capas.jpg',
};

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

  const splitIntoColumns = (items: SubCategory[], perColumn: number = 5) => {
    const columns: SubCategory[][] = [];
    for (let i = 0; i < items.length; i += perColumn) {
      columns.push(items.slice(i, i + perColumn));
    }
    return columns;
  };

  return (
    <>
      <header className='bg-white border-b border-gray-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex items-center justify-between h-16 md:h-20 gap-4'>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='md:hidden p-2 text-gray-600'
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
                <div className='hidden sm:block'>
                  <p className='text-lg font-black text-gray-900 leading-tight'>
                    SURFERS PARADISE
                  </p>
                  <p className='text-[10px] text-gray-500 uppercase tracking-wider'>
                    Authentic Board Shop
                  </p>
                </div>
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
              {mainCategories.map(cat => {
                const slug = getSlugFromHref(cat.href);
                const subcategories = getSubcategories(slug);
                const hasSubmenu = subcategories.length > 0;

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
                          : activeMenu === slug
                            ? 'text-white bg-gray-800'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {cat.label}
                      {hasSubmenu && (
                        <ChevronDown size={12} className='opacity-50' />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ═══ MEGA-MENU DROPDOWN ═══ */}
          {activeMenu && (
            <div
              className='absolute left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50'
              onMouseEnter={() => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
              }}
              onMouseLeave={handleMouseLeave}
            >
              <div className='max-w-7xl mx-auto px-4 py-6'>
                <div className='flex gap-8'>
                  <div className='flex-1'>
                    <div className='flex gap-8'>
                      {splitIntoColumns(getSubcategories(activeMenu)).map(
                        (column, ci) => (
                          <div key={ci} className='min-w-[160px]'>
                            {column.map(sub => (
                              <Link
                                key={sub._id}
                                href={`/categoria/${sub.slug}`}
                                className='block py-1.5 text-sm text-gray-600 hover:text-[#FF6600] transition-colors'
                                onClick={() => setActiveMenu(null)}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        ),
                      )}
                    </div>
                    <Link
                      href={`/categoria/${activeMenu}`}
                      className='inline-block mt-4 text-sm font-semibold text-[#FF6600] hover:text-[#e55b00] transition-colors'
                      onClick={() => setActiveMenu(null)}
                    >
                      Ver todos →
                    </Link>
                  </div>

                  {megaImages[activeMenu] && (
                    <div className='hidden lg:block w-[300px] flex-shrink-0'>
                      <Link
                        href={`/categoria/${activeMenu}`}
                        onClick={() => setActiveMenu(null)}
                        className='block rounded-lg overflow-hidden'
                      >
                        <Image
                          src={megaImages[activeMenu]}
                          alt={activeMenu}
                          width={300}
                          height={200}
                          className='w-full h-auto object-cover hover:scale-105 transition-transform duration-300'
                        />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
              <p className='text-white font-bold'>SURFERS PARADISE</p>
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
                        className='flex-1 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6600]'
                      >
                        {cat.label}
                      </Link>
                      {hasSubmenu && (
                        <button
                          onClick={() =>
                            setExpandedMobile(isExpanded ? null : slug)
                          }
                          className='px-4 py-3 text-gray-400'
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
