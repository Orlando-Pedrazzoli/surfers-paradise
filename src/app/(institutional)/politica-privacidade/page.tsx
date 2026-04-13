import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Política de Privacidade da Surfers Paradise. Saiba como protegemos seus dados pessoais e garantimos a segurança das suas informações.',
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <nav className='text-sm text-gray-500 mb-8'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Política de Privacidade</span>
      </nav>

      <h1 className='text-3xl font-black text-gray-900 mb-8'>
        Política de Privacidade
      </h1>

      <div className='prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed'>
        <p className='text-lg font-medium text-gray-900'>
          A Surfers Paradise respeita o sigilo das suas informações e está
          comprometida com a proteção dos seus dados pessoais.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          Coleta e Uso de Dados
        </h2>

        <p>
          Todas as informações fornecidas em nosso site são de uso exclusivo
          para o procedimento de compra e personalização da sua experiência.
          Seus dados{' '}
          <strong>
            não serão disponibilizados, cedidos ou comercializados para
            terceiros
          </strong>{' '}
          em nenhuma circunstância.
        </p>

        <p>
          Os dados fornecidos são registrados em nosso banco de dados de forma
          automatizada e armazenados com total segurança, utilizando tecnologia
          de criptografia e sem intervenção humana no acesso a informações
          sensíveis.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>Comunicação</h2>

        <p>
          Os e-mails e telefones disponibilizados são utilizados apenas para
          contatos referentes às compras realizadas em nosso site, como
          confirmação de pedido, atualização de status e suporte ao cliente.
        </p>

        <p>
          Com prévia autorização, podemos enviar e-mails informando sobre
          promoções e novidades da nossa loja. Nossos clientes podem solicitar o
          cancelamento do recebimento dessas comunicações a qualquer momento,
          através do link de descadastramento presente em cada e-mail ou
          entrando em contato pelo nosso atendimento.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          Armazenamento de Dados
        </h2>

        <p>
          Não armazenamos informações que não sejam estritamente necessárias
          para a efetivação da compra e prestação do serviço. Coletamos apenas
          os dados indispensáveis para processar o seu pedido, calcular o frete
          e garantir a entrega.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          Segurança nos Pagamentos
        </h2>

        <p>
          Os números de cartões de crédito fornecidos durante o processo de
          compra são registrados diretamente no banco de dados das
          administradoras de cartão (Pagar.me),{' '}
          <strong>
            não permitindo o acesso a essas informações por parte da Surfers
            Paradise
          </strong>
          .
        </p>

        <p>
          Ao informar os dados para a administradora, esta realiza a verificação
          da transação online e nos retorna apenas a informação de aprovação ou
          recusa da venda, sem compartilhar dados sensíveis do cartão.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>Cookies</h2>

        <p>
          Nosso site utiliza cookies para melhorar a sua experiência de
          navegação, lembrar suas preferências e analisar o tráfego do site. Os
          cookies não coletam informações pessoais identificáveis. Você pode
          desativar os cookies nas configurações do seu navegador, porém algumas
          funcionalidades do site podem ser afetadas.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>Seus Direitos</h2>

        <p>
          Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
          13.709/2018), você tem o direito de:
        </p>

        <ul className='list-disc list-inside space-y-2 text-gray-700'>
          <li>Solicitar acesso aos seus dados pessoais armazenados</li>
          <li>Solicitar a correção de dados incompletos ou desatualizados</li>
          <li>Solicitar a exclusão dos seus dados pessoais</li>
          <li>Revogar o consentimento para o uso dos seus dados</li>
          <li>Solicitar a portabilidade dos seus dados</li>
        </ul>

        <p>
          Para exercer qualquer um desses direitos, entre em contato conosco
          pelo e-mail{' '}
          <a
            href='mailto:contato@surfersparadise.com.br'
            className='text-[#FF6600] hover:underline'
          >
            contato@surfersparadise.com.br
          </a>{' '}
          ou pelo WhatsApp{' '}
          <a
            href='https://wa.me/5511947169003'
            target='_blank'
            rel='noopener noreferrer'
            className='text-[#FF6600] hover:underline'
          >
            (11) 94716-9003
          </a>
          .
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          Alterações nesta Política
        </h2>

        <p>
          A Surfers Paradise reserva-se o direito de alterar esta Política de
          Privacidade a qualquer momento. Quaisquer alterações serão publicadas
          nesta página. Recomendamos que você revise esta política
          periodicamente.
        </p>

        <div className='bg-gray-50 rounded-lg p-6 mt-8'>
          <p className='text-sm text-gray-600'>
            <strong>Surfers Paradise</strong>
            <br />
            Alameda dos Maracatins, 1317 — Indianópolis, São Paulo - SP
            <br />
            contato@surfersparadise.com.br | (11) 94716-9003
            <br />
            Última atualização: Abril de 2026
          </p>
        </div>
      </div>
    </div>
  );
}
