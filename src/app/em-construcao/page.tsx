// src/app/em-construcao/page.tsx
// 🚧 Página de manutenção. Enquanto MAINTENANCE_MODE=true, o proxy.ts faz
// rewrite de todas as rotas públicas para aqui. Admin, POS e API ficam fora.
// Fica fora do grupo (shop) de propósito: sem Navbar, Footer ou WhatsAppButton.

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Lock } from 'lucide-react';
import { company } from '@/lib/config/company';

// lucide-react v1 não inclui ícones de marcas — SVG inline, igual ao Footer
function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <rect x='2' y='2' width='20' height='20' rx='5' />
      <circle cx='12' cy='12' r='5' />
      <circle cx='17.5' cy='6.5' r='1' fill='currentColor' stroke='none' />
    </svg>
  );
}

export const metadata: Metadata = {
  title: 'Site em construção',
  description:
    'Estamos renovando toda a nossa linha de produtos. Em breve, novidades!',
  // Página temporária: não indexar nem substituir as páginas já indexadas.
  robots: { index: false, follow: false },
};

export default function EmConstrucaoPage() {
  const whatsappUrl = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(
    'Olá! Vi que o site está em construção e gostaria de informações.',
  )}`;

  return (
    <div className='min-h-screen flex flex-col bg-[#1A1A1A] text-white relative overflow-hidden'>
      {/* Background Pattern (mesmo do admin-login) */}
      <div className='absolute inset-0 opacity-5 pointer-events-none'>
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Conteúdo */}
      <main className='relative flex-1 flex items-center justify-center px-4 py-16'>
        <div className='w-full max-w-xl text-center'>
          <div className='inline-flex items-center gap-3 mb-10'>
            <Image
              src='/images/logo-navbar.png'
              alt='Surfers Paradise'
              width={64}
              height={64}
              priority
              className='w-16 h-16 object-contain'
            />
            <div className='text-left'>
              <p className='font-black text-2xl leading-tight'>
                SURFERS PARADISE
              </p>
              <p className='text-[11px] text-gray-400 uppercase tracking-widest'>
                Authentic Board Shop
              </p>
            </div>
          </div>

          <p className='text-[#FF6600] text-xs font-bold uppercase tracking-[0.3em] mb-4'>
            Site em construção
          </p>
          <h1 className='text-3xl sm:text-4xl font-black leading-tight mb-5'>
            Estamos preparando novidades
          </h1>
          <p className='text-gray-300 text-base sm:text-lg leading-relaxed mb-10'>
            Nossa loja online está passando por uma renovação completa, com uma
            nova linha de produtos chegando. Aguarde — em breve voltamos com
            tudo novo.
          </p>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
            <a
              href={whatsappUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold transition-colors'
            >
              <MessageCircle size={20} />
              Fale conosco no WhatsApp
            </a>
            <a
              href={company.social.instagram}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-600 hover:border-[#FF6600] hover:text-[#FF6600] font-bold transition-colors'
            >
              <InstagramIcon size={20} />
              Siga no Instagram
            </a>
          </div>

          <p className='text-gray-500 text-sm mt-10'>
            Loja física: {company.address.street}, {company.address.number} —{' '}
            {company.address.neighborhood}, {company.address.city}/
            {company.address.state}
            <br />
            {company.businessHours}
          </p>
        </div>
      </main>

      {/* Footer — crédito + acesso ao painel admin */}
      <footer className='relative border-t border-white/10 px-4 py-5'>
        <div className='max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500'>
          <p>
            © {new Date().getFullYear()} {company.name}. Todos os direitos
            reservados.
          </p>
          <div className='flex items-center gap-2'>
            <span className='uppercase tracking-wide text-[10px]'>
              Desenvolvido por
            </span>
            <a
              href='https://pedrazzolidigital.com'
              target='_blank'
              rel='noopener noreferrer'
              className='font-bold text-[#FF6600] hover:underline'
            >
              Pedrazzoli Digital
            </a>
            <Link
              href='/admin-login'
              className='text-gray-600 hover:text-[#FF6600] transition-colors ml-1'
              title='Painel Administrativo'
              aria-label='Painel Administrativo'
            >
              <Lock size={14} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
