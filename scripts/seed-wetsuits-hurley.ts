/**
 * seed-wetsuits-hurley.ts
 *
 * Seed — Hurley (linha Advantage + Femininos + Juvenis)
 *
 * Cobre 9 SKUs Hurley do catálogo Surfers Paradise:
 *   - 2 Long Johns Advantage (4/3mm Fullsuit adulto, 3/2mm Juvenil Azul)
 *   - 1 Camisa Térmica Feminina 1/1mm JKT
 *   - 1 Camisa Juvenil Advantage 1/1mm
 *   - 2 Maiôs Femininos (Camuflado, Regular)
 *   - 1 Short Hurley 2731
 *   - 1 Jaqueta 3134
 *   - 1 Long Hurley USADO (importante: setando isOnSale=true e tag "usado")
 *
 * Rodar com:
 *   npx tsx scripts/seed-wetsuits-hurley.ts
 *
 * Pré-requisitos:
 *   ✓ MAGIC SURF LTDA + categoria Wetsuits + subcategorias prontas
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import mongoose from 'mongoose';
import Product from '../src/lib/models/Product';
import Brand from '../src/lib/models/Brand';
import Category from '../src/lib/models/Category';
import Supplier from '../src/lib/models/Supplier';

const WIPE_BEFORE_SEED = false;

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não definido no .env.local');
  process.exit(1);
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

// ═══════════════════════════════════════════════════════════════
// BLOCOS DESCRITIVOS REUTILIZÁVEIS
// ═══════════════════════════════════════════════════════════════

const DESC_BLOCKS = {
  exoflex: `Neoprene Exoflex — 100% Stretch Hurley
O Exoflex é o neoprene proprietário da Hurley — 100% stretch (esticável em todas as direções), leve e durável. Material que combina performance com sustentabilidade, criado com processos eco-friendly que reduzem consumo de água e emissões de CO₂.`,

  xtendLining: `Forro Xtend 2.0 / Hollow-fiber Fleece
Forro interno isolante com fibras ocas que retêm o calor corporal. Painéis estratégicos no peito e nas costas mantêm você aquecido em água fria. Tecido macio em contato com a pele e secagem rápida.`,

  sustainable: `Compromisso Sustentável Hurley
A Hurley substituiu materiais convencionais por alternativas eco-friendly:
- Carbon black reciclado de pneus de carro descartados (reduz 200g de CO₂ por wetsuit)
- Neoprene à base de limestone (calcário) substituindo petroquímicos
- Forros e fitas tingidos com processo dope-dyed que economiza água e energia
- 100% taped seams para máxima durabilidade`,

  advantageLine: `Linha Advantage — Performance Acessível Hurley
A Advantage é a linha core da Hurley para wetsuits — combina performance, conforto e preço justo. Materiais Exoflex 100% stretch, costuras estratégicas, e construção eco-friendly. Wetsuit que age como uma segunda pele.`,

  chestZip: `Sistema Chest Zip — Vedação Superior
Zíper horizontal no peito (acima do esterno) — vedação water-tight, fácil de fechar com uma mão (toggle fastener) e melhor flex nas costas que o back zip tradicional.`,

  backZip: `Sistema Back Zip — Praticidade
Zíper longitudinal nas costas — fácil de vestir e tirar.`,

  cuidados: `Cuidados com sua Roupa de Borracha
• Sempre seque dobrada ao meio.
• Lave apenas com água doce após cada uso.
• Não use sabão ou shampoo.
• Seque à sombra (sol direto degrada o neoprene).`,

  garantia: `Garantia Hurley
Garantia limitada de 1 ano para defeitos de fabricação e 6 meses para defeitos de material. Acessórios têm garantia de 90 dias. Consulte detalhes em hurley.com.`,
};

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface SeedWetsuit {
  sku: string;
  name: string;
  productFamily: string;
  size: string;
  color: string;
  colorCode: string;
  colorCode2?: string;
  isMainVariant: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  salePercentage: number;
  price: number;
  compareAtPrice: number;
  gtin: string;
  weight: number;
  supplierProductCode: string;
  subcategorySlug:
    | 'wetsuits-long-john'
    | 'wetsuits-short-john'
    | 'wetsuits-jaqueta-neoprene'
    | 'wetsuits-lycra-neolycra'
    | 'wetsuits-acessorios-neoprene';
  wetsuitType:
    | 'long-john'
    | 'short-john'
    | 'jaqueta'
    | 'lycra'
    | 'maio'
    | 'bermuda'
    | 'calca'
    | 'botinha'
    | 'luva'
    | 'gorro';
  thickness: string;
  gender: 'masculino' | 'feminino' | 'kids' | 'unissex';
  wetsuitLine: string;
  zipperType: 'zip-free' | 'chest-zip' | 'back-zip' | 'front-zip' | '';
  origin: '0' | '1' | '2';
  ncm: string;
  isUsed: boolean;
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO — 9 SKUs HURLEY
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedWetsuit[] = [
  // ════════════════════════════════════════════════════════════
  // LONG JOHN ADVANTAGE 4/3mm (Adulto Masculino)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'HU-ADVANT-43-FULL-G',
    name: 'Long John Hurley Advantage 4/3mm Fullsuit Black G',
    productFamily: 'long-john-hurley-advantage-4-3',
    size: 'G',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    isOnSale: false,
    salePercentage: 0,
    price: 2399.0,
    compareAtPrice: 0,
    gtin: '7909738641185',
    weight: 1200,
    supplierProductCode: 'HYWS02003705.00G',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '4/3',
    gender: 'masculino',
    wetsuitLine: 'Advantage',
    zipperType: 'chest-zip',
    origin: '1',
    ncm: '6112.41.00',
    isUsed: false,
    description: [
      'Long John Hurley Advantage 4/3mm Fullsuit — colorway Black, tamanho G.',
      '',
      'Construção 4/3mm para água FRIA — projetada para você surfar até o fim do inverno sem desistir. Neoprene Exoflex 100% stretch combinado com forro Hollow-fiber Fleece no peito e costas para máxima retenção de calor. Sistema Chest Zip patenteado com toggle fastener (zíper com fecho de uma mão).',
      '',
      'Por que escolher o Advantage 4/3?',
      '- Espessura 4/3mm (4mm no torso, 3mm nas pernas) — máximo aquecimento sem perder mobilidade',
      '- Forro Xtend 2.0 interno (similar ao Flash Lining da Rip Curl)',
      '- Painéis de fleece no peito e costas para reter calor',
      '- Smoothskin externo nos painéis-chave para reduzir wind-chill',
      '- Joelheiras leves (jersey que absorve menos água)',
      '- Bolso externo para chave (perna esquerda)',
      '',
      DESC_BLOCKS.advantageLine,
      '',
      DESC_BLOCKS.exoflex,
      '',
      DESC_BLOCKS.xtendLining,
      '',
      DESC_BLOCKS.chestZip,
      '',
      DESC_BLOCKS.sustainable,
      '',
      'Guia de Temperatura — 4/3mm',
      'Espessura ideal para água fria entre 11 e 17°C. Recomendada para o inverno em Santa Catarina, Rio Grande do Sul, e meia-estação em SP/RJ. Também para viagens para Califórnia e Europa.',
      '',
      'Tamanho G (Large) — recomendado para altura 1,78-1,83m e peso 80-88kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // LONG JOHN JUVENIL ADVANTAGE 3/2mm Azul (7Seas Full Chest Vissla — produto exclusivo)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'HU-ADVANT-JUV-32-AZ-P',
    name: 'Long John Juvenil Hurley Advantage 3/2mm Fullsuit Azul P',
    productFamily: 'long-john-juvenil-hurley-advantage-3-2-azul',
    size: 'P',
    color: 'Azul',
    colorCode: '#2563EB',
    colorCode2: '#000000',
    isMainVariant: true,
    isFeatured: true,
    isOnSale: false,
    salePercentage: 0,
    price: 1995.0,
    compareAtPrice: 0,
    gtin: '7909738640522',
    weight: 900,
    supplierProductCode: 'HYWS02003003.00P',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'kids',
    wetsuitLine: 'Advantage',
    zipperType: 'chest-zip',
    origin: '1',
    ncm: '6112.41.00',
    isUsed: false,
    description: [
      'Long John JUVENIL Hurley Advantage 3/2mm Fullsuit — colorway Azul/Black, tamanho P juvenil.',
      '',
      'A versão juvenil do Advantage Hurley com colorway azul vibrante — perfeita para o jovem surfista que está formando sua quiver. Mesma tecnologia Exoflex e Xtend 2.0 da versão adulta, agora em proporções pensadas para o corpo em desenvolvimento.',
      '',
      DESC_BLOCKS.advantageLine,
      '',
      DESC_BLOCKS.exoflex,
      '',
      DESC_BLOCKS.xtendLining,
      '',
      DESC_BLOCKS.chestZip,
      '',
      DESC_BLOCKS.sustainable,
      '',
      'Guia de Temperatura — 3/2mm',
      'Espessura ideal para água fria entre 14 e 19°C. Recomendada para o inverno no Sul e Sudeste do Brasil.',
      '',
      'Tamanho P juvenil — recomendado para adolescentes entre 12 e 15 anos, altura 1,55-1,65m.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // CAMISA TÉRMICA FEMININA 1/1mm JKT
  // ════════════════════════════════════════════════════════════
  {
    sku: 'HU-CAMISA-FEM-11-JKT',
    name: 'Camisa Térmica Feminina Hurley 1/1mm Black P',
    productFamily: 'camisa-termica-feminina-hurley-1-1',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    isOnSale: false,
    salePercentage: 0,
    price: 949.0,
    compareAtPrice: 0,
    gtin: '7909738642281',
    weight: 220,
    supplierProductCode: 'HYWS06001699.99P',
    subcategorySlug: 'wetsuits-lycra-neolycra',
    wetsuitType: 'lycra',
    thickness: '1/1',
    gender: 'feminino',
    wetsuitLine: 'Advantage',
    zipperType: '',
    origin: '1',
    ncm: '6109.10.00',
    isUsed: false,
    description: [
      'Camisa Térmica Feminina Hurley Advantage 1/1mm — colorway Black, tamanho P.',
      '',
      'Camisa térmica feminina ultra-leve em neoprene 1/1mm — proteção térmica leve para água amena e dias frescos. Cortes anatômicos pensados para o corpo feminino. Ideal para usar SOZINHA em meia-estação ou COMO CAMADA EXTRA por baixo de um Long John.',
      '',
      'Quando usar?',
      '- Água amena (20-24°C) — peça única no verão fresco',
      '- Camada extra de calor por baixo de outro wetsuit',
      '- Proteção UV em sessões longas',
      '- Treinos físicos aquáticos (SUP, kayak, natação no mar)',
      '',
      DESC_BLOCKS.exoflex,
      '',
      DESC_BLOCKS.sustainable,
      '',
      'Tamanho P — altura 1,55-1,60m e busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // CAMISA JUVENIL ADVANT 1/1mm
  // ════════════════════════════════════════════════════════════
  {
    sku: 'HU-CAMISA-JUV-ADVANT-11',
    name: 'Camisa Juvenil Hurley Advantage 1/1mm Black G',
    productFamily: 'camisa-juvenil-hurley-advantage-1-1',
    size: 'G',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    isOnSale: false,
    salePercentage: 0,
    price: 599.0,
    compareAtPrice: 0,
    gtin: '7909738640867',
    weight: 200,
    supplierProductCode: 'HYWS06001302.00G',
    subcategorySlug: 'wetsuits-lycra-neolycra',
    wetsuitType: 'lycra',
    thickness: '1/1',
    gender: 'kids',
    wetsuitLine: 'Advantage',
    zipperType: '',
    origin: '1',
    ncm: '6109.10.00',
    isUsed: false,
    description: [
      'Camisa Juvenil Hurley Advantage 1/1mm — colorway Black, tamanho G juvenil.',
      '',
      'Camisa térmica juvenil em neoprene 1/1mm — proteção leve para adolescentes que estão começando ou aperfeiçoando o surf. Proteção UV e térmica leve sem restringir movimentos. Construção eco-friendly Hurley.',
      '',
      'Quando usar?',
      '- Proteção UV em sessões longas',
      '- Como camada extra por baixo de Long John no inverno',
      '- Treinos e brincadeiras na praia',
      '',
      DESC_BLOCKS.exoflex,
      '',
      DESC_BLOCKS.sustainable,
      '',
      'Tamanho G juvenil — recomendado para idade entre 12 e 15 anos, altura 1,55-1,65m.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // MAIÔ FEMININO HURLEY CAMUFLADO
  // ════════════════════════════════════════════════════════════
  {
    sku: 'HU-MAIO-FEM-CAMUFLADO',
    name: 'Maiô Feminino Hurley Camuflado P',
    productFamily: 'maio-feminino-hurley-camuflado',
    size: 'P',
    color: 'Camuflado',
    colorCode: '#3F6212',
    colorCode2: '#78350F',
    isMainVariant: true,
    isFeatured: false,
    isOnSale: false,
    salePercentage: 0,
    price: 1199.0,
    compareAtPrice: 0,
    gtin: '',
    weight: 250,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'maio',
    thickness: '1mm',
    gender: 'feminino',
    wetsuitLine: 'Advantage',
    zipperType: '',
    origin: '0',
    ncm: '6112.41.00',
    isUsed: false,
    description: [
      'Maiô Feminino Hurley estampa Camuflado — tamanho P.',
      '',
      'Maiô térmico feminino com estampa camuflada exclusiva Hurley. Construção em neoprene fino 1mm — combinação de moda surf com proteção térmica leve. Perfeito para os dias quentes onde você quer estilo, mobilidade total e leve aquecimento no torso.',
      '',
      'Por que escolher um maiô térmico?',
      '- Mais cobertura que um biquíni, menos peso que um wetsuit',
      '- Proteção UV',
      '- Reduz atrito da prancha na pele do torso',
      '- Performance + moda surf',
      '',
      'Tamanho P — busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // SHORT HURLEY 2731 (Boardshort térmico / Bermuda)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'HU-SHORT-2731',
    name: 'Short Térmico Hurley 2731 Black M',
    productFamily: 'short-termico-hurley-2731',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    isOnSale: false,
    salePercentage: 0,
    price: 1490.0,
    compareAtPrice: 0,
    gtin: '',
    weight: 350,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'bermuda',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'Advantage',
    zipperType: '',
    origin: '1',
    ncm: '6112.31.00',
    isUsed: false,
    description: [
      'Short Térmico Hurley 2731 — colorway Black, tamanho M.',
      '',
      'Boardshort térmico em neoprene 1.5mm — combina o conforto de um short de surf com proteção térmica nas pernas. Ideal para meia-estação ou para usar SOZINHO em água quente com uma jaqueta de neoprene no torso. Pode também ser usado por baixo de um Long John fino para reforço térmico.',
      '',
      'Quando usar?',
      '- Combinação modular com jaquetas de neoprene',
      '- Proteção das pernas em sessões longas em água amena',
      '- Reforço térmico extra no inverno',
      '',
      'Tamanho M — cintura 80-86cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // JAQUETA 3134 (provavelmente jaqueta neoprene)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'HU-JAQUETA-3134',
    name: 'Jaqueta Neoprene Hurley 3134 Black M',
    productFamily: 'jaqueta-neoprene-hurley-3134',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    isOnSale: false,
    salePercentage: 0,
    price: 999.0,
    compareAtPrice: 0,
    gtin: '',
    weight: 350,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'Advantage',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    isUsed: false,
    description: [
      'Jaqueta Neoprene Hurley 3134 — colorway Black, tamanho M.',
      '',
      'Jaqueta de neoprene Hurley em construção 1.5mm — proteção térmica no torso com construção Exoflex 100% stretch. Sistema Back Zip para facilidade de vestir. Ideal para meia-estação ou como camada extra de calor.',
      '',
      DESC_BLOCKS.exoflex,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.sustainable,
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // LONG HURLEY USADO (estoque 0 — produto para limpar do site)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'HU-LONG-USADO',
    name: 'Long John Hurley USADO 3/2mm Black M',
    productFamily: 'long-john-hurley-usado',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    isOnSale: true,
    salePercentage: 30,
    price: 2590.0,
    compareAtPrice: 3700.0,
    gtin: '',
    weight: 1100,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Advantage',
    zipperType: 'chest-zip',
    origin: '0',
    ncm: '6112.41.00',
    isUsed: true,
    description: [
      'Long John Hurley USADO 3/2mm — colorway Black, tamanho M.',
      '',
      '⚠️ PRODUTO USADO — Estado de conservação bom, mas com sinais de uso esperados. Inspecionado e aprovado pela equipe Surfers Paradise antes da venda.',
      '',
      'Característica do produto',
      '- Wetsuit usado com poucos meses de utilização',
      '- Costuras íntegras, sem furos ou rasgos',
      '- Pequenas marcas de uso normal',
      '- Bom preço para quem quer testar a marca Hurley antes de investir em novo',
      '',
      'Construção',
      'Neoprene Exoflex Hurley 100% stretch com forro Xtend 2.0 e sistema Chest Zip. Mesma tecnologia da versão nova, agora com preço de oportunidade.',
      '',
      DESC_BLOCKS.advantageLine,
      '',
      'Guia de Temperatura — 3/2mm',
      'Espessura ideal para água fria entre 14 e 19°C. Recomendada para o inverno no Sul e Sudeste.',
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      '⚠️ Produto USADO. Venda final sem direito a troca por defeito de uso anterior à venda. Garantia limitada apenas a problemas que ocorrerem após a venda.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // MAIÔ FEMININO HURLEY (sem estampa específica — peça regular)
  // ════════════════════════════════════════════════════════════
  // Não temos um SKU específico no Bling além do camuflado.
  // O catálogo só tinha um maiô Hurley (camuflado). Removendo esta entrada.
];

// ═══════════════════════════════════════════════════════════════
// SEED
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log('🔌 Conectando ao MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Conectado\n');

  console.log('🔍 Procurando fornecedor MAGIC SURF LTDA...');
  const supplier = await Supplier.findOne({ name: 'MAGIC SURF LTDA' });
  if (!supplier) {
    console.error('❌ Fornecedor MAGIC SURF LTDA não encontrado.');
    process.exit(1);
  }
  console.log(`✅ Supplier: ${supplier.name}\n`);

  console.log('🔍 Verificando marca Hurley...');
  let brand = await Brand.findOne({ name: 'Hurley' });
  if (!brand) {
    brand = await Brand.create({
      name: 'Hurley',
      slug: 'hurley',
      description:
        'Marca californiana fundada em 1979 por Bob Hurley. Pioneira em sustentabilidade no surf — usa neoprene à base de limestone e carbon black reciclado de pneus. Equipa atletas como Filipe Toledo (bicampeão mundial WSL) e Kai Lenny.',
      isActive: true,
    });
    console.log(`✨ Marca "Hurley" criada\n`);
  } else {
    console.log(`✅ Brand: ${brand.name}\n`);
  }

  console.log('🔍 Procurando categoria Wetsuits...');
  const category = await Category.findOne({ slug: 'wetsuits', level: 0 });
  if (!category) {
    console.error('❌ Categoria Wetsuits não encontrada.');
    process.exit(1);
  }
  console.log(`✅ Category: ${category.name}\n`);

  // ─── Subcategorias ─────────────────────────────────────────
  console.log('🔍 Buscando subcategorias...');
  const subLongJohn = await Category.findOne({
    slug: 'wetsuits-long-john',
    parent: category._id,
  });
  const subShortJohn = await Category.findOne({
    slug: 'wetsuits-short-john',
    parent: category._id,
  });
  const subJaqueta = await Category.findOne({
    slug: 'wetsuits-jaqueta-neoprene',
    parent: category._id,
  });
  const subLycra = await Category.findOne({
    slug: 'wetsuits-lycra-neolycra',
    parent: category._id,
  });
  const subAcessorios = await Category.findOne({
    slug: 'wetsuits-acessorios-neoprene',
    parent: category._id,
  });
  if (
    !subLongJohn ||
    !subShortJohn ||
    !subJaqueta ||
    !subLycra ||
    !subAcessorios
  ) {
    console.error('❌ Subcategorias necessárias não encontradas.');
    process.exit(1);
  }
  console.log(`✅ Subcategorias OK\n`);

  const subcategoryMap: Record<string, mongoose.Types.ObjectId> = {
    'wetsuits-long-john': subLongJohn._id,
    'wetsuits-short-john': subShortJohn._id,
    'wetsuits-jaqueta-neoprene': subJaqueta._id,
    'wetsuits-lycra-neolycra': subLycra._id,
    'wetsuits-acessorios-neoprene': subAcessorios._id,
  };

  if (WIPE_BEFORE_SEED) {
    console.log('⚠️  WIPE habilitado — apagando wetsuits Hurley existentes...');
    const wipeResult = await Product.deleteMany({
      brand: brand._id,
      category: category._id,
    });
    console.log(`🗑️  ${wipeResult.deletedCount} produto(s) apagado(s)\n`);
  }

  // Validação: SKUs duplicados internos
  const skuSet = new Set<string>();
  const dupes: string[] = [];
  for (const p of PRODUCTS) {
    if (skuSet.has(p.sku)) dupes.push(p.sku);
    skuSet.add(p.sku);
  }
  if (dupes.length > 0) {
    console.error('❌ SKUs duplicados internos:', dupes);
    process.exit(1);
  }

  // Validação: conflito com outros seeds
  console.log('🔍 Verificando conflitos com seeds anteriores...');
  const existing = await Product.find({
    sku: { $in: PRODUCTS.map(p => p.sku) },
  })
    .select('sku')
    .lean();
  if (existing.length > 0) {
    console.warn('⚠️  SKUs já existentes (serão atualizados via upsert):');
    existing.forEach(p => console.warn(`   ${p.sku}`));
  }
  console.log('');

  // Validação: 1 isMainVariant por família
  const familyMainCount = new Map<string, number>();
  for (const p of PRODUCTS) {
    if (p.isMainVariant) {
      familyMainCount.set(
        p.productFamily,
        (familyMainCount.get(p.productFamily) || 0) + 1,
      );
    }
  }
  const multipleMains: string[] = [];
  familyMainCount.forEach((count, family) => {
    if (count > 1) multipleMains.push(family);
  });
  if (multipleMains.length > 0) {
    console.error('❌ Famílias com múltiplas mainVariant:', multipleMains);
    process.exit(1);
  }

  // Inserção via upsert
  console.log(
    `📦 Inserindo/atualizando ${PRODUCTS.length} produtos Hurley...\n`,
  );

  let created = 0;
  let updated = 0;
  let totalValue = 0;
  const families = new Set<string>();

  for (const p of PRODUCTS) {
    const slug = generateSlug(p.name);
    const normalizedName = normalizeName(p.name);
    families.add(p.productFamily);
    totalValue += p.price;

    const tags = [
      'wetsuit',
      p.wetsuitType,
      'hurley',
      p.wetsuitLine.toLowerCase().replace(/\s+/g, '-'),
      p.thickness.replace('/', '-').replace('.', '-'),
      p.gender,
      p.color.toLowerCase().replace(/\s+/g, '-').replace('/', '-'),
      ...(p.isUsed ? ['usado'] : []),
    ].filter(t => t && t.length > 0);

    const productData = {
      name: normalizedName,
      slug,
      description: p.description,
      sku: p.sku,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      costPrice: Math.round(p.price / 2),
      category: category._id,
      subcategory: subcategoryMap[p.subcategorySlug],
      brand: brand._id,
      supplier: supplier._id,
      supplierProductCode: p.supplierProductCode,
      images: [],
      thumbnail: '',
      stock: p.isUsed ? 1 : 1, // usado tem apenas 1 unidade
      weight: p.weight,
      dimensions: {
        length: p.wetsuitType === 'long-john' ? 40 : 35,
        width: 30,
        height: p.wetsuitType === 'lycra' ? 3 : 6,
      },
      tags,
      isActive: true,
      isFeatured: p.isFeatured,
      isNewArrival: !p.isUsed,
      isOnSale: p.isOnSale,
      salePercentage: p.salePercentage,
      seoTitle: '',
      seoDescription: '',
      productFamily: p.productFamily,
      variantType: 'size' as const,
      color: p.color,
      colorCode: p.colorCode,
      colorCode2: p.colorCode2 || '',
      size: p.size,
      isMainVariant: p.isMainVariant,
      isAvailableInStore: true,
      isPublishedOnline: false,
      gtin: p.gtin || '',
      ncm: p.ncm,
      origin: p.origin,
      cest: '',
      wetsuitType: p.wetsuitType,
      thickness: p.thickness,
      gender: p.gender,
      wetsuitLine: p.wetsuitLine,
      zipperType: p.zipperType,
    };

    const existingProduct = await Product.findOne({ sku: p.sku });
    if (existingProduct) {
      await Product.updateOne({ sku: p.sku }, { $set: productData });
      updated++;
      console.log(`🔄 ${p.sku} → atualizado`);
    } else {
      await Product.create(productData);
      created++;
      console.log(`✨ ${p.sku} → criado`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 RESUMO — HURLEY (Advantage + Femininos + Juvenis)');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total processado:  ${PRODUCTS.length}`);
  console.log(`✨ Criados:        ${created}`);
  console.log(`🔄 Atualizados:    ${updated}`);
  console.log(`📦 Famílias únicas: ${families.size}`);
  console.log(`💰 Valor total:    R$ ${totalValue.toLocaleString('pt-BR')}`);
  console.log('═══════════════════════════════════════════════════');

  const pendingGtin = PRODUCTS.filter(p => !p.gtin);
  if (pendingGtin.length > 0) {
    console.log('');
    console.log('⚠️  GTIN PENDENTE:');
    pendingGtin.forEach(p => console.log(`   ${p.sku}`));
  }

  const usedProducts = PRODUCTS.filter(p => p.isUsed);
  if (usedProducts.length > 0) {
    console.log('');
    console.log('🏷️  PRODUTOS USADOS (com desconto):');
    usedProducts.forEach(p =>
      console.log(
        `   ${p.sku} — ${p.name} (${p.salePercentage}% off, de R$ ${p.compareAtPrice} por R$ ${p.price})`,
      ),
    );
  }

  console.log('');
  console.log('🎯 Próximo: seed-wetsuits-vissla.ts (7 Seas — 8 SKUs)');
  console.log('');

  await mongoose.disconnect();
  console.log('🔌 Conexão encerrada.');
}

seed().catch(err => {
  console.error('❌ Erro:', err);
  mongoose.disconnect();
  process.exit(1);
});
