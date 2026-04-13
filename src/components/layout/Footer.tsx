import Link from 'next/link';
import Image from 'next/image';
import { company } from '@/lib/config/company';

export default function Footer() {
  const fullAddress = `${company.address.street}, ${company.address.number} - ${company.address.neighborhood}, ${company.address.city} - ${company.address.state}, CEP: ${company.address.cep}`;

  return (
    <footer className='bg-gray-900 text-gray-300'>
      {/* Newsletter */}
      <div className='bg-[#FF6600]'>
        <div className='max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6'>
          <p className='text-white font-bold text-sm md:text-base text-center whitespace-nowrap'>
            CADASTRE-SE EM NOSSA NEWSLETTER E RECEBA NOVIDADES EXCLUSIVAS!
          </p>
          <div className='flex w-full max-w-lg'>
            <input
              type='email'
              placeholder='Insira seu e-mail aqui'
              className='flex-1 px-5 py-3 text-sm text-gray-900 bg-white rounded-l-md focus:outline-none min-w-0'
            />
            <button className='px-8 py-3 bg-gray-900 text-white text-sm font-bold rounded-r-md hover:bg-gray-800 transition-colors whitespace-nowrap'>
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
            <ul className='space-y-3'>
              <li className='text-sm flex items-center gap-2'>
                <span>✉</span>
                <a
                  href={`mailto:${company.email}`}
                  className='hover:text-[#FF6600] transition-colors'
                >
                  {company.email}
                </a>
              </li>
              <li className='text-sm flex items-center gap-2'>
                <span>📱</span>
                <a
                  href={`https://wa.me/${company.whatsapp}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-[#FF6600] transition-colors'
                >
                  {company.phone}
                </a>
              </li>
              <li className='text-sm flex items-start gap-2'>
                <span className='mt-0.5'>📍</span>
                <span>
                  {company.address.street}, {company.address.number} -{' '}
                  {company.address.neighborhood}, {company.address.city} -{' '}
                  {company.address.state}
                </span>
              </li>
              <li className='text-sm flex items-center gap-2'>
                <span>🕐</span>
                <span>{company.businessHours}</span>
              </li>
              {/* Social Icons */}
              <li className='pt-2'>
                <div className='flex items-center gap-3'>
                  <a
                    href={company.social.instagram}
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
                  </a>
                  <a
                    href={company.social.facebook}
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
                  </a>
                  <a
                    href={`https://wa.me/${company.whatsapp}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#25D366] hover:scale-110 transition-all duration-300 group'
                    aria-label='WhatsApp'
                  >
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                      className='text-gray-400 group-hover:text-white transition-colors duration-300'
                    >
                      <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
                    </svg>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Cards + Logo + Dev Credit — White Background */}
      <div className='bg-white'>
        <div className='max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-6'>
          {/* Payment Methods */}
          <div className='flex-shrink-0'>
            <Image
              src='/images/cartoes-footer.jpg'
              alt='Formas de pagamento: Amex, Aura, Diners, Discover, Elo, Hipercard, JCB, Visa, Mastercard, Boleto, PIX'
              width={500}
              height={80}
              className='h-16 w-auto object-contain'
            />
          </div>

          {/* Logo + Info — Center */}
          <div className='flex flex-col items-center text-center'>
            <Link href='/' className='flex items-center gap-2 mb-1'>
              <Image
                src='/images/logo-navbar.png'
                alt='Surfers Paradise'
                width={40}
                height={40}
                className='w-10 h-10 object-contain'
              />
              <div>
                <p className='text-gray-900 font-black text-sm leading-tight'>
                  SURFERS PARADISE
                </p>
                <p className='text-[9px] text-gray-500 uppercase tracking-wider'>
                  Authentic Board Shop
                </p>
              </div>
            </Link>
            <p className='text-[10px] text-gray-400 mt-1'>
              Há mais de 20 anos oferecendo os melhores produtos de surf do
              Brasil e do mundo.
            </p>
          </div>

          {/* Developer Credit */}
          <div className='text-center md:text-right flex-shrink-0'>
            <p className='text-[10px] text-gray-400 uppercase tracking-wide mb-1'>
              Desenvolvido por
            </p>
            <a
              href='https://pedrazzolidigital.com'
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm font-bold text-[#FF6600] hover:underline'
            >
              Pedrazzoli Digital
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className='bg-gray-950 border-t border-gray-800'>
        <div className='max-w-7xl mx-auto px-4 py-3 text-center'>
          <p className='text-[10px] text-gray-500'>
            {company.name} — {company.slogan} — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
