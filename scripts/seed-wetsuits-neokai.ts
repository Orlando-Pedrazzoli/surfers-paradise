/**
 * seed-wetsuits-neokai.ts
 *
 * Seed — NeoKai (marca brasileira de Santa Catarina)
 *
 * IMPORTANTE: NeoKai é fabricante NACIONAL — fornecedor diferente das marcas
 * importadas. O seed CRIA automaticamente o fornecedor "NeoKai Wetsuits" se
 * não existir. CNPJ e dados completos podem ser preenchidos depois via admin.
 *
 * Cobre 10 SKUs NeoKai:
 *   - 4 Long Johns (Skinlock 4/3, Hyper Lock 3/2, Flex 3/2, Juvenil 3/2)
 *   - 3 Jaquetas/Short Johns
 *   - 1 Calça de neoprene
 *   - 1 Maiô feminino
 *   - 1 Bermuda térmica
 *
 * Rodar com:
 *   npx tsx scripts/seed-wetsuits-neokai.ts
 *
 * Pré-requisitos:
 *   ✓ Categoria Wetsuits + subcategorias prontas
 *   ✓ seed-categories.ts já rodado
 *
 * Após este seed → 79 SKUs neoprene curados no catálogo total.
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
  about: `Sobre a NeoKai
A NeoKai nasceu em Santa Catarina com uma missão clara: produzir roupas de borracha de altíssima qualidade com preços acessíveis. Marca 100% brasileira, com fabricação nacional e assistência técnica própria no Brasil — você compra direto de quem fabrica, sem intermediários internacionais.`,

  skinlockLine: `Linha SKINLOCK — Topo de Linha NeoKai
A linha Skinlock é o ponto alto do catálogo NeoKai. Utiliza neoprene importado TOTAL FLEX, totalmente vedado e fitado nos pontos de tensão. Modelagem anatômica para máxima leveza e liberdade de movimento. Gola em neoprene SCS para maior conforto no pescoço.`,

  hyperLockLine: `Linha HYPER LOCK — Premium Importado
A linha Hyper Lock combina neoprene importado super flexível com construção de alto padrão. Ideal para quem quer surfar com total liberdade de movimento e proteção contra o vento frio.`,

  flexLine: `Linha FLEX — Custo-Benefício
A linha Flex utiliza neoprene nacional de alta qualidade — projetada para entregar performance com preço competitivo. Costura Blind Stitch em toda a roupa, com acabamento ZigZag no colete. Excelente opção para quem está começando ou quer uma segunda roupa.`,

  drySystem: `Sistema DRY SYSTEM
Sistema exclusivo NeoKai com saídas de água estratégicas na região frontal (peito) e nas costas — escoa rapidamente a água que entra durante uma vaca, mantendo o conforto e o aquecimento.`,

  blindStitch: `Costura BLIND STITCH
Costura cega em toda a roupa — a agulha NÃO atravessa o neoprene de um lado a outro, criando uma vedação muito superior à costura tradicional. Acabamento ZigZag no colete e na gola para máxima durabilidade.`,

  ykkZipper: `Zíper YKK Inoxidável
O zíper frontal (chest zip) é produzido com material YKK INOXIDÁVEL — a referência mundial em zíperes. Durabilidade e resistência à corrosão pela água salgada.`,

  silicone: `Estampa em Silicone
Estampas e logos aplicados em SILICONE — maior durabilidade e não craquelam com o uso, ao contrário das estampas convencionais que descascam após poucas sessões.`,

  goldGola: `Gola SCS — Conforto Premium
Gola fabricada em neoprene SCS, o material mais macio do mercado para a região do pescoço. Evita assaduras, marcas e desconforto durante sessões longas.`,

  brasileira: `Marca Brasileira — Vantagens
• Assistência técnica própria no Brasil — reparos rápidos sem precisar enviar para o exterior
• Sem taxas de importação no preço final
• Suporte direto pelo WhatsApp em português
• Acompanhamento de atletas NeoKai (@neokaibrasil)
• Garantia clara e atendimento simples`,

  cuidados: `Cuidados com sua Roupa de Borracha
• Sempre seque dobrada ao meio.
• Lave apenas com água doce após cada uso.
• Não use sabão ou shampoo.
• Seque à sombra.
• Evite contato com gasolina, óleo e solventes.`,
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
    | 'wetsuits-jaqueta-neoprene'
    | 'wetsuits-acessorios-neoprene';
  wetsuitType:
    | 'long-john'
    | 'short-john'
    | 'jaqueta'
    | 'lycra'
    | 'maio'
    | 'bermuda'
    | 'calca';
  thickness: string;
  gender: 'masculino' | 'feminino' | 'kids' | 'unissex';
  wetsuitLine: string;
  zipperType: 'zip-free' | 'chest-zip' | 'back-zip' | 'front-zip' | '';
  origin: '0' | '1' | '2';
  ncm: string;
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO — 10 SKUs NEOKAI
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedWetsuit[] = [
  // ════════════════════════════════════════════════════════════
  // LONG JOHNS NEOKAI
  // ════════════════════════════════════════════════════════════

  // Skinlock 4/3mm (TOPO DE LINHA — água gelada)
  {
    sku: 'NK-SKINLOCK-43-M',
    name: 'Long John NeoKai Skinlock 4/3mm Chest Zip Black M',
    productFamily: 'long-john-neokai-skinlock-4-3',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 1899.0,
    gtin: '',
    weight: 1250,
    supplierProductCode: 'NK-LJ-SKINLOCK-43-M',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '4/3',
    gender: 'masculino',
    wetsuitLine: 'Skinlock',
    zipperType: 'chest-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Long John NeoKai Skinlock 4/3mm Chest Zip — colorway Black, tamanho M.',
      '',
      'O TOPO ABSOLUTO da NeoKai. A linha Skinlock 4/3mm é a roupa premium para enfrentar água gelada do inverno catarinense. Combina neoprene importado TOTAL FLEX com construção 100% vedada e fitada nos pontos de tensão. Sistema Dry System exclusivo + zíper YKK inoxidável + gola SCS.',
      '',
      'Por que escolher o Skinlock 4/3?',
      '- Neoprene importado TOTAL FLEX (o mais flexível disponível)',
      '- 100% vedado e fitado nos pontos de tensão',
      '- Corte a fio nos braços e pernas (sem refilo)',
      '- Modelagem anatômica para máxima leveza',
      '- Gola SCS — conforto premium no pescoço',
      '- Zíper YKK inoxidável (referência mundial)',
      '- Estampa em silicone (não craquela)',
      '- Made in Brazil',
      '',
      DESC_BLOCKS.skinlockLine,
      '',
      DESC_BLOCKS.drySystem,
      '',
      DESC_BLOCKS.blindStitch,
      '',
      DESC_BLOCKS.ykkZipper,
      '',
      DESC_BLOCKS.silicone,
      '',
      DESC_BLOCKS.goldGola,
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Guia de Temperatura — 4/3mm',
      'Espessura ideal para água gelada entre 11 e 16°C. Recomendada para o inverno mais rigoroso em Santa Catarina e Rio Grande do Sul.',
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.about,
    ].join('\n'),
  },

  // Hyper Lock 3/2mm (Premium Importado)
  {
    sku: 'NK-HYPERLOCK-32-M',
    name: 'Long John NeoKai Hyper Lock 3/2mm Chest Zip Black M',
    productFamily: 'long-john-neokai-hyper-lock-3-2',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 1599.0,
    gtin: '',
    weight: 1100,
    supplierProductCode: 'NK-LJ-HYPERLOCK-32-M',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Hyper Lock',
    zipperType: 'chest-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Long John NeoKai Hyper Lock 3/2mm Chest Zip — colorway Black, tamanho M.',
      '',
      'A linha Hyper Lock combina neoprene importado super flexível com construção de alto padrão NeoKai. Modelagem anatômica para o corpo brasileiro, sistema Dry System, zíper YKK inoxidável. A roupa premium para o inverno em SP/RJ/SC sem o preço de uma importada.',
      '',
      DESC_BLOCKS.hyperLockLine,
      '',
      DESC_BLOCKS.drySystem,
      '',
      DESC_BLOCKS.blindStitch,
      '',
      DESC_BLOCKS.ykkZipper,
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Guia de Temperatura — 3/2mm',
      'Espessura ideal para água fria entre 14 e 19°C. Recomendada para o inverno no Sul e Sudeste do Brasil.',
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Flex 3/2mm (Custo-Benefício)
  {
    sku: 'NK-FLEX-32-M',
    name: 'Long John NeoKai Flex 3/2mm Back Zip Black M',
    productFamily: 'long-john-neokai-flex-3-2',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 999.0,
    gtin: '',
    weight: 1050,
    supplierProductCode: 'NK-LJ-FLEX-32-M',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Flex',
    zipperType: 'back-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Long John NeoKai Flex 3/2mm Back Zip — colorway Black, tamanho M.',
      '',
      'O ponto de entrada perfeito no mundo NeoKai. A linha Flex utiliza neoprene nacional de alta qualidade — proteção térmica eficiente para o inverno brasileiro a um preço muito competitivo. Costura Blind Stitch em toda a roupa, sistema Back Zip facilitando vestir e tirar.',
      '',
      DESC_BLOCKS.flexLine,
      '',
      DESC_BLOCKS.blindStitch,
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Quem deve escolher o Flex?',
      '- Iniciantes que querem uma primeira roupa de qualidade',
      '- Surfistas que precisam de uma segunda roupa para "rodízio"',
      '- Quem quer testar a NeoKai antes de investir no Skinlock/Hyper Lock',
      '',
      'Guia de Temperatura — 3/2mm',
      'Espessura ideal para água fria entre 14 e 19°C. Inverno em SP/RJ ou meia-estação em SC/PR.',
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Long John JUVENIL Importado 3/2
  {
    sku: 'NK-JUV-LJ-32-12',
    name: 'Long John Juvenil NeoKai Importado 3/2mm Black 12',
    productFamily: 'long-john-juvenil-neokai-importado-3-2',
    size: '12',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 899.0,
    gtin: '',
    weight: 850,
    supplierProductCode: 'NK-LJ-JUV-IMP-32-12',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'kids',
    wetsuitLine: 'Hyper Lock',
    zipperType: 'back-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Long John JUVENIL NeoKai Importado 3/2mm — colorway Black, tamanho 12.',
      '',
      'Long John juvenil construído com o mesmo material da linha Hyper Lock (top dos juvenis NeoKai). Neoprene premium importado super flexível — ideal para o jovem surfista que quer liberdade de movimento e proteção do vento frio durante sessões longas.',
      '',
      'Reforços em pontos estratégicos para aumentar a durabilidade (caimentos e vacas têm mais impacto nas crianças). Costura cega em toda a roupa, gola anatômica.',
      '',
      DESC_BLOCKS.hyperLockLine,
      '',
      DESC_BLOCKS.blindStitch,
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Tamanho 12 — recomendado para idade entre 11 e 13 anos, altura 1,45-1,55m.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // SHORT JOHN JUVENIL
  // ════════════════════════════════════════════════════════════
  {
    sku: 'NK-JUV-SJ-22-10',
    name: 'Short John Juvenil NeoKai Importado 2/2mm Black 10',
    productFamily: 'short-john-juvenil-neokai-importado-2-2',
    size: '10',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 649.0,
    gtin: '',
    weight: 600,
    supplierProductCode: 'NK-SJ-JUV-IMP-22-10',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'kids',
    wetsuitLine: 'Hyper Lock',
    zipperType: 'back-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Short John JUVENIL NeoKai Importado 2/2mm — colorway Black, tamanho 10.',
      '',
      'Short John juvenil em neoprene premium importado. Versão de mangas e pernas curtas — ideal para meia-estação, primavera e outono no Sudeste, ou inverno em dias de sol forte.',
      '',
      DESC_BLOCKS.hyperLockLine,
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Tamanho 10 — recomendado para idade entre 9 e 11 anos, altura 1,30-1,45m.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // JAQUETAS
  // ════════════════════════════════════════════════════════════

  // Jaqueta Adulto Hyper Lock 1.5mm
  {
    sku: 'NK-JKT-HYPERLOCK-15-M',
    name: 'Jaqueta Neoprene NeoKai Hyper Lock 1.5mm Black M',
    productFamily: 'jaqueta-neoprene-neokai-hyper-lock-1-5',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 449.0,
    gtin: '',
    weight: 380,
    supplierProductCode: 'NK-JKT-HYPERLOCK-15-M',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'Hyper Lock',
    zipperType: 'back-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Jaqueta Neoprene NeoKai Hyper Lock 1.5mm — colorway Black, tamanho M.',
      '',
      'Jaqueta de neoprene 1.5mm com neoprene importado da linha Hyper Lock. Cordão na cintura para que a jaqueta fique bem presa e não seja "arrancada" durante as vacas. Excelente opção para usar SOZINHA em água amena ou COMO CAMADA EXTRA por baixo de Long John no inverno.',
      '',
      DESC_BLOCKS.hyperLockLine,
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Tamanho M — altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Jaqueta Infantil Laranja
  {
    sku: 'NK-JUV-JKT-LARANJA-8',
    name: 'Jaqueta Neoprene Infantil NeoKai Importada Laranja 8',
    productFamily: 'jaqueta-neoprene-infantil-neokai-laranja',
    size: '8',
    color: 'Laranja',
    colorCode: '#F97316',
    colorCode2: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 399.0,
    gtin: '',
    weight: 280,
    supplierProductCode: 'NK-JKT-JUV-LARANJA-8',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1.5mm',
    gender: 'kids',
    wetsuitLine: 'Hyper Lock',
    zipperType: 'back-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Jaqueta Neoprene INFANTIL NeoKai Importada — colorway Laranja, tamanho 8.',
      '',
      'Jaqueta infantil em colorway laranja vibrante — fácil de identificar os pequenos surfistas na água (segurança extra). Construída com neoprene premium importado da linha Hyper Lock. Cordão na cintura para fixação durante as vacas.',
      '',
      'Excelente opção para usar naqueles dias em que o Short John não é suficiente mas o Long John seria demais. Vai muito bem em primavera e outono no Sudeste do Brasil.',
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Tamanho 8 — recomendado para idade entre 6 e 8 anos, altura 1,20-1,30m.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // CALÇA DE NEOPRENE
  // ════════════════════════════════════════════════════════════
  {
    sku: 'NK-CALCA-15-M',
    name: 'Calça Neoprene NeoKai 1.5mm Black M',
    productFamily: 'calca-neoprene-neokai-1-5',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 449.0,
    gtin: '',
    weight: 450,
    supplierProductCode: 'NK-CALCA-15-M',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'calca',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'Flex',
    zipperType: '',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Calça de Neoprene NeoKai 1.5mm — colorway Black, tamanho M.',
      '',
      'Calça térmica em neoprene 1.5mm — proteção das pernas inteiras. Ideal para combinar com uma jaqueta de neoprene formando um conjunto modular (top + calça) que substitui o Long John tradicional com flexibilidade muito maior.',
      '',
      'Por que escolher uma calça de neoprene?',
      '- Modularidade: combine com jaquetas diferentes conforme a temperatura',
      '- Mais fácil de vestir/tirar que um Long John inteiro',
      '- Ideal para SUP, kayak e outras modalidades náuticas',
      '- Útil para frio extremo combinada com Long John (calça extra)',
      '',
      DESC_BLOCKS.flexLine,
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Tamanho M — cintura 80-86cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // MAIÔ FEMININO 1.5mm
  // ════════════════════════════════════════════════════════════
  {
    sku: 'NK-MAIO-FEM-15-P',
    name: 'Maiô Feminino NeoKai 1.5mm Black P',
    productFamily: 'maio-feminino-neokai-1-5',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 599.0,
    gtin: '',
    weight: 280,
    supplierProductCode: 'NK-MAIO-FEM-15-P',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'maio',
    thickness: '1.5mm',
    gender: 'feminino',
    wetsuitLine: 'Hyper Lock',
    zipperType: '',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Maiô Feminino NeoKai 1.5mm — colorway Black, tamanho P.',
      '',
      'Maiô (vest) térmico feminino em neoprene 1.5mm com cortes anatômicos brasileiros. Excelente opção para usar naqueles dias em que um Short John é desnecessário mas a água um pouco mais fria ou um vento mais forte podem causar uma sensação desagradável. Perfeito para primavera e outono no Sudeste do Brasil.',
      '',
      'Quando usar?',
      '- Meia-estação (primavera/outono)',
      '- Sessões longas em água amena',
      '- Como base por baixo de jaqueta de neoprene',
      '- Estilo + proteção térmica leve',
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Tamanho P — busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // BERMUDA TÉRMICA
  // ════════════════════════════════════════════════════════════
  {
    sku: 'NK-BERMUDA-15-M',
    name: 'Bermuda Térmica NeoKai 1.5mm Black M',
    productFamily: 'bermuda-termica-neokai-1-5',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 399.0,
    gtin: '',
    weight: 320,
    supplierProductCode: 'NK-BERMUDA-15-M',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'bermuda',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'Flex',
    zipperType: '',
    origin: '0',
    ncm: '6112.31.00',
    description: [
      'Bermuda Térmica NeoKai 1.5mm — colorway Black, tamanho M.',
      '',
      'Bermuda térmica em neoprene 1.5mm — boardshort com proteção térmica para as coxas. Combine com uma jaqueta de neoprene para um setup modular em meia-estação, ou use por baixo de Long John para reforço térmico no inverno mais frio.',
      '',
      DESC_BLOCKS.flexLine,
      '',
      DESC_BLOCKS.brasileira,
      '',
      'Tamanho M — cintura 80-86cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER: Criar ou buscar fornecedor NeoKai
// ═══════════════════════════════════════════════════════════════

async function getOrCreateNeoKaiSupplier() {
  let supplier = await Supplier.findOne({ name: 'NeoKai Wetsuits' });

  if (!supplier) {
    console.log('✨ Criando fornecedor "NeoKai Wetsuits"...');
    // Tentamos criar apenas com os campos básicos.
    // Se o schema exigir mais campos required, podemos ajustar.
    supplier = await Supplier.create({
      name: 'NeoKai Wetsuits',
      slug: 'neokai-wetsuits',
      email: '',
      phone: '',
      cnpj: '',
      address: 'Santa Catarina, SC',
      notes:
        'Fabricante nacional brasileiro de wetsuits, localizada em Santa Catarina. Linhas: Skinlock (premium importado), Hyper Lock (premium importado), Flex (nacional). CNPJ a preencher.',
      isActive: true,
    } as Record<string, unknown>);
    console.log('✅ Fornecedor "NeoKai Wetsuits" criado\n');
    console.log(
      '⚠️  IMPORTANTE: Complete os dados do fornecedor em /admin/fornecedores',
    );
    console.log('   (CNPJ, telefone, email, endereço completo)\n');
  } else {
    console.log(`✅ Supplier: ${supplier.name}\n`);
  }

  return supplier;
}

// ═══════════════════════════════════════════════════════════════
// SEED
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log('🔌 Conectando ao MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Conectado\n');

  console.log('🔍 Verificando fornecedor NeoKai Wetsuits...');
  const supplier = await getOrCreateNeoKaiSupplier();

  console.log('🔍 Verificando marca NeoKai...');
  let brand = await Brand.findOne({ name: 'NeoKai' });
  if (!brand) {
    brand = await Brand.create({
      name: 'NeoKai',
      slug: 'neokai',
      description:
        'Marca brasileira de wetsuits fundada em Santa Catarina. Produz roupas de borracha de altíssima qualidade com preços acessíveis usando neoprene importado premium (linhas Skinlock e Hyper Lock) ou neoprene nacional (linha Flex). Assistência técnica própria no Brasil.',
      isActive: true,
    });
    console.log(`✨ Marca "NeoKai" criada\n`);
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
  const subAcessorios = await Category.findOne({
    slug: 'wetsuits-acessorios-neoprene',
    parent: category._id,
  });
  if (!subLongJohn || !subShortJohn || !subJaqueta || !subAcessorios) {
    console.error('❌ Subcategorias necessárias não encontradas.');
    process.exit(1);
  }
  console.log(`✅ Subcategorias OK\n`);

  const subcategoryMap: Record<string, mongoose.Types.ObjectId> = {
    'wetsuits-long-john': subLongJohn._id,
    'wetsuits-short-john': subShortJohn._id,
    'wetsuits-jaqueta-neoprene': subJaqueta._id,
    'wetsuits-acessorios-neoprene': subAcessorios._id,
  };

  if (WIPE_BEFORE_SEED) {
    console.log('⚠️  WIPE habilitado — apagando wetsuits NeoKai existentes...');
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
    `📦 Inserindo/atualizando ${PRODUCTS.length} produtos NeoKai...\n`,
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
      'neokai',
      'brasileira',
      'nacional',
      p.wetsuitLine.toLowerCase().replace(/\s+/g, '-'),
      p.thickness.replace('/', '-').replace('.', '-'),
      p.gender,
      p.color.toLowerCase().replace(/\s+/g, '-'),
    ].filter(t => t && t.length > 0);

    const isAccessory = ['maio', 'bermuda', 'calca'].includes(p.wetsuitType);

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
      dimensions: isAccessory
        ? { length: 35, width: 25, height: 4 }
        : {
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
  console.log('📊 RESUMO — NEOKAI (marca brasileira)');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total processado:  ${PRODUCTS.length}`);
  console.log(`✨ Criados:        ${created}`);
  console.log(`🔄 Atualizados:    ${updated}`);
  console.log(`📦 Famílias únicas: ${families.size}`);
  console.log(`💰 Valor total:    R$ ${totalValue.toLocaleString('pt-BR')}`);
  console.log('═══════════════════════════════════════════════════');

  console.log('');
  console.log('⚠️  GTIN PENDENTE: todos (NeoKai precisa de cadastro de EAN)');
  console.log('');
  console.log('🎉 SEEDS DE WETSUITS COMPLETOS!');
  console.log('');
  console.log('Total no catálogo (estimado):');
  console.log('   Rip Curl: 43 SKUs');
  console.log("   O'Neill: 10 SKUs");
  console.log('   Hurley: 8 SKUs');
  console.log('   Vissla: 8 SKUs');
  console.log('   NeoKai: 10 SKUs');
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   📦 TOTAL: 79 SKUs neoprene curados');
  console.log('');
  console.log('🎯 Próximos passos:');
  console.log('   1. Acessar /admin/fornecedores → completar CNPJ NeoKai');
  console.log('   2. Acessar /admin/produtos → enviar fotos dos 79 produtos');
  console.log('   3. Habilitar isPublishedOnline produto a produto após fotos');
  console.log('   4. Validar filtros em /categoria/wetsuits');
  console.log('');

  await mongoose.disconnect();
  console.log('🔌 Conexão encerrada.');
}

seed().catch(err => {
  console.error('❌ Erro:', err);
  mongoose.disconnect();
  process.exit(1);
});
