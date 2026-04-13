import { Metadata } from 'next';
import Link from 'next/link';
import { Truck, Clock, Package, MapPin, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Prazos de Entrega',
  description:
    'Informações sobre prazos de entrega, frete grátis e serviço de envio da Surfers Paradise. Entregamos em todo o Brasil.',
};

export default function PrazosEntregaPage() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <nav className='text-sm text-gray-500 mb-8'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Prazos de Entrega</span>
      </nav>

      <h1 className='text-3xl font-black text-gray-900 mb-8'>
        Prazos de Entrega
      </h1>

      <div className='space-y-8'>
        {/* Serviço de Entrega */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Truck size={24} className='text-[#FF6600]' />
            <h2 className='text-xl font-bold text-gray-900'>
              Serviço de Entrega
            </h2>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed'>
            <div className='flex gap-3'>
              <span className='text-[#FF6600] font-bold text-sm mt-0.5'>
                I.
              </span>
              <p>
                Após a confirmação do pagamento, o prazo para expedir os
                produtos é de até <strong>24 horas úteis</strong>.
              </p>
            </div>

            <div className='flex gap-3'>
              <span className='text-[#FF6600] font-bold text-sm mt-0.5'>
                II.
              </span>
              <p>Não é possível agendar data e horário para entregas.</p>
            </div>

            <div className='flex gap-3'>
              <span className='text-[#FF6600] font-bold text-sm mt-0.5'>
                III.
              </span>
              <p>
                O recebimento da mercadoria pode ser realizado por terceiros,
                como porteiros de condomínios e familiares, desde que assinem o
                comprovante de recebimento da mercadoria.
              </p>
            </div>

            <div className='flex gap-3'>
              <span className='text-[#FF6600] font-bold text-sm mt-0.5'>
                IV.
              </span>
              <p>
                As transportadoras normalmente realizam até{' '}
                <strong>três tentativas de entrega</strong> em dias úteis. Após
                três tentativas sem sucesso, o produto será devolvido ao nosso
                Centro de Distribuição para um novo envio, e o prazo de entrega
                recomeça do início.
              </p>
            </div>

            <div className='flex gap-3'>
              <span className='text-[#FF6600] font-bold text-sm mt-0.5'>
                V.
              </span>
              <p>
                Entregamos em <strong>todo o território nacional</strong>.
              </p>
            </div>
          </div>

          <div className='bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-lg p-4 mt-6'>
            <p className='text-sm font-bold text-[#FF6600]'>
              <Clock size={16} className='inline mr-2' />
              ATENÇÃO: As entregas são realizadas de segunda a sexta-feira em
              horário comercial, entre 8h e 18h.
            </p>
          </div>
        </div>

        {/* Frete Grátis */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Package size={24} className='text-[#FF6600]' />
            <h2 className='text-xl font-bold text-gray-900'>Frete Grátis*</h2>
          </div>

          <p className='text-gray-700 leading-relaxed mb-6'>
            A Surfers Paradise oferece <strong>Frete Grátis</strong> para todo o
            Brasil em compras a partir de <strong>R$ 200,00</strong> para as
            regiões Sul e Sudeste, e acima de <strong>R$ 300,00</strong> para as
            regiões Norte, Nordeste e Centro-Oeste.
          </p>

          <div className='bg-gray-50 rounded-lg p-4 mb-6'>
            <p className='text-sm text-gray-600'>
              <strong>Exceção — Pranchas de Surf:</strong> Por tratar-se de
              grandes volumes, as pranchas possuem um custo de frete
              diferenciado. Estas terão um valor fixo por região como frete mais
              acessível, sendo que parte do mesmo será subsidiado pela Surfers
              Paradise, além de outras opções de transportadoras à escolha do
              cliente.
            </p>
          </div>

          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2'>
                <MapPin size={18} className='text-[#FF6600]' />
                I. Frete Grátis — Como Funciona
              </h3>
              <p className='text-gray-700 leading-relaxed'>
                Atingindo o valor mínimo para o frete grátis (com exceção das
                pranchas), o envio é realizado via{' '}
                <strong>transportadora</strong>. O prazo de entrega varia
                conforme a região e estará sempre disponível para consulta antes
                de finalizar a compra. O prazo de entrega só começa a contar a
                partir da <strong>confirmação do pagamento</strong>.
              </p>
            </div>

            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2'>
                <Mail size={18} className='text-[#FF6600]' />
                II. Como Fico Sabendo que o Meu Pedido Foi Aprovado?
              </h3>
              <p className='text-gray-700 leading-relaxed'>
                Você receberá um{' '}
                <strong>e-mail de confirmação de pagamento</strong> assim que o
                pagamento for processado. Além disso, você pode acompanhar o
                status do seu pedido a qualquer momento acessando{' '}
                <Link
                  href='/meus-pedidos'
                  className='text-[#FF6600] hover:underline font-medium'
                >
                  Meus Pedidos
                </Link>{' '}
                e fazendo login na sua conta.
              </p>
            </div>
          </div>
        </div>

        {/* Tabela de Prazos */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-bold text-gray-900 mb-4'>
            Prazos Estimados por Região
          </h2>
          <p className='text-sm text-gray-500 mb-4'>
            Os prazos abaixo são estimados e contam a partir da confirmação do
            pagamento.
          </p>

          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-gray-900 text-white'>
                  <th className='text-left px-4 py-3 font-medium'>Região</th>
                  <th className='text-left px-4 py-3 font-medium'>
                    Prazo Estimado
                  </th>
                  <th className='text-left px-4 py-3 font-medium'>
                    Frete Grátis a partir de
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                <tr className='hover:bg-gray-50'>
                  <td className='px-4 py-3 text-gray-700'>
                    São Paulo (Capital e Grande SP)
                  </td>
                  <td className='px-4 py-3 text-gray-700'>1 a 3 dias úteis</td>
                  <td className='px-4 py-3 text-[#FF6600] font-medium'>
                    R$ 200,00
                  </td>
                </tr>
                <tr className='hover:bg-gray-50'>
                  <td className='px-4 py-3 text-gray-700'>
                    Sudeste (RJ, MG, ES)
                  </td>
                  <td className='px-4 py-3 text-gray-700'>3 a 6 dias úteis</td>
                  <td className='px-4 py-3 text-[#FF6600] font-medium'>
                    R$ 200,00
                  </td>
                </tr>
                <tr className='hover:bg-gray-50'>
                  <td className='px-4 py-3 text-gray-700'>Sul (PR, SC, RS)</td>
                  <td className='px-4 py-3 text-gray-700'>3 a 7 dias úteis</td>
                  <td className='px-4 py-3 text-[#FF6600] font-medium'>
                    R$ 200,00
                  </td>
                </tr>
                <tr className='hover:bg-gray-50'>
                  <td className='px-4 py-3 text-gray-700'>Nordeste</td>
                  <td className='px-4 py-3 text-gray-700'>5 a 10 dias úteis</td>
                  <td className='px-4 py-3 text-[#FF6600] font-medium'>
                    R$ 300,00
                  </td>
                </tr>
                <tr className='hover:bg-gray-50'>
                  <td className='px-4 py-3 text-gray-700'>Centro-Oeste</td>
                  <td className='px-4 py-3 text-gray-700'>5 a 10 dias úteis</td>
                  <td className='px-4 py-3 text-[#FF6600] font-medium'>
                    R$ 300,00
                  </td>
                </tr>
                <tr className='hover:bg-gray-50'>
                  <td className='px-4 py-3 text-gray-700'>Norte</td>
                  <td className='px-4 py-3 text-gray-700'>7 a 15 dias úteis</td>
                  <td className='px-4 py-3 text-[#FF6600] font-medium'>
                    R$ 300,00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className='text-xs text-gray-400 mt-4'>
            * Os prazos são estimativas e podem variar de acordo com a
            transportadora e a disponibilidade do produto. Pranchas de surf
            possuem prazos e valores de frete diferenciados.
          </p>
        </div>

        {/* Dúvidas */}
        <div className='bg-gray-50 rounded-lg p-6 text-center'>
          <p className='text-gray-700 mb-2'>Ainda tem dúvidas sobre entrega?</p>
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
          </p>
        </div>
      </div>
    </div>
  );
}
