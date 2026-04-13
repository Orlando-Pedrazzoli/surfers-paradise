import { Metadata } from 'next';
import Link from 'next/link';
import {
  CreditCard,
  QrCode,
  FileText,
  Shield,
  Clock,
  Percent,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Formas de Pagamento',
  description:
    'Conheça as formas de pagamento aceitas pela Surfers Paradise: cartão de crédito em até 10x sem juros, PIX com 10% de desconto e boleto bancário.',
};

export default function FormasPagamentoPage() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <nav className='text-sm text-gray-500 mb-8'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Formas de Pagamento</span>
      </nav>

      <h1 className='text-3xl font-black text-gray-900 mb-8'>
        Formas de Pagamento
      </h1>

      <div className='space-y-6'>
        {/* Cartão de Crédito */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-[#FF6600]/10 rounded-lg flex items-center justify-center'>
              <CreditCard size={24} className='text-[#FF6600]' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Cartão de Crédito
              </h2>
              <p className='text-sm text-[#FF6600] font-medium'>
                Parcele em até 10x sem juros
              </p>
            </div>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed'>
            <p>
              Os números de cartões de crédito fornecidos são registrados
              diretamente no banco de dados das administradoras de cartão
              através da <strong>Pagar.me</strong>, não permitindo o acesso a
              essas informações por parte da Surfers Paradise.
            </p>

            <p>
              Ao informar os dados para a administradora, esta realiza a
              verificação da transação online e retorna apenas se a compra está
              liberada ou não. Após a validação da operadora, o pedido passa por
              uma <strong>análise de segurança antifraude</strong> para garantir
              que o portador do cartão realmente está efetuando a compra,
              evitando qualquer tentativa de fraude.
            </p>

            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <Clock size={14} />
              <span>
                Esse prazo pode ser instantâneo ou levar até{' '}
                <strong>48 horas úteis</strong>.
              </span>
            </div>

            <div className='bg-gray-50 rounded-lg p-4'>
              <p className='text-sm font-semibold text-gray-900 mb-2'>
                Bandeiras aceitas:
              </p>
              <p className='text-sm text-gray-600'>
                Visa, Mastercard, American Express, Diners Club, Elo, Aura, JCB,
                Discover e Hipercard.
              </p>
            </div>

            <div className='bg-[#FF6600]/5 border border-[#FF6600]/20 rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-1'>
                <Percent size={16} className='text-[#FF6600]' />
                <span className='text-sm font-bold text-[#FF6600]'>
                  Parcelamento
                </span>
              </div>
              <p className='text-sm text-gray-700'>
                Parcele suas compras em até <strong>10x sem juros</strong> no
                cartão de crédito. Parcela mínima de R$ 30,00.
              </p>
            </div>
          </div>
        </div>

        {/* PIX */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center'>
              <QrCode size={24} className='text-green-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>PIX à Vista</h2>
              <p className='text-sm text-green-600 font-medium'>
                10% de desconto
              </p>
            </div>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed'>
            <p>
              No pagamento com PIX à vista, é gerado automaticamente um{' '}
              <strong>QR Code</strong> e um código{' '}
              <strong>PIX Copia e Cola</strong> na finalização da sua compra. A
              aprovação é <strong>imediata</strong> após a efetivação do
              pagamento.
            </p>

            <p>
              Utilizamos a <strong>Pagar.me</strong> para intermediar os
              pagamentos e garantir aprovações instantâneas com total segurança.
            </p>

            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-1'>
                <Percent size={16} className='text-green-600' />
                <span className='text-sm font-bold text-green-700'>
                  Desconto Especial
                </span>
              </div>
              <p className='text-sm text-gray-700'>
                Pagamentos via PIX possuem <strong>10% de desconto</strong>{' '}
                sobre o valor total do pedido.
              </p>
            </div>
          </div>
        </div>

        {/* Boleto */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center'>
              <FileText size={24} className='text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Boleto Bancário
              </h2>
              <p className='text-sm text-blue-600 font-medium'>
                10% de desconto — pagamento à vista
              </p>
            </div>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed'>
            <p>
              O pagamento via boleto bancário é sempre na modalidade{' '}
              <strong>à vista</strong>. O prazo de validação do pagamento é de
              até <strong>24 horas úteis</strong> após a efetivação do pagamento
              (compensação bancária).
            </p>

            <p>
              Os boletos podem ser pagos em qualquer banco, aplicativo bancário
              ou casas lotéricas.
            </p>

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-1'>
                <Percent size={16} className='text-blue-600' />
                <span className='text-sm font-bold text-blue-700'>
                  Desconto Especial
                </span>
              </div>
              <p className='text-sm text-gray-700'>
                Pagamentos via boleto também possuem{' '}
                <strong>10% de desconto</strong> sobre o valor total do pedido.
              </p>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <Clock size={14} />
              <span>
                O prazo de entrega só começa a contar após a compensação do
                boleto.
              </span>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center'>
              <Shield size={24} className='text-gray-700' />
            </div>
            <h2 className='text-xl font-bold text-gray-900'>Segurança</h2>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed'>
            <p>
              Todas as transações realizadas na Surfers Paradise são processadas
              pela <strong>Pagar.me</strong>, uma das maiores empresas de meios
              de pagamento do Brasil, garantindo total segurança e criptografia
              dos seus dados.
            </p>

            <p>
              Nosso site possui <strong>certificado SSL</strong>, que
              criptografa todas as informações transmitidas entre o seu
              navegador e os nossos servidores, protegendo seus dados pessoais e
              financeiros.
            </p>

            <p>
              Não armazenamos dados de cartão de crédito em nossos servidores.
              Todas as informações de pagamento são processadas diretamente pela
              Pagar.me em ambiente seguro e certificado.
            </p>
          </div>
        </div>

        {/* Dúvidas */}
        <div className='bg-gray-50 rounded-lg p-6 text-center'>
          <p className='text-gray-700 mb-2'>
            Ainda tem dúvidas sobre pagamento?
          </p>
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
