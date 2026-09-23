import { Metadata } from 'next';
import Link from 'next/link';
import { QrCode, Truck, CreditCard, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Regras de Pagamento e Políticas de Desconto',
  description:
    'Condições da Surfers Paradise: 10% de desconto no PIX e boleto, frete grátis acima de R$ 399 para todo o Brasil e parcelamento em até 10x sem juros no cartão.',
};

// Faixas de parcelamento (parcela mínima R$ 30,00)
const INSTALLMENT_RANGES = [
  { range: 'R$ 60,00 a R$ 89,99', max: 2 },
  { range: 'R$ 90,00 a R$ 119,99', max: 3 },
  { range: 'R$ 120,00 a R$ 149,99', max: 4 },
  { range: 'R$ 150,00 a R$ 179,99', max: 5 },
  { range: 'R$ 180,00 a R$ 209,99', max: 6 },
  { range: 'R$ 210,00 a R$ 239,99', max: 7 },
  { range: 'R$ 240,00 a R$ 269,99', max: 8 },
  { range: 'R$ 270,00 a R$ 299,99', max: 9 },
  { range: 'Acima de R$ 300,00', max: 10 },
];

export default function CondicoesPage() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <nav className='text-sm text-gray-500 mb-8'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>
          Regras de Pagamento e Políticas de Desconto
        </span>
      </nav>

      <h1 className='text-3xl font-black text-gray-900 mb-4'>
        Regras de Pagamento e Políticas de Desconto
      </h1>

      <p className='text-gray-700 leading-relaxed mb-8'>
        Aqui explicamos como funcionam as três condições que anunciamos no site:
        o desconto à vista, o frete grátis e o parcelamento sem juros.
      </p>

      {/* Índice rápido */}
      <div className='flex flex-wrap gap-2 mb-10'>
        <a
          href='#desconto-pix'
          className='text-sm px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors'
        >
          Desconto no PIX / Boleto
        </a>
        <a
          href='#frete-gratis'
          className='text-sm px-3 py-1.5 rounded-full bg-[#FF6600]/10 text-[#FF6600] border border-[#FF6600]/20 hover:bg-[#FF6600]/20 transition-colors'
        >
          Frete Grátis
        </a>
        <a
          href='#parcelamento'
          className='text-sm px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors'
        >
          Parcelamento
        </a>
      </div>

      <div className='space-y-6'>
        {/* ═══ Desconto PIX / Boleto ═══ */}
        <section
          id='desconto-pix'
          className='bg-white rounded-lg shadow-sm p-6 scroll-mt-24'
        >
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center'>
              <QrCode size={24} className='text-green-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Regras de Desconto no Boleto ou PIX
              </h2>
              <p className='text-sm text-green-600 font-medium'>
                10% de desconto no pagamento à vista
              </p>
            </div>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed'>
            <p>
              Em geral, os pedidos com pagamento via{' '}
              <strong>Boleto Bancário</strong> e/ou <strong>PIX</strong>{' '}
              contemplam um desconto de <strong>10%</strong> na finalização da
              compra.
            </p>
            <div className='flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-4'>
              <AlertTriangle
                size={16}
                className='text-amber-500 flex-shrink-0 mt-0.5'
              />
              <p>
                O desconto à vista poderá sofrer alterações em caso de campanhas
                promocionais, como a Black Friday.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Frete Grátis ═══ */}
        <section
          id='frete-gratis'
          className='bg-white rounded-lg shadow-sm p-6 scroll-mt-24'
        >
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-[#FF6600]/10 rounded-lg flex items-center justify-center'>
              <Truck size={24} className='text-[#FF6600]' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Regras de Frete Grátis
              </h2>
              <p className='text-sm text-[#FF6600] font-medium'>
                Compras acima de R$ 399,00 para todo o Brasil
              </p>
            </div>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed'>
            <p>
              O frete grátis é ativado em compras acima de{' '}
              <strong>R$ 399,00</strong> para todo o país. Nessa modalidade, a
              transportadora é sempre escolhida pela Surfers Paradise.
            </p>
            <div className='flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-4'>
              <AlertTriangle
                size={16}
                className='text-amber-500 flex-shrink-0 mt-0.5'
              />
              <p>
                <strong>Exceto pranchas</strong>, que têm um custo diferenciado
                por se tratarem de volumes grandes, com seguro de frete elevado.
                Não oferecemos frete grátis para esta categoria.
              </p>
            </div>
            <p>
              Em caso de devolução parcial de pedidos com frete grátis, se o
              valor final ficar abaixo do mínimo da promoção, o valor do frete
              poderá ser descontado do reembolso.
            </p>
          </div>
        </section>

        {/* ═══ Parcelamento ═══ */}
        <section
          id='parcelamento'
          className='bg-white rounded-lg shadow-sm p-6 scroll-mt-24'
        >
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center'>
              <CreditCard size={24} className='text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Regras de Parcelamento
              </h2>
              <p className='text-sm text-blue-600 font-medium'>
                Até 10x sem juros no cartão de crédito
              </p>
            </div>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed'>
            <p>
              Todos os produtos do site têm parcelamento via cartão de crédito
              em até <strong>10x sem juros</strong>, desde que cada parcela seja
              de no mínimo <strong>R$ 30,00</strong>.
            </p>

            <div className='overflow-x-auto'>
              <table className='w-full text-sm border border-gray-200 rounded-lg overflow-hidden'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left px-4 py-2 font-semibold text-gray-900'>
                      Valor da compra
                    </th>
                    <th className='text-left px-4 py-2 font-semibold text-gray-900'>
                      Parcelamento
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {INSTALLMENT_RANGES.map(row => (
                    <tr key={row.max} className='border-t border-gray-100'>
                      <td className='px-4 py-2 text-gray-700'>{row.range}</td>
                      <td className='px-4 py-2 font-medium text-gray-900'>
                        Até {row.max}x sem juros
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Dúvidas */}
        <div className='bg-gray-50 rounded-lg p-6 text-center'>
          <p className='text-gray-700 mb-2'>Ainda tem dúvidas?</p>
          <p className='text-sm text-gray-500'>
            Entre em contato pelo WhatsApp{' '}
            <a
              href='https://wa.me/5511947169003'
              target='_blank'
              rel='noopener noreferrer'
              className='text-[#FF6600] hover:underline font-medium'
            >
              (11) 94716-9003
            </a>{' '}
            ou pelo e-mail{' '}
            <a
              href='mailto:contato@surfersparadise.com.br'
              className='text-[#FF6600] hover:underline font-medium'
            >
              contato@surfersparadise.com.br
            </a>
            . Veja também as{' '}
            <Link
              href='/formas-pagamento'
              className='text-[#FF6600] hover:underline font-medium'
            >
              formas de pagamento
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
