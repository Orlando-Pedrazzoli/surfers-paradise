import { Metadata } from 'next';
import Link from 'next/link';
import {
  RotateCcw,
  XCircle,
  Repeat,
  PackageX,
  AlertTriangle,
  Wrench,
  WrenchIcon,
  Banknote,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Garantia, Trocas e Devoluções',
  description:
    'Política de garantia, trocas e devoluções da Surfers Paradise. Transparência e respeito ao Código de Defesa do Consumidor.',
};

export default function TrocasDevolucoesPAge() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <nav className='text-sm text-gray-500 mb-8'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Garantia, Trocas e Devoluções</span>
      </nav>

      <h1 className='text-3xl font-black text-gray-900 mb-4'>
        Garantia, Trocas e Devoluções
      </h1>

      <p className='text-gray-700 leading-relaxed mb-8'>
        Para garantir a sua satisfação e manter a transparência e respeito com
        nossos clientes, criamos nossa política de trocas e devoluções tendo
        como base o <strong>Código de Defesa do Consumidor</strong>.
      </p>

      <div className='bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-lg p-4 mb-8'>
        <p className='text-sm text-gray-700'>
          As ocorrências que envolvam troca ou devolução devem ser comunicadas à
          nossa Central de Atendimento:{' '}
          <a
            href='mailto:contato@surfersparadise.com.br'
            className='text-[#FF6600] hover:underline font-medium'
          >
            contato@surfersparadise.com.br
          </a>{' '}
          ou WhatsApp{' '}
          <a
            href='https://wa.me/5511947169003'
            target='_blank'
            rel='noopener noreferrer'
            className='text-[#FF6600] hover:underline font-medium'
          >
            (11) 94716-9003
          </a>
          .
        </p>
        <p className='text-xs text-gray-500 mt-2'>
          Qualquer produto devolvido sem comunicação prévia, fora do prazo, com
          ausência de itens/acessórios ou com avarias, será informado ao
          consumidor e reenviado ao mesmo.
        </p>
      </div>

      <div className='space-y-6'>
        {/* Desistência */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center'>
              <XCircle size={20} className='text-red-500' />
            </div>
            <h2 className='text-lg font-bold text-gray-900'>
              Desistência de Compra
            </h2>
          </div>

          <div className='space-y-3 text-gray-700 leading-relaxed text-sm'>
            <p>
              Caso se arrependa da compra, você pode cancelar o pedido e ter o
              dinheiro pago <strong>inteiramente estornado</strong>. O
              cancelamento poderá ser realizado antes mesmo do produto sair do
              nosso centro de distribuição, e a devolução do valor pago será
              integral, incluindo o valor do frete, caso tenha sido pago.
            </p>
            <p>
              Caso já tenha recebido o produto ou ele esteja a caminho, você
              terá até <strong>7 dias corridos após o recebimento</strong> para
              solicitar a devolução. O produto deve estar em sua embalagem
              original, sem indícios de uso, com todos os itens recebidos e a
              Nota Fiscal. Neste caso, o cliente receberá todo valor pago de
              volta, incluindo eventuais gastos com frete.
            </p>
            <p className='text-xs text-gray-500'>
              Em caso de devolução parcial de pedidos com frete grátis, se o
              valor final ficar abaixo do mínimo da promoção, o valor do frete
              poderá ser descontado do reembolso.
            </p>
          </div>
        </div>

        {/* Trocas por erro */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center'>
              <Repeat size={20} className='text-blue-500' />
            </div>
            <h2 className='text-lg font-bold text-gray-900'>
              Trocas por Erro de Compra / Troca de Tamanho
            </h2>
          </div>

          <div className='space-y-3 text-gray-700 leading-relaxed text-sm'>
            <p>
              As trocas serão feitas somente para produtos{' '}
              <strong>sem uso</strong> e com a{' '}
              <strong>embalagem original</strong>.
            </p>
            <p>
              Todos os nossos produtos possuem em sua descrição os tamanhos,
              cores, encaixes e compatibilidade, além de fotos ilustrativas.
              Caso tenha comprado um produto por engano ou escolhido o tamanho
              errado, daremos total liberdade de troca.{' '}
              <strong>Nenhum valor adicional será cobrado pela troca</strong>,
              apenas os valores de frete serão de responsabilidade do
              consumidor.
            </p>
            <p>
              Os produtos de troca serão despachados após o recebimento do
              produto devolvido, que passará por avaliação de danificações,
              marcas de uso e avarias.
            </p>
          </div>
        </div>

        {/* Produto avariado */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center'>
              <PackageX size={20} className='text-orange-500' />
            </div>
            <h2 className='text-lg font-bold text-gray-900'>
              Produto Avariado e Embalagem Violada
            </h2>
          </div>

          <div className='space-y-3 text-gray-700 leading-relaxed text-sm'>
            <p>
              Nossos produtos não sofrem qualquer alteração em nosso Centro de
              Distribuição. Eles são enviados exatamente como recebidos do
              fabricante.
            </p>
            <p>
              É importante que você{' '}
              <strong>confira sua mercadoria no ato da entrega</strong>{' '}
              realizada pelo transportador. Caso receba o produto com alguma
              avaria, <strong>recuse o recebimento</strong> e avise
              imediatamente nossa central de atendimento.
            </p>
          </div>
        </div>

        {/* Produto em desacordo */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center'>
              <AlertTriangle size={20} className='text-yellow-500' />
            </div>
            <h2 className='text-lg font-bold text-gray-900'>
              Produto em Desacordo com o Pedido
            </h2>
          </div>

          <div className='space-y-3 text-gray-700 leading-relaxed text-sm'>
            <p>
              Caso o produto recebido não corresponda ao que foi comprado, você
              terá até <strong>7 dias</strong> para comunicar nossa central de
              atendimento e solicitar troca ou devolução.
            </p>
            <p>
              Faremos tudo ao nosso alcance para reenviar o produto correto
              imediatamente, da forma mais rápida possível.
            </p>
          </div>
        </div>

        {/* Defeito antes do uso */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center'>
              <Wrench size={20} className='text-purple-500' />
            </div>
            <h2 className='text-lg font-bold text-gray-900'>
              Defeito de Fabricação — Antes do Uso
            </h2>
          </div>

          <div className='space-y-3 text-gray-700 leading-relaxed text-sm'>
            <p>
              Se o produto apresentar defeito ou anomalia, você terá até{' '}
              <strong>7 dias</strong> para solicitar troca ou devolução. O
              produto deve estar em sua embalagem original, sem indícios de uso
              e com todos os itens recebidos.
            </p>
            <p>
              O produto será substituído por um novo idêntico,{' '}
              <strong>sem qualquer custo adicional</strong>. Caso não haja
              disponibilidade em estoque, será feita uma tentativa de troca por
              produto semelhante. Não havendo interesse do consumidor, o valor
              pago será devolvido integralmente.
            </p>
          </div>
        </div>

        {/* Defeito após o uso */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
              <WrenchIcon size={20} className='text-gray-600' />
            </div>
            <h2 className='text-lg font-bold text-gray-900'>
              Defeito de Fabricação — Após o Uso
            </h2>
          </div>

          <div className='space-y-3 text-gray-700 leading-relaxed text-sm'>
            <p>
              Se o defeito se manifestou após o uso, todos os produtos possuem,
              por lei, no mínimo <strong>3 meses de garantia</strong> a partir
              da data da compra. Algumas marcas oferecem garantia estendida —
              cada caso será analisado conforme o prazo de garantia específico.
            </p>
            <p>
              Faremos uma avaliação detalhada do produto. Confirmado o defeito
              de fabricação, a troca será realizada{' '}
              <strong>sem custo adicional</strong>. Caso seja identificado mau
              uso, o cliente será avisado e o produto devolvido (custos de frete
              por conta do cliente).
            </p>
          </div>
        </div>

        {/* Política de Reembolso */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center'>
              <Banknote size={20} className='text-green-600' />
            </div>
            <h2 className='text-lg font-bold text-gray-900'>
              Política de Reembolso
            </h2>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed text-sm'>
            <div className='flex gap-3'>
              <span className='text-[#FF6600] font-bold mt-0.5'>I.</span>
              <p>
                <strong>Estorno em cartão de crédito:</strong> O prazo do
                estorno seguirá as regras da administradora do cartão e
                dependerá da data de vencimento da sua fatura.
              </p>
            </div>

            <div className='flex gap-3'>
              <span className='text-[#FF6600] font-bold mt-0.5'>II.</span>
              <p>
                <strong>Reembolso via PIX ou conta corrente:</strong> Para
                pedidos pagos via boleto ou PIX, o valor da compra será
                reembolsado na conta informada pelo cliente.
              </p>
            </div>

            <div className='bg-gray-50 rounded-lg p-4 mt-2'>
              <p className='text-sm text-gray-600'>
                Todos os ressarcimentos serão liberados em até{' '}
                <strong>3 dias úteis</strong> após o recebimento e análise
                técnica do produto em nosso centro de distribuição.
              </p>
            </div>

            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <p className='text-sm text-red-700'>
                <strong>Importante:</strong> Caso seja detectado mau uso ou má
                fé por parte do cliente, a liberação do ressarcimento poderá ser
                negada.
              </p>
            </div>
          </div>
        </div>

        {/* Dúvidas */}
        <div className='bg-gray-50 rounded-lg p-6 text-center'>
          <p className='text-gray-700 mb-2'>
            Precisa solicitar uma troca ou devolução?
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
