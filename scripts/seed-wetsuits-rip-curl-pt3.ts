/**
 * seed-wetsuits-rip-curl-pt3.ts
 *
 * Seed PARTE 3 — Rip Curl Jaquetas + Lycras + Acessórios Neoprene
 *
 * Esta parte fecha a marca Rip Curl no catálogo. Cobre 14 SKUs:
 *   - 7 Jaquetas de neoprene (E-Bomb, Flashbomb, Omega, DWP, Hurley Camisa Fem)
 *   - 2 Lycras / Camisas térmicas
 *   - 5 Acessórios neoprene (3 Botinhas, 1 Luva, 1 Gorro)
 *
 * Rodar com:
 *   npx tsx scripts/seed-wetsuits-rip-curl-pt3.ts
 *
 * Pré-requisitos:
 *   ✓ MAGIC SURF LTDA + categoria Wetsuits + subcategorias prontas
 *   ✓ Rip Curl criada (pt1)
 *
 * Após pt1 + pt2 + pt3 → 44 SKUs Rip Curl no total
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
  neopreneE5: `Neoprene E5 — Equilíbrio Custo-Benefício
Construção em Neoprene E5 com excelente combinação de durabilidade, flexibilidade e preço. Material confiável para uso intenso.`,

  neopreneE6: `Neoprene E6 — Performance Comprovada
Construção em Neoprene E6 super stretch — 20% mais elástico e 15% mais quente que o E5. Padrão de alto desempenho.`,

  flashLining: `Forro Flash Lining
Tecnologia exclusiva Rip Curl com forro interno que acelera drasticamente a evaporação da água, mantendo o calor corporal. Resultado: secagem ultra-rápida e proteção térmica superior.`,

  thermoLining: `Forro Thermo Lining
Revestimento térmico interno que retém o calor corporal e reduz a sensação de frio. Tecido macio em contato com a pele.`,

  cuidados: `Cuidados com seu Produto
• Sempre seque à sombra (sol direto degrada o neoprene).
• Lave apenas com água doce após cada uso.
• Não use sabão, sabonete ou solventes.
• Para jaquetas/camisas: seque dobrada ao meio, nunca pendurada pelos ombros.`,

  garantia: `Garantia Rip Curl
A Rip Curl possui assistência técnica própria no Brasil para reparos em produtos de neoprene. Consulte detalhes sobre garantia no tag do produto.`,
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
    | 'wetsuits-jaqueta-neoprene'
    | 'wetsuits-lycra-neolycra'
    | 'wetsuits-acessorios-neoprene';
  wetsuitType:
    | 'jaqueta'
    | 'lycra'
    | 'botinha'
    | 'luva'
    | 'gorro'
    | 'capacete'
    | 'meia'
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
// CATÁLOGO PARTE 3 — 14 SKUs
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedWetsuit[] = [
  // ════════════════════════════════════════════════════════════
  // JAQUETAS DE NEOPRENE (7 SKUs)
  // ════════════════════════════════════════════════════════════

  // E-Bomb Jaqueta L/SL 1.5mm (Masculina premium)
  {
    sku: 'RC-EBOMB-JKT-15-LSL-BLK',
    name: 'Jaqueta Neoprene Rip Curl E-Bomb L/SL 1.5mm Black',
    productFamily: 'jaqueta-neoprene-rip-curl-e-bomb-l-sl-1-5',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 1299.99,
    gtin: '7908938356653',
    weight: 350,
    supplierProductCode: '12HMWJ00900090M',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'zip-free',
    origin: '1',
    ncm: '6112.41.00',
    description: [
      'Jaqueta de Neoprene Rip Curl E-Bomb Long Sleeve 1.5mm — colorway Black, tamanho M.',
      '',
      'A jaqueta premium da linha E-Bomb — Neoprene E6 super stretch com 1.5mm de espessura. Ideal para usar SOZINHA em água amena (20-24°C) ou POR BAIXO de um Long John em água fria para reforço térmico no torso. Sistema Zip Free para máxima vedação e mobilidade.',
      '',
      'Quando usar?',
      '- Como peça única em meia-estação (SP/RJ verão fresco)',
      '- Como camada extra de calor por baixo do Long John no inverno SC/PR',
      '- Em sessões longas onde o torso fica exposto ao vento',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      'Tamanho M — recomendado para altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // E-Bomb Jaqueta 1.5mm (variação)
  {
    sku: 'RC-EBOMB-JKT-15-4129-M',
    name: 'Jaqueta Neoprene Rip Curl E-Bomb 1.5mm Black M',
    productFamily: 'jaqueta-neoprene-rip-curl-e-bomb-1-5',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1199.99,
    gtin: '7908782955477',
    weight: 320,
    supplierProductCode: '121MWJ142142M',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'back-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Jaqueta de Neoprene Rip Curl E-Bomb 1.5mm — colorway Black, tamanho M.',
      '',
      'Versão nacional da jaqueta E-Bomb com Neoprene E6 super stretch. Mesmo material de alta performance da linha E-Bomb, agora em forma de jaqueta para uso versátil. Sistema Back Zip facilita vestir e tirar.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      'Tamanho M — recomendado para altura 1,73-1,78m e peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Flashbomb Jaqueta L/SL c/ Lycra
  {
    sku: 'RC-FB-JKT-NEO-POLY-LSL',
    name: 'Jaqueta Neoprene Rip Curl Flashbomb Neo Poly L/SL Black',
    productFamily: 'jaqueta-neoprene-rip-curl-flashbomb-neo-poly',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 799.99,
    gtin: '7908938326137',
    weight: 250,
    supplierProductCode: 'WVEYNM00900090P',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1mm',
    gender: 'unissex',
    wetsuitLine: 'Flashbomb',
    zipperType: '',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Jaqueta Neoprene Rip Curl Flashbomb Neo Poly Long Sleeve — colorway Black, tamanho P.',
      '',
      'Jaqueta híbrida da linha Flashbomb que combina neoprene com poliéster (Neo Poly) — alta secagem rápida do Flash Lining com leveza superior. Perfeita para usar como camada extra em treinos longos ou como peça única em água amena.',
      '',
      'Características',
      '- Construção Neo Poly (neoprene + poliéster)',
      '- Forro Flash Lining (secagem rápida exclusiva Rip Curl)',
      '- Painel de neoprene 1mm no peito + tecido stretch no resto',
      '- Acabamento sem zíper (pull-on)',
      '- Unissex',
      '',
      DESC_BLOCKS.flashLining,
      '',
      'Tamanho P — pull-on, fit ajustado padrão Rip Curl.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Flashbomb Jaqueta c/ Lycra (variação 2735)
  {
    sku: 'RC-FB-JKT-LYCRA-2735',
    name: 'Jaqueta Neoprene Rip Curl Flashbomb com Lycra Black',
    productFamily: 'jaqueta-neoprene-rip-curl-flashbomb-lycra',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 699.0,
    gtin: '7908782977462',
    weight: 250,
    supplierProductCode: 'WVEYNM9090P',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1mm',
    gender: 'unissex',
    wetsuitLine: 'Flashbomb',
    zipperType: '',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Jaqueta Neoprene Rip Curl Flashbomb com Lycra — colorway Black, tamanho P.',
      '',
      'Versão alternativa da Flashbomb Neo Poly — combina painéis de neoprene 1mm com lycra. Excelente proteção térmica leve, perfeita para verão fresco ou para usar por baixo de outro wetsuit.',
      '',
      DESC_BLOCKS.flashLining,
      '',
      'Tamanho P — pull-on, fit ajustado.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Omega Jaqueta L/SL
  {
    sku: 'RC-OMEGA-JKT-LSL-M',
    name: 'Jaqueta Neoprene Rip Curl Omega L/SL Black M',
    productFamily: 'jaqueta-neoprene-rip-curl-omega-l-sl',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 899.99,
    gtin: '7908938325277',
    weight: 300,
    supplierProductCode: '123MWJ00900090M',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'Omega',
    zipperType: 'back-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Jaqueta Neoprene Rip Curl Omega Long Sleeve — colorway Black, tamanho M.',
      '',
      'Jaqueta da linha Omega — equilíbrio entre performance e preço. Neoprene E5 com sistema Back Zip facilitando vestir e tirar. Ideal para meia-estação ou para reforço térmico no inverno.',
      '',
      DESC_BLOCKS.neopreneE5,
      '',
      `Sistema Back Zip — Zíper nas Costas\nZíper longitudinal para facilidade de vestir e tirar.`,
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // DWP Jaqueta 1.5mm
  {
    sku: 'RC-DWP-JKT-15-4147',
    name: 'Jaqueta Neoprene Rip Curl Dawn Patrol 1.5mm Black M',
    productFamily: 'jaqueta-neoprene-rip-curl-dawn-patrol-1-5',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 999.9,
    gtin: '',
    weight: 300,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1.5mm',
    gender: 'masculino',
    wetsuitLine: 'Dawn Patrol',
    zipperType: 'back-zip',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Jaqueta Neoprene Rip Curl Dawn Patrol 1.5mm — colorway Black, tamanho M.',
      '',
      'Jaqueta da icônica linha Dawn Patrol — a melhor relação custo-benefício do catálogo Rip Curl. Neoprene E5 confiável para uso intenso, sistema Back Zip para praticidade. Ideal para iniciantes ou como segunda jaqueta.',
      '',
      DESC_BLOCKS.neopreneE5,
      '',
      `Linha Dawn Patrol\nO Dawn Patrol é um dos modelos mais vendidos da Rip Curl no mundo todo. Combina durabilidade, conforto e preço justo — o ponto de entrada perfeito no universo dos wetsuits Rip Curl.`,
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Jaqueta Regata Rip Curl
  {
    sku: 'RC-JKT-REGATA',
    name: 'Jaqueta Neoprene Regata Rip Curl Black M',
    productFamily: 'jaqueta-neoprene-rip-curl-regata',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 699.9,
    gtin: '',
    weight: 200,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-jaqueta-neoprene',
    wetsuitType: 'jaqueta',
    thickness: '1mm',
    gender: 'masculino',
    wetsuitLine: 'Dawn Patrol',
    zipperType: '',
    origin: '0',
    ncm: '6112.41.00',
    description: [
      'Jaqueta Neoprene Regata Rip Curl — colorway Black, tamanho M.',
      '',
      'Jaqueta sem mangas (regata) em neoprene 1mm — máxima mobilidade dos braços com proteção térmica no torso. Ideal para complementar uma roupa de borracha em dias amenos ou usar sozinha em água quente quando precisa de proteção apenas no peito/costas.',
      '',
      'Tamanho M — altura 1,73-1,78m, peso 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // LYCRAS / CAMISAS TÉRMICAS (2 SKUs)
  // ════════════════════════════════════════════════════════════

  // Camisa c/ Lycra Tropical
  {
    sku: 'RC-LYCRA-TROPICAL',
    name: 'Camisa Térmica Rip Curl com Lycra Tropical',
    productFamily: 'camisa-termica-rip-curl-lycra-tropical',
    size: 'M',
    color: 'Tropical',
    colorCode: '#0EA5E9',
    colorCode2: '#0F172A',
    isMainVariant: true,
    isFeatured: false,
    price: 129.0,
    gtin: '',
    weight: 150,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-lycra-neolycra',
    wetsuitType: 'lycra',
    thickness: '',
    gender: 'unissex',
    wetsuitLine: 'Dawn Patrol',
    zipperType: '',
    origin: '0',
    ncm: '6109.10.00',
    description: [
      'Camisa Térmica Rip Curl com Lycra estampa Tropical — tamanho M.',
      '',
      'Camisa térmica em tecido lycra com proteção UV (UPF 50+). Ideal para uso no calor — protege do sol, evita queimaduras pelo atrito da prancha e oferece leve proteção térmica em água amena.',
      '',
      'Quando usar?',
      '- Surfe em águas tropicais (acima de 24°C)',
      '- Proteção solar durante sessões longas',
      '- Por baixo de wetsuit para evitar irritação na pele',
      '- Treino físico, SUP, kayak',
      '',
      'Tamanho M — altura 1,68-1,75m.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Lycra Feminina 1mm Hurley (estava no CSV mas é genericamente uma lycra)
  // Mantendo Hurley como marca aqui requer importar Hurley brand
  // Por simplicidade, removendo do pt3 e deixando para o seed da Hurley
  // ↑ Removido para evitar dependência cruzada com seed da Hurley

  // ════════════════════════════════════════════════════════════
  // ACESSÓRIOS NEOPRENE — BOTINHAS (3 SKUs)
  // ════════════════════════════════════════════════════════════

  // Botinha Flashbomb 3mm Hidden Split Toe (premium)
  {
    sku: 'RC-BOOT-FB-3MM-HID-41',
    name: 'Botinha Rip Curl Flashbomb 3mm Hidden Split Toe Black 41',
    productFamily: 'botinha-rip-curl-flashbomb-3mm-hidden-split-toe',
    size: '41',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 699.99,
    gtin: '7908782977752',
    weight: 400,
    supplierProductCode: 'WBO1HF909041',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'botinha',
    thickness: '3mm',
    gender: 'unissex',
    wetsuitLine: 'Flashbomb',
    zipperType: '',
    origin: '1',
    ncm: '6402.99.00',
    description: [
      'Botinha Rip Curl Flashbomb 3mm Hidden Split Toe — colorway Black, tamanho 41.',
      '',
      'A botinha premium da Rip Curl para água fria. Construção com Forro Flash Lining (secagem rápida) em todo o interior, sola super fina de 0.6mm de borracha para sensibilidade na prancha, e design Hidden Split Toe — o dedão fica separado mas internamente (sem aparecer externamente), oferecendo controle superior sem comprometer a estética.',
      '',
      'Características Premium',
      '- Forro E5 Flash Lining em todo o interior',
      '- Sola super fina (0.6mm) para máximo board feel',
      '- Design Hidden Split Toe (dedão separado internamente)',
      '- Sistema slide-on (sem zíper)',
      '- Tiras de tornozelo e pé para fixação ajustável',
      '- Tratamento anti-mau-cheiro',
      '- Costuras seladas',
      '- Textura de aderência na sola',
      '',
      DESC_BLOCKS.flashLining,
      '',
      'Quando usar?',
      'Espessura 3mm ideal para água fria (12-17°C) — inverno em Santa Catarina, Rio Grande do Sul, ou viagens para Califórnia, Europa e Peru.',
      '',
      'Tamanho 41 — calce europeu padrão.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // Botinha Reefer 1.5mm Split Toe (água quente)
  {
    sku: 'RC-BOOT-REEFER-15-ST-38',
    name: 'Botinha Rip Curl Reefer 1.5mm Split Toe Black/Charcoal 38',
    productFamily: 'botinha-rip-curl-reefer-1-5-split-toe',
    size: '38',
    color: 'Black/Charcoal',
    colorCode: '#000000',
    colorCode2: '#374151',
    isMainVariant: true,
    isFeatured: false,
    price: 499.99,
    gtin: '7908782977608',
    weight: 250,
    supplierProductCode: 'WBO1AT5001500138',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'botinha',
    thickness: '1.5mm',
    gender: 'unissex',
    wetsuitLine: 'Dawn Patrol',
    zipperType: '',
    origin: '1',
    ncm: '6402.99.00',
    description: [
      'Botinha Rip Curl Reefer 1.5mm Split Toe — colorway Black/Charcoal, tamanho 38.',
      '',
      'A botinha de água quente/tropical da Rip Curl — feita para você surfar em recifes (reefs) sem superaquecer os pés. Combinação de neoprene 1.5mm com painéis de tela (mesh) que permite fluxo de água, evitando que o pé fique abafado em água acima de 20°C.',
      '',
      'Características',
      '- Painéis em mesh para fluxo de água',
      '- Sola protetora de recife',
      '- Fechamento por compressão (barrel lock)',
      '- Alça traseira para vestir facilmente',
      '- Design Split Toe (dedão separado externamente)',
      '',
      'Quando usar?',
      'Espessura 1.5mm ideal para água quente/tropical (acima de 22°C). Perfeita para Nordeste do Brasil, ilhas tropicais, Indonésia, México. Não é para proteção térmica — é para proteção contra cortes em recifes e ouriços.',
      '',
      'Tamanho 38 — calce europeu padrão.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Botinha Pocket Reef 1mm (dobrável)
  {
    sku: 'RC-BOOT-POCKET-REEF-1MM',
    name: 'Botinha Rip Curl Pocket Reef 1mm Black 39',
    productFamily: 'botinha-rip-curl-pocket-reef-1mm',
    size: '39',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 379.99,
    gtin: '7908938326038',
    weight: 150,
    supplierProductCode: 'WBOXBT009000909',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'botinha',
    thickness: '1mm',
    gender: 'unissex',
    wetsuitLine: 'Dawn Patrol',
    zipperType: '',
    origin: '1',
    ncm: '6402.99.00',
    description: [
      'Botinha Rip Curl Pocket Reef 1mm Split Toe — colorway Black, tamanho 39.',
      '',
      'A botinha mais leve e portátil do catálogo Rip Curl — dobra e cabe NO BOLSO da sua bermuda. Projetada exclusivamente para atravessar recifes, corais e pedras na ida e na volta da sessão. Composição 80% Neoprene + 20% Polyamide com sola protetora de recife.',
      '',
      'Características',
      '- Sola protetora de recife (0.5mm)',
      '- Fechamento elástico ajustável',
      '- Dobrável — cabe no bolso',
      '- Design Split Toe',
      '- Peso ultraleve',
      '',
      'Quando usar?',
      'Essencial para picos tropicais com entrada/saída em recife (Indonésia, México, Nordeste do Brasil em pontos como Maracaípe, Praia da Pipa). Não oferece proteção térmica — é puramente para proteção contra cortes.',
      '',
      'Tamanho 39 — calce europeu padrão.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // ACESSÓRIOS NEOPRENE — LUVAS, GORROS (2 SKUs)
  // ════════════════════════════════════════════════════════════

  // Luva E-Bomb 2mm
  {
    sku: 'RC-GLOVE-EBOMB-2MM-M',
    name: 'Luva Rip Curl E-Bomb 2mm 5-Finger Black M',
    productFamily: 'luva-rip-curl-e-bomb-2mm-5-finger',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 499.99,
    gtin: '7908938364658',
    weight: 150,
    supplierProductCode: 'WGL5SE00900090M',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'luva',
    thickness: '2mm',
    gender: 'unissex',
    wetsuitLine: 'E-Bomb',
    zipperType: '',
    origin: '1',
    ncm: '6116.10.00',
    description: [
      'Luva Rip Curl E-Bomb 2mm 5-Finger — colorway Black, tamanho M.',
      '',
      'Luva de neoprene da linha E-Bomb com design 5-Finger (todos os dedos separados) — máxima destreza para segurar a prancha, fechar o leash e fazer manobras. Neoprene E6 super stretch para mobilidade total dos dedos.',
      '',
      'Características',
      '- Design 5-Finger (todos os dedos separados)',
      '- Neoprene E6 super stretch',
      '- Pulso ajustável',
      '- Palma com textura para grip',
      '- Costuras GBS (Glued and Blind Stitched)',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      'Quando usar?',
      'Espessura 2mm ideal para água fria (12-17°C). Inverno em SC/RS ou viagens para Califórnia, Europa.',
      '',
      'Tamanho M — circunferência da mão 21-23cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Gorro E-Bomb 2mm
  {
    sku: 'RC-HOOD-EBOMB-2MM-M',
    name: 'Gorro Rip Curl E-Bomb 2mm GB Black M',
    productFamily: 'gorro-rip-curl-e-bomb-2mm-gb',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 399.99,
    gtin: '7908782977790',
    weight: 120,
    supplierProductCode: 'WHOOAE9090M',
    subcategorySlug: 'wetsuits-acessorios-neoprene',
    wetsuitType: 'gorro',
    thickness: '2mm',
    gender: 'unissex',
    wetsuitLine: 'E-Bomb',
    zipperType: '',
    origin: '1',
    ncm: '6505.00.20',
    description: [
      'Gorro Rip Curl E-Bomb 2mm GB — colorway Black, tamanho M.',
      '',
      'Gorro (hood) de neoprene da linha E-Bomb. O ser humano perde até 30% do calor corporal pela cabeça — em água fria, um gorro é essencial para sessões longas. Construção em Neoprene E6 com costuras GBS (Glued and Blind Stitched) para vedação superior.',
      '',
      'Características',
      '- Neoprene E6 super stretch',
      '- Costuras GBS (coladas e cegas)',
      '- Bib (aba que vai por dentro do wetsuit no pescoço)',
      '- Furos na orelha para audição',
      '- Espessura 2mm — equilíbrio entre calor e mobilidade',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      'Quando usar?',
      'Espessura 2mm ideal para água fria (12-17°C). Combine com luvas E-Bomb 2mm para sessões completas em inverno SC/RS.',
      '',
      'Tamanho M — circunferência da cabeça 56-58cm.',
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

  console.log('🔍 Verificando marca Rip Curl...');
  const brand = await Brand.findOne({ name: 'Rip Curl' });
  if (!brand) {
    console.error('❌ Marca Rip Curl não encontrada. Rode pt1 primeiro.');
    process.exit(1);
  }
  console.log(`✅ Brand: ${brand.name}\n`);

  console.log('🔍 Procurando categoria Wetsuits...');
  const category = await Category.findOne({ slug: 'wetsuits', level: 0 });
  if (!category) {
    console.error('❌ Categoria Wetsuits não encontrada.');
    process.exit(1);
  }
  console.log(`✅ Category: ${category.name}\n`);

  // ─── Subcategorias (3) ─────────────────────────────────────
  console.log('🔍 Buscando subcategorias...');
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
  if (!subJaqueta || !subLycra || !subAcessorios) {
    console.error('❌ Subcategorias necessárias não encontradas:');
    if (!subJaqueta) console.error('   - wetsuits-jaqueta-neoprene');
    if (!subLycra) console.error('   - wetsuits-lycra-neolycra');
    if (!subAcessorios) console.error('   - wetsuits-acessorios-neoprene');
    process.exit(1);
  }
  console.log(`✅ Jaqueta: ${subJaqueta.name}`);
  console.log(`✅ Lycra: ${subLycra.name}`);
  console.log(`✅ Acessórios: ${subAcessorios.name}\n`);

  const subcategoryMap: Record<string, mongoose.Types.ObjectId> = {
    'wetsuits-jaqueta-neoprene': subJaqueta._id,
    'wetsuits-lycra-neolycra': subLycra._id,
    'wetsuits-acessorios-neoprene': subAcessorios._id,
  };

  if (WIPE_BEFORE_SEED) {
    console.log(
      '⚠️  WIPE habilitado — apagando wetsuits Rip Curl existentes...',
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

  // Validação: conflito com pt1/pt2
  console.log('🔍 Verificando conflitos com pt1/pt2...');
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
    `📦 Inserindo/atualizando ${PRODUCTS.length} produtos Rip Curl (pt3)...\n`,
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
      'rip-curl',
      p.wetsuitLine.toLowerCase().replace(/\s+/g, '-'),
      p.thickness.replace('/', '-').replace('.', '-'),
      p.gender,
      p.color.toLowerCase().replace(/\s+/g, '-').replace('/', '-'),
    ].filter(t => t && t.length > 0);

    const isAccessory = [
      'botinha',
      'luva',
      'gorro',
      'meia',
      'capacete',
    ].includes(p.wetsuitType);

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
        ? { length: 25, width: 18, height: 8 } // botinha/luva/gorro
        : { length: 35, width: 25, height: 4 }, // jaqueta/lycra
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
  console.log('📊 RESUMO PARTE 3 — JAQUETAS + LYCRAS + ACESSÓRIOS');
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
  console.log('🎉 RIP CURL COMPLETO no catálogo!');
  console.log(
    '   pt1 (14) + pt2 (16) + pt3 (' +
      PRODUCTS.length +
      ') = ' +
      (14 + 16 + PRODUCTS.length) +
      ' SKUs Rip Curl',
  );
  console.log('');
  console.log('🎯 Próximo: seed-wetsuits-oneill.ts (Hyperfreak — 10 SKUs)');
  console.log('');

  await mongoose.disconnect();
  console.log('🔌 Conexão encerrada.');
}

seed().catch(err => {
  console.error('❌ Erro:', err);
  mongoose.disconnect();
  process.exit(1);
});
