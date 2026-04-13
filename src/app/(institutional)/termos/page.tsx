import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description:
    'Termos de Uso da loja virtual Surfers Paradise. Conheça as regras e condições para compras em nosso e-commerce.',
};

export default function TermosPage() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <nav className='text-sm text-gray-500 mb-8'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Termos de Uso</span>
      </nav>

      <h1 className='text-3xl font-black text-gray-900 mb-8'>Termos de Uso</h1>

      <div className='prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed'>
        <p className='text-lg font-medium text-gray-900'>
          Ao navegar e utilizar o site surfersparadise.com.br, você concorda com
          os Termos de Uso descritos abaixo. Leia atentamente antes de realizar
          qualquer compra.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          1. Aceitação dos Termos
        </h2>

        <p>
          Ao acessar e utilizar este site, você declara que leu, compreendeu e
          aceita integralmente os presentes Termos de Uso. Caso não concorde com
          algum dos termos aqui descritos, recomendamos que não utilize o site.
          A Surfers Paradise reserva-se o direito de alterar estes Termos a
          qualquer momento, sendo que a versão atualizada será sempre publicada
          nesta página.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          2. Cadastro e Conta do Usuário
        </h2>

        <p>
          Para realizar compras em nosso site, pode ser necessário criar uma
          conta fornecendo informações pessoais verdadeiras, completas e
          atualizadas. O usuário é responsável por manter a confidencialidade da
          sua senha e por todas as atividades realizadas em sua conta. A Surfers
          Paradise não se responsabiliza por acessos não autorizados decorrentes
          do compartilhamento de credenciais por parte do usuário.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          3. Produtos e Preços
        </h2>

        <p>
          Todos os produtos comercializados na Surfers Paradise são originais,
          de procedência legal, adquiridos e revendidos com nota fiscal e
          garantia do fabricante. Os preços dos produtos podem ser alterados a
          qualquer momento sem aviso prévio, sendo válido o preço vigente no
          momento da finalização da compra.
        </p>

        <p>
          As imagens dos produtos são meramente ilustrativas. Embora nos
          esforcemos para que as fotos representem fielmente os produtos, podem
          ocorrer pequenas variações de cor ou aparência devido à configuração
          do monitor do usuário.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          4. Formas de Pagamento
        </h2>

        <p>
          A Surfers Paradise oferece as seguintes formas de pagamento: cartão de
          crédito (parcelamento em até 10x sem juros), boleto bancário e PIX.
          Pagamentos via PIX e boleto bancário contam com desconto de 10% sobre
          o valor total do pedido. A confirmação do pedido está condicionada à
          aprovação do pagamento pela operadora financeira.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          5. Prazo de Entrega
        </h2>

        <p>
          Os prazos de entrega variam de acordo com a localidade do destinatário
          e a modalidade de frete escolhida. O prazo começa a contar a partir da
          confirmação do pagamento. Para pedidos via boleto bancário, o prazo
          inicia após a compensação do boleto, que pode levar até 3 dias úteis.
          A Surfers Paradise não se responsabiliza por atrasos causados pelas
          transportadoras ou pelos Correios.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          6. Trocas e Devoluções
        </h2>

        <p>
          A política de trocas e devoluções da Surfers Paradise segue as
          disposições do Código de Defesa do Consumidor (Lei nº 8.078/90). O
          cliente tem o direito de solicitar a troca ou devolução do produto em
          até 7 (sete) dias corridos após o recebimento, desde que o produto
          esteja em sua embalagem original, sem sinais de uso e acompanhado da
          nota fiscal. Para mais detalhes, consulte nossa página de{' '}
          <Link
            href='/trocas-devolucoes'
            className='text-[#FF6600] hover:underline'
          >
            Garantia, Trocas e Devoluções
          </Link>
          .
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          7. Propriedade Intelectual
        </h2>

        <p>
          Todo o conteúdo do site surfersparadise.com.br, incluindo textos,
          imagens, logotipos, ícones, fotografias, vídeos, layout e design, é de
          propriedade da Surfers Paradise ou de seus fornecedores e está
          protegido pelas leis brasileiras de direitos autorais (Lei nº
          9.610/98) e de propriedade industrial. É proibida a reprodução,
          distribuição ou modificação do conteúdo sem autorização prévia por
          escrito.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          8. Responsabilidades do Usuário
        </h2>

        <p>O usuário compromete-se a:</p>

        <ul className='list-disc list-inside space-y-2 text-gray-700'>
          <li>Fornecer informações verdadeiras e completas no cadastro</li>
          <li>
            Utilizar o site de forma ética e em conformidade com a legislação
            brasileira
          </li>
          <li>
            Não utilizar o site para fins ilícitos ou que possam causar danos a
            terceiros
          </li>
          <li>
            Não tentar acessar áreas restritas do sistema ou de outros usuários
          </li>
          <li>Manter suas credenciais de acesso em sigilo</li>
        </ul>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          9. Limitação de Responsabilidade
        </h2>

        <p>
          A Surfers Paradise não se responsabiliza por eventuais
          indisponibilidades temporárias do site, causadas por manutenção,
          falhas técnicas ou eventos de força maior. Também não nos
          responsabilizamos por danos decorrentes do uso inadequado do site pelo
          usuário ou por informações incorretas fornecidas durante o cadastro ou
          processo de compra.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          10. Proteção de Dados
        </h2>

        <p>
          A Surfers Paradise compromete-se com a proteção dos dados pessoais dos
          seus usuários, em conformidade com a Lei Geral de Proteção de Dados
          (LGPD — Lei nº 13.709/2018). Para informações detalhadas sobre como
          coletamos, utilizamos e protegemos seus dados, consulte nossa{' '}
          <Link
            href='/politica-privacidade'
            className='text-[#FF6600] hover:underline'
          >
            Política de Privacidade
          </Link>
          .
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          11. Legislação Aplicável e Foro
        </h2>

        <p>
          Os presentes Termos de Uso são regidos pela legislação da República
          Federativa do Brasil, incluindo o Marco Civil da Internet (Lei nº
          12.965/2014), o Código de Defesa do Consumidor (Lei nº 8.078/90) e a
          Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Para dirimir
          quaisquer controvérsias decorrentes destes Termos, fica eleito o Foro
          da Comarca de São Paulo - SP.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          12. Disposições Gerais
        </h2>

        <p>
          A tolerância ao eventual descumprimento de quaisquer cláusulas deste
          instrumento não constituirá renúncia ao direito de exigir o
          cumprimento da obrigação. Se qualquer disposição destes Termos for
          considerada inválida, as demais disposições permanecerão em pleno
          vigor.
        </p>

        <p>
          O usuário autoriza expressamente a Surfers Paradise a comunicar-se
          através de todos os canais de contato disponibilizados no cadastro,
          incluindo e-mail, SMS e WhatsApp, para fins relacionados a pedidos,
          suporte e informações sobre a loja.
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
