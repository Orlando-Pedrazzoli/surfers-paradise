'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, User, ShoppingCart, Menu, X } from 'lucide-react';
import { mainCategories } from '@/lib/config/navigation';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/busca?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* Main Header */}
      <header className='bg-white border-b border-gray-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex items-center justify-between h-16 md:h-20 gap-4'>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='md:hidden p-2 text-gray-600'
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link href='/' className='flex-shrink-0'>
              <div className='flex items-center gap-2'>
                <div className='w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center'>
                  <span className='text-white font-black text-lg'>★</span>
                </div>
                <div className='hidden sm:block'>
                  <p className='text-lg font-black text-gray-900 leading-tight'>
                    SURFERS PARADISE
                  </p>
                  <p className='text-[10px] text-gray-500 uppercase tracking-wider'>
                    Board Shop
                  </p>
                </div>
              </div>
            </Link>

            {/* Search Bar */}
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

            {/* Right Actions */}
            <div className='flex items-center gap-3 sm:gap-5'>
              <Link
                href='/login'
                className='hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-[#FF6600] transition-colors'
              >
                <User size={20} />
                <div className='hidden lg:block'>
                  <p className='text-xs text-gray-400'>Olá, seja bem vindo!</p>
                  <p className='font-medium text-xs'>ENTRAR | CADASTRE-SE</p>
                </div>
              </Link>

              <Link
                href='/carrinho'
                className='relative flex items-center gap-1 text-gray-600 hover:text-[#FF6600] transition-colors'
              >
                <ShoppingCart size={22} />
                <span className='absolute -top-1 -right-2 bg-[#FF6600] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center'>
                  0
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
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

        {/* Category Nav Bar */}
        <nav className='bg-gray-900 hidden md:block'>
          <div className='max-w-7xl mx-auto px-4'>
            <ul className='flex items-center justify-center gap-0'>
              {mainCategories.map(cat => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className={`block px-4 py-3 text-sm font-medium transition-colors ${
                      cat.label === 'Promoção'
                        ? 'text-[#FF6600] hover:text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className='fixed inset-0 z-40 md:hidden'>
          <div
            className='absolute inset-0 bg-black/50'
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className='absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto'>
            <div className='p-4 border-b bg-gray-900'>
              <p className='text-white font-bold'>SURFERS PARADISE</p>
              <p className='text-gray-400 text-xs'>Board Shop</p>
            </div>
            <nav className='py-2'>
              {mainCategories.map(cat => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className='block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6600] border-b border-gray-100'
                >
                  {cat.label}
                </Link>
              ))}
              <div className='border-t border-gray-200 mt-2 pt-2'>
                <Link
                  href='/login'
                  onClick={() => setMobileMenuOpen(false)}
                  className='block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50'
                >
                  Entrar / Cadastre-se
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
