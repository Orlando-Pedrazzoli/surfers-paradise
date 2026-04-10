import Link from 'next/link';
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
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
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
