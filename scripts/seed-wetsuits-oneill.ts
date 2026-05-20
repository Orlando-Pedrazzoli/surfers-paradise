/**
 * seed-wetsuits-oneill.ts
 *
 * Seed — O'Neill (linha Hyperfreak + Jaquetas + Femininos)
 *
 * Cobre 10 SKUs O'Neill do catálogo Surfers Paradise:
 *   - 3 Long Johns Hyperfreak (2mm, 3/2 Black, 3/2 Fire)
 *   - 3 Jaquetas neoprene (1mm c/ Lycra, 1.5mm, 2mm)
 *   - 2 Short Johns masculinos (M/L, Cavado)
 *   - 2 Short Johns femininos (Back Zip, Front Zip)
 *
 * Rodar com:
 *   npx tsx scripts/seed-wetsuits-oneill.ts
 *
 * Pré-requisitos:
 *   ✓ MAGIC SURF LTDA + categoria Wetsuits + subcategorias prontas
 *   ✓ seed-categories.ts já rodado
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
  // TechnoButter — neoprene proprietário da O'Neill
  technoButter: `TechnoButter — Neoprene Proprietário O'Neill
TechnoButter é o neoprene exclusivo da O'Neill — projetado para ser mais leve, mais elástico e mais hidrofóbico que materiais tradicionais. A versão TechnoButter 3 (TB3) é 20% mais leve e absorve 30% menos água que qualquer outro neoprene do mercado. Resultado: você sai da água mais leve, com a roupa secando mais rápido, e remando com menos resistência.`,

  technoButter3X: `TechnoButter 3X — A Borracha Mais Flexível O'Neill
O TB3X é a versão MAIS FLEXÍVEL do TechnoButter — pré-esticado durante a fabricação para durar mais sem perder elasticidade. Usado nas zonas críticas de remada (ombros, braços) e no forro interno. Reconhecível visualmente pelo padrão tipo veludo cotelê (corduroy).`,

  hyperfreakLine: `Linha Hyperfreak — O Maior Avanço da O'Neill em Neoprene
A linha Hyperfreak representa o maior avanço em tecnologia de neoprene desde a invenção do wetsuit. Eleita Wetsuit of the Year múltiplas vezes, é a roupa que combina ultra-flexibilidade (TechnoButter 3X) com leveza extrema e secagem rápida. Usada por team riders profissionais da O'Neill em todo o mundo.`,

  gbsSeams: `Costuras GBS (Glued and Blind Stitched)
Costuras coladas e cegas (não atravessam o neoprene de um lado a outro) — vedação muito superior ao costura tradicional. Triple-glued com cola à base de água, mantendo você seco e flexível.`,

  cuidados: `Cuidados com sua Roupa de Borracha
• Sempre seque dobrada ao meio — nunca pendure pelo ombro.
• Lave apenas com água doce após cada uso.
• Não use sabão ou shampoo.
• Seque à sombra.`,

  garantia: `Garantia O'Neill
Garantia internacional contra defeitos de fabricação. Consulte detalhes no tag do produto.`,
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
  price: number;
  gtin: string;
  weight: number;
  supplierProductCode: string;
  subcategorySlug:
    | 'wetsuits-long-john'
    | 'wetsuits-short-john'
    | 'wetsuits-jaqueta-neoprene';
  wetsuitType: 'long-john' | 'short-john' | 'jaqueta';
  thickness: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  wetsuitLine: string;
  zipperType: 'zip-free' | 'chest-zip' | 'back-zip' | 'front-zip' | '';
  origin: '0' | '1' | '2';
  ncm: string;
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO — 10 SKUs O'NEILL
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedWetsuit[] = [
  // ════════════════════════════════════════════════════════════
  // LONG JOHNS HYPERFREAK (3 SKUs)
  // ════════════════════════════════════════════════════════════

  // Hyperfreak 2mm
  {
    sku: 'ON-HYPERFREAK-2MM-8535',
    name: "Long John O'Neill Hyperfreak 2mm Black M",
    productFamily: 'long-john-oneill-hyperfreak-2mm',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 2999.0,
    gtin: '',
    weight: 900,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '2mm',
    gender: 'masculino',
    wetsuitLine: 'Hyperfreak',
    zipperType: 'chest-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Long John O'Neill Hyperfreak 2mm — colorway Black, tamanho M.",
      '',
      "A versão 2mm do lendário Hyperfreak — espessura ideal para meia-estação no Sul/Sudeste ou inverno do Nordeste. Toda a tecnologia TechnoButter 3 da O'Neill em um wetsuit mais leve e flexível para água amena. Sistema F.U.Z.E. (Front Upper Zip Entry) — o chest zip exclusivo da O'Neill.",
      '',
      DESC_BLOCKS.hyperfreakLine,
      '',
      DESC_BLOCKS.technoButter,
      '',
      DESC_BLOCKS.technoButter3X,
      '',
      'Sistema F.U.Z.E. — Front Upper Zip Entry',
      "O F.U.Z.E. Closure é o chest zip patenteado da O'Neill — barreira anti-flush superior, costuras mínimas no peito e melhor flex nas costas que o back zip tradicional.",
      '',
      DESC_BLOCKS.gbsSeams,
      '',
      'Guia de Temperatura — 2mm',
      'Espessura ideal para água amena entre 18 e 22°C. Recomendada para meia-estação SP/RJ ou inverno do Nordeste do Brasil.',
      '',
      'Tamanho M (Medium) — recomendado para altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // Hyperfreak 3/2 Black
  {
    sku: 'ON-HYPERFREAK-32-BLK-6875',
    name: "Long John O'Neill Hyperfreak 3/2mm Black M",
    productFamily: 'long-john-oneill-hyperfreak-3-2',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 3299.0,
    gtin: '',
    weight: 1050,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Hyperfreak',
    zipperType: 'chest-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Long John O'Neill Hyperfreak 3/2mm — colorway Black, tamanho M.",
      '',
      'O wetsuit mais flexível do mercado para água fria. O Hyperfreak 3/2mm é a roupa go-to para o inverno brasileiro — ultra-leve, ultra-flexível e com secagem rápida. Construção com TechnoButter 3X nas zonas de remada (ombros e braços) + TechnoButter 3 no resto. Sistema F.U.Z.E. (Chest Zip) para máxima vedação.',
      '',
      DESC_BLOCKS.hyperfreakLine,
      '',
      DESC_BLOCKS.technoButter,
      '',
      DESC_BLOCKS.technoButter3X,
      '',
      'Por que escolher o Hyperfreak 3/2?',
      '- Versão mais quente (+0.5mm) do Hyperfreak Comp',
      '- TechnoButter 3X nas mangas para remadas sem esforço',
      '- F.U.Z.E. chest zip — vedação superior',
      '- Costuras GBS triple-glued',
      '- 90%+ de fibras recicladas no forro (sustentável)',
      '',
      'Guia de Temperatura — 3/2mm',
      'Espessura ideal para água fria entre 14 e 19°C. Recomendada para o inverno no Sul e Sudeste do Brasil.',
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // Hyperfreak 3/2 Fire
  {
    sku: 'ON-HYPERFREAK-32-FIRE-6876',
    name: "Long John O'Neill Hyperfreak Fire 3/2mm Black/Red M",
    productFamily: 'long-john-oneill-hyperfreak-fire-3-2',
    size: 'M',
    color: 'Black/Red',
    colorCode: '#000000',
    colorCode2: '#DC2626',
    isMainVariant: true,
    isFeatured: true,
    price: 3999.0,
    gtin: '',
    weight: 1100,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Hyperfreak',
    zipperType: 'chest-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Long John O'Neill Hyperfreak FIRE 3/2mm — colorway Black/Red, tamanho M.",
      '',
      'A versão TOPO DE LINHA do Hyperfreak — Fire eleva a tecnologia legendary do Hyperfreak para um próximo nível com aquecimento, durabilidade e conforto extremos. Construído com o novíssimo TechnoButter 4 — neoprene buttery soft que RE-CIRCULA o calor corporal. Painel TB4 Firewall no peito para máxima retenção de calor. Construção sustentável com 90%+ fibras recicladas e infusão de carbono de ostras recicladas.',
      '',
      DESC_BLOCKS.hyperfreakLine,
      '',
      'TechnoButter 4 — Aquecimento Re-circulante',
      'A 4ª geração do TechnoButter é uma evolução sustentável que captura e re-circula o calor corporal por mais tempo. Sensação manteiga (buttery soft) na pele, secagem rápida e construção com materiais reciclados.',
      '',
      'TB4 Firewall — Painel Térmico Premium',
      'Painel de TB4 Firewall localizado estrategicamente no peito (área crítica de perda de calor). Cria uma barreira térmica adicional sem comprometer flexibilidade.',
      '',
      'Fluid Seam Construction — Costuras Water-Tight',
      'Costuras Fluid Seam — sem perfurações, completamente vedadas. Cria uma nova lenda em água fria.',
      '',
      'Guia de Temperatura — 3/2mm Fire',
      'Espessura 3/2mm com tecnologia Fire — ideal para água fria entre 12 e 17°C. Aquece mais que o Hyperfreak padrão graças ao TechnoButter 4. Perfeita para o inverno SC/RS ou viagens para Califórnia e Europa.',
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // JAQUETAS DE NEOPRENE (3 SKUs)
  // ════════════════════════════════════════════════════════════

  // Jaqueta c/ Lycra 1mm
  {
    sku: 'ON-JKT-LYCRA-1MM',
    name: "Jaqueta Neoprene O'Neill com Lycra 1mm Black M",
    productFamily: 'jaqueta-neoprene-oneill-lycra-1mm',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 979.0,
    gtin: '',
    weight: 250,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1mm',
    gender: 'masculino',
    wetsuitLine: 'Hyperfreak',
    zipperType: '',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Jaqueta Neoprene O'Neill com Lycra 1mm — colorway Black, tamanho M.",
      '',
      "Jaqueta híbrida O'Neill que combina painéis de neoprene 1mm com tecido lycra de alta performance. Leveza extrema com proteção térmica leve — perfeita para usar sozinha em água quente ou como camada extra em água amena.",
      '',
      'Quando usar?',
      '- Como peça única em água quente (acima de 22°C)',
      '- Como camada extra de calor por baixo de outro wetsuit',
      '- Proteção UV em sessões longas',
      '',
      DESC_BLOCKS.technoButter,
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Jaqueta 1.5mm
  {
    sku: 'ON-JKT-15MM',
    name: "Jaqueta Neoprene O'Neill 1.5mm Black M",
    productFamily: 'jaqueta-neoprene-oneill-1-5',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1299.0,
    gtin: '',
    weight: 320,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'Hyperfreak',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Jaqueta Neoprene O'Neill 1.5mm — colorway Black, tamanho M.",
      '',
      "Jaqueta de neoprene 1.5mm da O'Neill — equilíbrio perfeito entre proteção térmica e mobilidade. Ideal para meia-estação ou como camada extra de aquecimento por baixo de um Long John no inverno.",
      '',
      DESC_BLOCKS.technoButter,
      '',
      'Quando usar?',
      '- Meia-estação SP/RJ (água 18-22°C) como peça única',
      '- Camada extra de calor no inverno SC/PR/RS',
      '- Sessões longas onde o torso fica exposto ao vento',
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Jaqueta 2mm
  {
    sku: 'ON-JKT-2MM-2154',
    name: "Jaqueta Neoprene O'Neill 2mm Black M",
    productFamily: 'jaqueta-neoprene-oneill-2mm',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1399.0,
    gtin: '',
    weight: 380,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '2mm',
    gender: 'masculino',
    wetsuitLine: 'Hyperfreak',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Jaqueta Neoprene O'Neill 2mm — colorway Black, tamanho M.",
      '',
      "Jaqueta robusta de neoprene 2mm da O'Neill — proteção térmica significativa no torso. Ideal para água amena/fresca ou como camada extra premium por baixo de um Long John no inverno mais rigoroso.",
      '',
      DESC_BLOCKS.technoButter,
      '',
      `Sistema Back Zip — Zíper nas Costas\nZíper longitudinal para facilidade de vestir e tirar.`,
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // SHORT JOHNS MASCULINOS (2 SKUs)
  // ════════════════════════════════════════════════════════════

  // Short John M/L
  {
    sku: 'ON-SJ-ML',
    name: "Short John O'Neill M/L Black M",
    productFamily: 'short-john-oneill-m-l',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 2749.0,
    gtin: '',
    weight: 850,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'Hyperfreak',
    zipperType: 'chest-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Short John O'Neill Manga Longa 2/2mm — colorway Black, tamanho M.",
      '',
      "Short John com mangas longas (M/L = Manga Longa) — combinação ideal de pernas livres para mobilidade e braços protegidos do vento. Toda a tecnologia TechnoButter 3 da O'Neill em formato versátil para meia-estação.",
      '',
      DESC_BLOCKS.technoButter,
      '',
      'Quando usar?',
      '- Meia-estação SP/RJ — pernas em água amena, braços protegidos do vento',
      '- Sessões matinais onde o ar está fresco mas a água está boa',
      '- Treino de longa duração em água 18-22°C',
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Short John Cavado
  {
    sku: 'ON-SJ-CAVADO',
    name: "Short John O'Neill Cavado Black M",
    productFamily: 'short-john-oneill-cavado',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1359.0,
    gtin: '',
    weight: 600,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2mm',
    gender: 'masculino',
    wetsuitLine: 'Hyperfreak',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Short John O'Neill Cavado 2mm — colorway Black, tamanho M.",
      '',
      "Short John cavado (sem mangas) da O'Neill — máxima liberdade nos ombros e braços, ideal para sessões onde o foco é remada agressiva e manobras top-turn. Construção TechnoButter 3 nas pernas para conforto.",
      '',
      DESC_BLOCKS.technoButter,
      '',
      'Quando usar?',
      '- Dias quentes onde apenas o torso/pernas precisam de proteção',
      '- Treinos de paddle / sessões longas em água quente',
      '- Por baixo de jaqueta de neoprene em dias frescos',
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // SHORT JOHNS FEMININOS (2 SKUs)
  // ════════════════════════════════════════════════════════════

  // Short John Fem Back Zip
  {
    sku: 'ON-SJ-WMS-BZ',
    name: "Short John Feminino O'Neill Back Zip Black P",
    productFamily: 'short-john-feminino-oneill-back-zip',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1799.0,
    gtin: '',
    weight: 700,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'feminino',
    wetsuitLine: 'Hyperfreak',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Short John FEMININO O'Neill Back Zip 2/2mm — colorway Black, tamanho P.",
      '',
      "Short John feminino da O'Neill com sistema Back Zip — fácil de vestir e tirar. Construção TechnoButter 3 com cortes anatômicos pensados para o corpo feminino. Combinação ideal entre praticidade e performance.",
      '',
      DESC_BLOCKS.technoButter,
      '',
      DESC_BLOCKS.gbsSeams,
      '',
      'Tamanho P — altura 1,55-1,60m e busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Short John Fem Front Zip
  {
    sku: 'ON-SJ-WMS-FZ',
    name: "Short John Feminino O'Neill Front Zip Black P",
    productFamily: 'short-john-feminino-oneill-front-zip',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1459.0,
    gtin: '',
    weight: 650,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'feminino',
    wetsuitLine: 'Hyperfreak',
    zipperType: 'front-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      "Short John FEMININO O'Neill Front Zip 2/2mm — colorway Black, tamanho P.",
      '',
      "Short John feminino da O'Neill com sistema Front Zip — zíper na frente para vestir e tirar com facilidade e estética fashion. Construção TechnoButter 3 com cortes femininos.",
      '',
      DESC_BLOCKS.technoButter,
      '',
      'Sistema Front Zip',
      "Zíper localizado na parte frontal do peito — vestir e tirar com praticidade, design fashion característico da linha feminina O'Neill.",
      '',
      'Tamanho P — altura 1,55-1,60m e busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },
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

  console.log("🔍 Verificando marca O'Neill...");
  let brand = await Brand.findOne({ name: "O'Neill" });
  if (!brand) {
    brand = await Brand.create({
      name: "O'Neill",
      slug: 'oneill',
      description:
        "Fundada em 1952 por Jack O'Neill em San Francisco, é a empresa que INVENTOU o wetsuit moderno. Pioneira em tecnologia de neoprene com a linha Hyperfreak e o exclusivo TechnoButter — eleitos múltiplas vezes Wetsuit of the Year.",
      isActive: true,
    });
    console.log(`✨ Marca "O'Neill" criada\n`);
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

  // ─── Subcategorias (3) ─────────────────────────────────────
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
  if (!subLongJohn || !subShortJohn || !subJaqueta) {
    console.error('❌ Subcategorias necessárias não encontradas.');
    process.exit(1);
  }
  console.log(`✅ Long John: ${subLongJohn.name}`);
  console.log(`✅ Short John: ${subShortJohn.name}`);
  console.log(`✅ Jaqueta: ${subJaqueta.name}\n`);

  const subcategoryMap: Record<string, mongoose.Types.ObjectId> = {
    'wetsuits-long-john': subLongJohn._id,
    'wetsuits-short-john': subShortJohn._id,
    'wetsuits-jaqueta-neoprene': subJaqueta._id,
  };

  if (WIPE_BEFORE_SEED) {
    console.log(
      "⚠️  WIPE habilitado — apagando wetsuits O'Neill existentes...",
    );
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
    `📦 Inserindo/atualizando ${PRODUCTS.length} produtos O'Neill...\n`,
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
      'oneill',
      "o'neill",
      p.wetsuitLine.toLowerCase().replace(/\s+/g, '-'),
      p.thickness.replace('/', '-').replace('.', '-'),
      p.gender,
      p.color.toLowerCase().replace(/\s+/g, '-').replace('/', '-'),
    ].filter(t => t && t.length > 0);

    const productData = {
      name: normalizedName,
      slug,
      description: p.description,
      sku: p.sku,
      price: p.price,
      compareAtPrice: 0,
      costPrice: Math.round(p.price / 2),
      category: category._id,
      subcategory: subcategoryMap[p.subcategorySlug],
      brand: brand._id,
      supplier: supplier._id,
      supplierProductCode: p.supplierProductCode,
      images: [],
      thumbnail: '',
      stock: 1,
      weight: p.weight,
      dimensions: {
        length: p.wetsuitType === 'long-john' ? 40 : 35,
        width: 30,
        height: 6,
      },
      tags,
      isActive: true,
      isFeatured: p.isFeatured,
      isNewArrival: true,
      isOnSale: false,
      salePercentage: 0,
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
  console.log("📊 RESUMO — O'NEILL (Hyperfreak + Jaquetas + Femininos)");
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

  console.log('');
  console.log('🎯 Próximo: seed-wetsuits-hurley.ts (Advantage — 9 SKUs)');
  console.log('');

  await mongoose.disconnect();
  console.log('🔌 Conexão encerrada.');
}

seed().catch(err => {
  console.error('❌ Erro:', err);
  mongoose.disconnect();
  process.exit(1);
});
