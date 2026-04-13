import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'A Empresa',
  description:
    'Conheça a Surfers Paradise — conceituada Board Shop há mais de 28 anos em Moema, São Paulo. Pranchas de surf, quilhas, acessórios e muito mais.',
};

export default function AEmpresaPage() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      {/* Breadcrumb */}
      <nav className='text-sm text-gray-500 mb-8'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>A Empresa</span>
      </nav>

      {/* Title */}
      <h1 className='text-3xl font-black text-gray-900 mb-8'>A Empresa</h1>

      {/* Content */}
      <div className='prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed'>
        <p className='text-lg font-medium text-gray-900'>
          A Surfers Paradise é uma conceituada Board Shop, referência no mercado
          de surf há mais de 28 anos, localizada no coração de Moema, em São
          Paulo.
        </p>

        <p>
          Nascida da paixão pelo surf e pelo estilo de vida que ele representa,
          a Surfers Paradise se consolidou como uma das lojas mais tradicionais
          e respeitadas do cenário do surf brasileiro. Mantemos em nosso estoque
          centenas de pranchas de surf das melhores marcas do Brasil e do mundo,
          além de uma grande variedade de acessórios, quilhas, leashes, decks,
          wetsuits, capas e tudo o que o surfista precisa para suas sessões.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>Nossa Missão</h2>

        <p>
          Oferecer aos surfistas de todo o Brasil os melhores equipamentos do
          mundo do surf, com transparência, credibilidade e total apoio aos
          nossos clientes. Queremos que cada compra seja uma experiência
          agradável, segura e que você se sinta confortável e confiante em
          encontrar exactamente o que procura.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>
          Nosso Compromisso
        </h2>

        <p>
          Trabalhamos sempre respeitando o Código de Defesa do Consumidor,
          cumprindo todos os nossos deveres — e muitas vezes indo além. O nosso
          objectivo maior é a satisfação de cada cliente que confia em nós.
        </p>

        <p>
          Todos os nossos produtos são de procedência legal, 100% originais, e
          estão no nosso estoque físico para pronta entrega. Compramos e
          revendemos com nota fiscal e garantia. Prezamos para que os seus
          produtos cheguem o mais rápido possível, com máxima agilidade e
          transparência.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>Entrega Segura</h2>

        <p>
          Nossos fretes são segurados pelas transportadoras, oferecendo garantia
          em todo o processo de entrega. Enviamos para todo o Brasil através das
          melhores e mais seguras transportadoras do mercado. Todos os produtos
          disponíveis no site encontram-se no nosso estoque físico e podem ser
          despachados imediatamente após a confirmação de pagamento.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>Atendimento</h2>

        <p>
          Zelamos pelo melhor atendimento aos nossos clientes. Nossa equipe é
          treinada e apaixonada por surf, pronta para oferecer o maior conforto
          e as melhores orientações possíveis. Desejamos que todo o processo de
          compra seja fácil, rápido e seguro.
        </p>

        <h2 className='text-xl font-bold text-gray-900 mt-8'>Onde Estamos</h2>

        <p>
          Estamos localizados na{' '}
          <strong>
            Alameda dos Maracatins, 1317 — Indianópolis, São Paulo - SP, CEP
            04089-014
          </strong>
          . Venha nos visitar e conhecer de perto o nosso estoque completo!
        </p>

        <div className='bg-gray-50 rounded-lg p-6 mt-6'>
          <p className='text-sm text-gray-600 mb-2'>
            <strong>Horário de Funcionamento:</strong>
          </p>
          <p className='text-sm text-gray-600'>Segunda a Sexta: 10h às 20h</p>
          <p className='text-sm text-gray-600'>Sábado: 10h às 19h</p>
          <p className='text-sm text-gray-600'>Domingo: Fechado</p>
        </div>

        <p>
          Caso tenha alguma dúvida em relação à confiabilidade da nossa empresa,
          fique à vontade para conferir o que nossos clientes contam sobre nós
          através dos depoimentos nas nossas redes sociais:{' '}
          <a
            href='https://www.instagram.com/lojasurfersparadiseoficial/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-[#FF6600] hover:underline'
          >
            Instagram @lojasurfersparadiseoficial
          </a>{' '}
          e{' '}
          <a
            href='https://web.facebook.com/lojasurfersparadise/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-[#FF6600] hover:underline'
          >
            Facebook /lojasurfersparadise
          </a>
          .
        </p>

        <p className='text-xl font-bold text-[#FF6600] mt-8'>
          Bem-vindo ao mundo Surfers Paradise! 🏄
        </p>
      </div>
    </div>
  );
}
