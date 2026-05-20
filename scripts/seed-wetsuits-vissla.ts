/**
 * seed-wetsuits-vissla.ts
 *
 * Seed — Vissla (linha 7 Seas + Jaquetas + Femininos)
 *
 * Cobre 8 SKUs Vissla do catálogo Surfers Paradise:
 *   - 3 Long Johns 7 Seas (3/2 Chest Zip, 4/3 Chest Zip, 4/3 Back Zip)
 *   - 2 Jaquetas neoprene (2mm, 1.5mm com Lycra)
 *   - 2 Short Johns (1 masculino M/L, 1 feminino Back Zip)
 *   - 1 Long John Juvenil 7 Seas 3/2
 *
 * Rodar com:
 *   npx tsx scripts/seed-wetsuits-vissla.ts
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
  sFoam: `S-Foam — Neoprene Japonês à Base de Limestone
A Vissla usa 100% Super Stretch Japanese Limestone Neoprene (S-Foam) — extraído de calcário em vez de petroquímicos. É mais leve, mais quente, mais macio, mais elástico e mais durável que o neoprene tradicional à base de petróleo. Surfistas relatam wetsuits 7 Seas ainda performando após 5+ anos de uso.`,

  feverFiber: `Forro Fever Fiber Lining
Forro térmico Fever Fiber no torso e costas — isola o calor corporal e seca muito mais rápido que forros convencionais. "Aquece rápido, esfria devagar." Nas pernas, forro Eco Fiber Stretch (mais leve para maior mobilidade).`,

  ecoCarbonBlack: `Eco Carbon Black — Carbono de Pneus Reciclados
O carbon black, ingrediente-chave do neoprene, agora é feito a partir de borracha de pneus descartados. Reduz 200g de CO₂ por wetsuit produzido. Resultado: você surfa com a consciência tranquila.`,

  aquaAlpha: `Aqua Alpha — Cola Water-Based Sem Solvente
Laminação à base de água, completamente livre de solventes químicos. Bom para você, bom para o oceano. Produzido em fábricas certificadas Bluesign System Partner.`,

  tripleSeams: `Costuras Triple GBS + Neo 3.0 Tape
Costuras triplas coladas + duplo blind-stitched. Fita Neo 3.0 super stretch interna em pontos críticos (entrepernas, joelhos) — vedação à prova de água sem perder elasticidade.`,

  sevenSeasLine: `Linha 7 Seas — A Best-Selling da Vissla
A 7 Seas é a roupa mais vendida da Vissla — eleita repetidamente "best value" no mercado de wetsuits. Construída para o surfista de 3-5 sessões por semana que quer durabilidade comprovada, aquecimento confiável e preço acessível. Verificada por 7+ anos de uso real por surfistas reais em condições reais.`,

  chestZip: `Sistema Chest Zip
Zíper horizontal no peito (acima do esterno) — vedação water-tight, design contornado de mínimo volume. Cordão para chave acessível na parte interna. Liquid tape selando os punhos para prevenir flushing.`,

  backZip: `Sistema Back Zip
Zíper longitudinal nas costas — o sistema mais fácil de vestir solo, ideal para iniciantes ou quem prefere praticidade. Flap interno previne entrada de água.`,

  garantia: `Garantia Vissla
Garantia de 1 ano em costuras e neoprene a partir da data de compra original. Painéis Smoothy garantidos por 6 meses.`,

  cuidados: `Cuidados com sua Roupa de Borracha
• Lave sempre com água doce após cada uso (por dentro e por fora).
• Pendure em local fresco à sombra — evite sol direto.
• Nunca pise no wetsuit ao trocar de roupa.
• Não use sabão ou shampoo.`,
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
  gender: 'masculino' | 'feminino' | 'kids' | 'unissex';
  wetsuitLine: string;
  zipperType: 'zip-free' | 'chest-zip' | 'back-zip' | 'front-zip' | '';
  origin: '0' | '1' | '2';
  ncm: string;
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO — 8 SKUs VISSLA
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedWetsuit[] = [
  // ════════════════════════════════════════════════════════════
  // LONG JOHN 7 SEAS 3/2mm Chest Zip (Masculino)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'VS-7SEAS-32-CZ-M',
    name: 'Long John Vissla 7 Seas 3/2mm Chest Zip Black M',
    productFamily: 'long-john-vissla-7-seas-3-2-chest-zip',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 2899.0,
    gtin: '',
    weight: 1050,
    supplierProductCode: 'MW32Y7FC-BLK-M',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: '7 Seas',
    zipperType: 'chest-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      'Long John Vissla 7 Seas 3/2mm Chest Zip — colorway Black, tamanho M.',
      '',
      'O LONG JOHN MAIS VENDIDO DA VISSLA. O 7 Seas 3/2 é a roupa que combina sustentabilidade real (S-Foam limestone neoprene) com performance comprovada por 7+ anos de uso. Sistema Chest Zip para vedação superior, forro Fever Fiber no torso para máximo aquecimento. Tudo o que você precisa em um wetsuit — e nada que você não precisa.',
      '',
      'Por que escolher o 7 Seas 3/2?',
      '- Verificado por 7+ anos de uso real',
      '- S-Foam limestone — não estica com o tempo como o neoprene tradicional',
      '- Forro Fever Fiber no torso + Eco Fiber nas pernas',
      '- Cordão de chave interno acessível',
      '- Joelheira Supratex reciclada (resistente à abrasão)',
      '- Liquid tape selando punhos contra flushing',
      '- Vedação Glideskin no pescoço',
      '',
      DESC_BLOCKS.sevenSeasLine,
      '',
      DESC_BLOCKS.sFoam,
      '',
      DESC_BLOCKS.feverFiber,
      '',
      DESC_BLOCKS.ecoCarbonBlack,
      '',
      DESC_BLOCKS.aquaAlpha,
      '',
      DESC_BLOCKS.tripleSeams,
      '',
      DESC_BLOCKS.chestZip,
      '',
      'Guia de Temperatura — 3/2mm',
      'Espessura ideal para água fria entre 14 e 19°C. Recomendada para o inverno no Sul e Sudeste do Brasil.',
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // LONG JOHN 7 SEAS 4/3mm Chest Zip (Água Fria Premium)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'VS-7SEAS-43-CZ-G',
    name: 'Long John Vissla 7 Seas 4/3mm Chest Zip Black G',
    productFamily: 'long-john-vissla-7-seas-4-3-chest-zip',
    size: 'G',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 3199.0,
    gtin: '',
    weight: 1250,
    supplierProductCode: 'MW43Y7FC-BLK-G',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '4/3',
    gender: 'masculino',
    wetsuitLine: '7 Seas',
    zipperType: 'chest-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      'Long John Vissla 7 Seas 4/3mm Chest Zip — colorway Black, tamanho G.',
      '',
      'A versão MAIS QUENTE do 7 Seas — espessura 4/3mm (4mm no torso, 3mm nas pernas) para enfrentar água fria sem desistir. Surfistas europeus já substituíram wetsuits mais grossos pelo 7 Seas 4/3 graças à eficiência térmica do S-Foam + Fever Fiber. Eleito "best value winter wetsuit" várias vezes.',
      '',
      DESC_BLOCKS.sevenSeasLine,
      '',
      DESC_BLOCKS.sFoam,
      '',
      DESC_BLOCKS.feverFiber,
      '',
      DESC_BLOCKS.ecoCarbonBlack,
      '',
      DESC_BLOCKS.tripleSeams,
      '',
      DESC_BLOCKS.chestZip,
      '',
      'Guia de Temperatura — 4/3mm',
      'Espessura ideal para água fria/gelada entre 11 e 16°C. Recomendada para o auge do inverno em Santa Catarina e Rio Grande do Sul, ou viagens para Califórnia (norte), Europa e Pacific Northwest.',
      '',
      'Tamanho G (Large) — altura 1,78-1,83m e peso 80-88kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // LONG JOHN 7 SEAS 4/3mm Back Zip (Custo-Benefício)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'VS-7SEAS-43-BZ-M',
    name: 'Long John Vissla 7 Seas 4/3mm Back Zip Black M',
    productFamily: 'long-john-vissla-7-seas-4-3-back-zip',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 2799.0,
    gtin: '',
    weight: 1250,
    supplierProductCode: 'MW43Y7BZ-BLK-M',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '4/3',
    gender: 'masculino',
    wetsuitLine: '7 Seas',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      'Long John Vissla 7 Seas 4/3mm Back Zip — colorway Black, tamanho M.',
      '',
      'A versão Back Zip do 7 Seas 4/3 — mesma tecnologia S-Foam premium da versão Chest Zip, agora com sistema de entrada mais fácil. Ideal para quem está começando no inverno, prefere praticidade, ou simplesmente quer economizar em relação ao Chest Zip sem abrir mão da qualidade Vissla.',
      '',
      DESC_BLOCKS.sevenSeasLine,
      '',
      DESC_BLOCKS.sFoam,
      '',
      DESC_BLOCKS.feverFiber,
      '',
      DESC_BLOCKS.ecoCarbonBlack,
      '',
      DESC_BLOCKS.tripleSeams,
      '',
      DESC_BLOCKS.backZip,
      '',
      'Guia de Temperatura — 4/3mm',
      'Espessura ideal para água fria/gelada entre 11 e 16°C. Recomendada para o inverno em SC/RS.',
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // LONG JOHN JUVENIL 7 SEAS 3/2mm
  // ════════════════════════════════════════════════════════════
  {
    sku: 'VS-7SEAS-JUV-32-12',
    name: 'Long John Juvenil Vissla 7 Seas 3/2mm Back Zip Black 12',
    productFamily: 'long-john-juvenil-vissla-7-seas-3-2',
    size: '12',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1799.0,
    gtin: '',
    weight: 800,
    supplierProductCode: 'YW32Y7BZ-BLK-12',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'kids',
    wetsuitLine: '7 Seas',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      'Long John JUVENIL Vissla 7 Seas 3/2mm Back Zip — colorway Black, tamanho 12 (numérico).',
      '',
      'A versão juvenil do 7 Seas — mesma tecnologia S-Foam limestone que faz o 7 Seas adulto ser o best-seller da Vissla, agora em proporções pensadas para o jovem surfista. Ideal para crianças e adolescentes que treinam no inverno e merecem um wetsuit de qualidade adulta.',
      '',
      DESC_BLOCKS.sFoam,
      '',
      DESC_BLOCKS.feverFiber,
      '',
      DESC_BLOCKS.ecoCarbonBlack,
      '',
      DESC_BLOCKS.backZip,
      '',
      'Tamanho 12 (numérico juvenil) — recomendado para idade entre 11 e 13 anos, altura 1,45-1,55m.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // JAQUETA NEOPRENE 2mm
  // ════════════════════════════════════════════════════════════
  {
    sku: 'VS-JKT-2MM',
    name: 'Jaqueta Neoprene Vissla 7 Seas 2mm Black M',
    productFamily: 'jaqueta-neoprene-vissla-7-seas-2mm',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1299.0,
    gtin: '',
    weight: 400,
    supplierProductCode: 'MW02Y7JK-BLK-M',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '2mm',
    gender: 'masculino',
    wetsuitLine: '7 Seas',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      'Jaqueta Neoprene Vissla 7 Seas 2mm — colorway Black, tamanho M.',
      '',
      'Jaqueta robusta de neoprene 2mm da linha 7 Seas — proteção térmica significativa no torso com toda a tecnologia sustentável Vissla. Ideal para usar SOZINHA em meia-estação ou COMO CAMADA EXTRA premium por baixo de um Long John no inverno.',
      '',
      DESC_BLOCKS.sFoam,
      '',
      DESC_BLOCKS.feverFiber,
      '',
      DESC_BLOCKS.ecoCarbonBlack,
      '',
      DESC_BLOCKS.backZip,
      '',
      'Quando usar?',
      '- Meia-estação SP/RJ como peça única',
      '- Camada extra de calor no inverno SC/PR/RS',
      '- Sessões longas onde o torso precisa de mais proteção',
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // JAQUETA NEOPRENE 1.5mm com Lycra (híbrida)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'VS-JKT-15-LYCRA',
    name: 'Jaqueta Neoprene Vissla com Lycra 1.5mm Black M',
    productFamily: 'jaqueta-neoprene-vissla-lycra-1-5',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 949.0,
    gtin: '',
    weight: 280,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: '7 Seas',
    zipperType: '',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      'Jaqueta Neoprene Vissla com Lycra 1.5mm — colorway Black, tamanho M.',
      '',
      'Jaqueta híbrida da Vissla que combina painéis de neoprene S-Foam 1.5mm com tecido lycra de alta performance. Leveza máxima com proteção térmica leve — perfeita para usar SOZINHA em água amena ou como camada extra de proteção UV.',
      '',
      DESC_BLOCKS.sFoam,
      '',
      DESC_BLOCKS.ecoCarbonBlack,
      '',
      'Quando usar?',
      '- Peça única em água quente (acima de 22°C)',
      '- Camada extra por baixo de Long John',
      '- Proteção UV em sessões longas',
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // SHORT JOHN MASCULINO 7 SEAS 2/2mm (M/L)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'VS-7SEAS-SJ-ML',
    name: 'Short John Vissla 7 Seas Long Sleeve 2/2mm Black M',
    productFamily: 'short-john-vissla-7-seas-l-sl-2-2',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 2199.0,
    gtin: '',
    weight: 850,
    supplierProductCode: 'MW22Y7LJ-BLK-M',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: '7 Seas',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      'Short John Vissla 7 Seas Long Sleeve 2/2mm — colorway Black, tamanho M.',
      '',
      'Short John com mangas longas e pernas curtas — combinação versátil de mobilidade nas pernas com proteção térmica nos braços e torso. Toda a tecnologia 7 Seas em formato compacto para meia-estação. Entrada Velcro no ombro com design retrô contornado.',
      '',
      DESC_BLOCKS.sFoam,
      '',
      DESC_BLOCKS.feverFiber,
      '',
      DESC_BLOCKS.ecoCarbonBlack,
      '',
      DESC_BLOCKS.tripleSeams,
      '',
      'Guia de Temperatura — 2/2mm',
      'Espessura ideal para água amena entre 18 e 22°C. Meia-estação SP/RJ ou inverno do Nordeste.',
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // SHORT JOHN FEMININO 7 SEAS Back Zip
  // ════════════════════════════════════════════════════════════
  {
    sku: 'VS-7SEAS-WMS-SJ-BZ',
    name: 'Short John Feminino Vissla 7 Seas Back Zip 2/2mm Black P',
    productFamily: 'short-john-feminino-vissla-7-seas-back-zip',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1799.0,
    gtin: '',
    weight: 700,
    supplierProductCode: 'WW22Y7BZ-BLK-P',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'feminino',
    wetsuitLine: '7 Seas',
    zipperType: 'back-zip',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      'Short John FEMININO Vissla 7 Seas Back Zip 2/2mm — colorway Black, tamanho P.',
      '',
      'A versão feminina do 7 Seas em formato Short John — cortes anatômicos pensados para o corpo feminino com toda a tecnologia sustentável da linha. S-Foam limestone, forro Fever Fiber no torso, costuras Triple GBS. Sistema Back Zip para facilidade de vestir.',
      '',
      DESC_BLOCKS.sFoam,
      '',
      DESC_BLOCKS.feverFiber,
      '',
      DESC_BLOCKS.ecoCarbonBlack,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.tripleSeams,
      '',
      'Tamanho P (Petite) — altura 1,55-1,60m e busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
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

  console.log('🔍 Verificando marca Vissla...');
  let brand = await Brand.findOne({ name: 'Vissla' });
  if (!brand) {
    brand = await Brand.create({
      name: 'Vissla',
      slug: 'vissla',
      description:
        'Marca californiana fundada em 2013, referência mundial em wetsuits sustentáveis. Pioneira no uso de S-Foam Limestone Neoprene japonês e Eco Carbon Black de pneus reciclados. A linha 7 Seas é eleita "best value" repetidamente no mercado.',
      isActive: true,
    });
    console.log(`✨ Marca "Vissla" criada\n`);
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
  if (!subLongJohn || !subShortJohn || !subJaqueta) {
    console.error('❌ Subcategorias necessárias não encontradas.');
    process.exit(1);
  }
  console.log(`✅ Subcategorias OK\n`);

  const subcategoryMap: Record<string, mongoose.Types.ObjectId> = {
    'wetsuits-long-john': subLongJohn._id,
    'wetsuits-short-john': subShortJohn._id,
    'wetsuits-jaqueta-neoprene': subJaqueta._id,
  };

  if (WIPE_BEFORE_SEED) {
    console.log('⚠️  WIPE habilitado — apagando wetsuits Vissla existentes...');
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
    `📦 Inserindo/atualizando ${PRODUCTS.length} produtos Vissla...\n`,
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
      'vissla',
      p.wetsuitLine.toLowerCase().replace(/\s+/g, '-'),
      p.thickness.replace('/', '-').replace('.', '-'),
      p.gender,
      p.color.toLowerCase().replace(/\s+/g, '-'),
      'sustentavel',
      'eco-friendly',
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
  console.log('📊 RESUMO — VISSLA (7 Seas + Jaquetas + Femininos)');
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
    console.log('⚠️  GTIN PENDENTE (todos — CSV Bling sem EAN para Vissla):');
    pendingGtin.forEach(p => console.log(`   ${p.sku}`));
  }

  console.log('');
  console.log(
    '🎯 Próximo: seed-wetsuits-neokai.ts (NeoKai — marca brasileira, 10 SKUs)',
  );
  console.log('');

  await mongoose.disconnect();
  console.log('🔌 Conexão encerrada.');
}

seed().catch(err => {
  console.error('❌ Erro:', err);
  mongoose.disconnect();
  process.exit(1);
});
