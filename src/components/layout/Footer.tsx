import Link from 'next/link';
import Image from 'next/image';
import { company } from '@/lib/config/company';

export default function Footer() {
  return (
    <footer className='bg-gray-900 text-gray-300'>
      {/* Newsletter */}
      <div className='bg-[#FF6600]'>
        <div className='max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-center gap-4'>
          <p className='text-white font-bold text-sm md:text-base text-center'>
            CADASTRE-SE EM NOSSA NEWSLETTER E RECEBA NOVIDADES EXCLUSIVAS!
          </p>
          <div className='flex w-full max-w-md'>
            <input
              type='email'
              placeholder='Insira seu e-mail aqui'
              className='flex-1 px-4 py-2 text-sm text-gray-900 rounded-l-md focus:outline-none'
            />
            <button className='px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-r-md hover:bg-gray-800 transition-colors'>
              CADASTRAR
            </button>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className='max-w-7xl mx-auto px-4 py-10'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8'>
          {/* Logo + Social */}
          <div>
            <Link href='/' className='flex items-center gap-2 mb-4'>
              <Image
                src='/images/logo-navbar.png'
                alt='Surfers Paradise'
                width={48}
                height={48}
                className='w-12 h-12 object-contain'
              />
              <div>
                <p className='text-white font-black text-sm leading-tight'>
                  SURFERS PARADISE
                </p>
                <p className='text-[9px] text-gray-400 uppercase tracking-wider'>
                  Authentic Board Shop
                </p>
              </div>
            </Link>
            <p className='text-xs text-gray-400 mb-4 leading-relaxed'>
              Há mais de 20 anos oferecendo os melhores produtos de surf do
              Brasil e do mundo.
            </p>
            {/* Social Icons */}
            <div className='flex items-center gap-3'>
              <Link
                href='https://www.instagram.com/lojasurfersparadiseoficial/'
                target='_blank'
                rel='noopener noreferrer'
                className='w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#FF6600] hover:scale-110 transition-all duration-300 group'
                aria-label='Instagram'
              >
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  className='text-gray-400 group-hover:text-white transition-colors duration-300'
                >
                  <rect
                    x='2'
                    y='2'
                    width='20'
                    height='20'
                    rx='5'
                    stroke='currentColor'
                    strokeWidth='2'
                  />
                  <circle
                    cx='12'
                    cy='12'
                    r='5'
                    stroke='currentColor'
                    strokeWidth='2'
                  />
                  <circle cx='18' cy='6' r='1.5' fill='currentColor' />
                </svg>
              </Link>
              <Link
                href='https://web.facebook.com/lojasurfersparadise/'
                target='_blank'
                rel='noopener noreferrer'
                className='w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#FF6600] hover:scale-110 transition-all duration-300 group'
                aria-label='Facebook'
              >
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  className='text-gray-400 group-hover:text-white transition-colors duration-300'
                >
                  <path d='M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z' />
                </svg>
              </Link>
            </div>
          </div>

          {/* Sobre Nós */}
          <div>
            <h3 className='text-white font-bold text-sm mb-4 uppercase'>
              Sobre Nós
            </h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/a-empresa'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  A Empresa
                </Link>
              </li>
              <li>
                <Link
                  href='/politica-privacidade'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href='/termos'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  href='/contato'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Fale Conosco
                </Link>
              </li>
            </ul>
          </div>

          {/* Dúvidas */}
          <div>
            <h3 className='text-white font-bold text-sm mb-4 uppercase'>
              Dúvidas
            </h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/prazos-entrega'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Prazos de Entrega
                </Link>
              </li>
              <li>
                <Link
                  href='/formas-pagamento'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Formas de Pagamento
                </Link>
              </li>
              <li>
                <Link
                  href='/trocas-devolucoes'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Garantia, Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link
                  href='/faq'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Minha Conta */}
          <div>
            <h3 className='text-white font-bold text-sm mb-4 uppercase'>
              Minha Conta
            </h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/login'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Entrar
                </Link>
              </li>
              <li>
                <Link
                  href='/cadastro'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Cadastre-se
                </Link>
              </li>
              <li>
                <Link
                  href='/meus-pedidos'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Meus Pedidos
                </Link>
              </li>
              <li>
                <Link
                  href='/enderecos'
                  className='text-sm hover:text-[#FF6600] transition-colors'
                >
                  Meus Endereços
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className='text-white font-bold text-sm mb-4 uppercase'>
              Contato
            </h3>
            <ul className='space-y-2'>
              {company.email && <li className='text-sm'>✉ {company.email}</li>}
              {company.phone && <li className='text-sm'>✆ {company.phone}</li>}
              {company.whatsapp && (
                <li className='text-sm'>✆ WhatsApp: {company.whatsapp}</li>
              )}
              {company.businessHours && (
                <li className='text-sm'>{company.businessHours}</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className='border-t border-gray-800'>
        <div className='max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4'>
          <p className='text-xs text-gray-500 text-center'>
            {company.name} — {company.slogan}
          </p>
          <p className='text-xs text-gray-500'>
            Desenvolvido por{' '}
            <a
              href='https://pedrazzolidigital.com'
              target='_blank'
              rel='noopener noreferrer'
              className='text-[#FF6600] hover:underline'
            >
              Pedrazzoli Digital
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
