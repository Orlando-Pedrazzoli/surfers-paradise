/**
 * seed-quilhas-futures.ts
 *
 * Seed para inserir as 18 quilhas Futures Fins catalogadas no estoque físico
 * do Surfers Paradise (Moema). Baseado no padrão de seed-quilhas-fcs-ii.ts.
 *
 * Rodar com:
 *   npx tsx scripts/seed-quilhas-futures.ts
 *
 * Flags:
 *   WIPE_FUTURES_BEFORE_SEED = true → apaga TODOS os produtos da marca
 *                                     Futures Fins antes de inserir
 *                                     (use com cuidado, default = false)
 *
 * Campos preenchidos:
 *   ✅ sku, name, supplierProductCode
 *   ✅ description (descrição PT-BR técnica completa)
 *   ✅ price, costPrice (= price/2)
 *   ✅ gtin (EAN/UPC internacional Futures)
 *   ✅ weight (peso em gramas por tamanho/material)
 *   ✅ color, colorCode, colorCode2
 *   ✅ ncm, origin, dimensions, tags, productFamily, variantType, size
 *   ✅ isMainVariant, isFeatured, isActive, isAvailableInStore, isNewArrival
 *
 * Campos em branco (você completa depois):
 *   ⬜ images, thumbnail (anexar fotos via admin)
 *   ⬜ seoTitle, seoDescription (opcional)
 *
 * Pré-requisitos:
 *   ✓ Fornecedor "MAGIC SURF LTDA" cadastrado em /admin/fornecedores
 *   ✓ Categoria raiz "Quilhas" + subcategoria "Sistema Futures" via
 *     seed-categories.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import mongoose from 'mongoose';
import Product from '../src/lib/models/Product';
import Brand from '../src/lib/models/Brand';
import Category from '../src/lib/models/Category';
import Supplier from '../src/lib/models/Supplier';

// ═══════════════════════════════════════════════════════════════
// FLAGS
// ═══════════════════════════════════════════════════════════════

const WIPE_FUTURES_BEFORE_SEED = false; // ⚠️ true = apaga TODOS produtos Futures

// ═══════════════════════════════════════════════════════════════
// ENV
// ═══════════════════════════════════════════════════════════════

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não definido no .env.local');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeName(name: string): string {
  name = name.replace(/\s+/g, ' ').trim();
  const keepUpper = new Set([
    'FCS',
    'JJF',
    'AM1',
    'AM2',
    'HS1',
    'HS2',
    'CI',
    'MR',
    'AM',
    'WT',
    'JW',
    'JJ',
    'PC',
    'PCC',
    'PG',
    'NG',
    'NC',
    'CC',
    'BK',
    'GF',
    'GM',
    'KA',
    'MB',
    'MF',
    'RP',
    'SE',
    'SF',
    'FT',
    'II',
    'III',
    'XL',
    'XS',
    'SM',
    'MD',
    'LG',
    'ML',
    'G10',
    'G-10',
    'JJ',
    'RTM',
    'V2',
    'IFT',
    'WSL',
    'EAN',
    'UPC',
    'SKU',
  ]);
  const keepLower = new Set([
    'de',
    'da',
    'do',
    'das',
    'dos',
    'e',
    'em',
    'a',
    'o',
    'para',
    'com',
    'sem',
    'no',
    'na',
  ]);
  return name
    .split(' ')
    .map((word, i) => {
      if (/[+/-]/.test(word) && /^[A-Za-z\d+/-]+$/.test(word))
        return word.toUpperCase();
      if (/\d/.test(word))
        return word.toUpperCase().match(/^[A-Z\d+/-]+$/)
          ? word.toUpperCase()
          : word;
      if (keepUpper.has(word.toUpperCase())) return word.toUpperCase();
      if (i > 0 && keepLower.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// ═══════════════════════════════════════════════════════════════
// DESCRIÇÕES REUTILIZÁVEIS POR CONSTRUÇÃO/TEMPLATE
// ═══════════════════════════════════════════════════════════════

const DESC_BLOCKS = {
  // ─── Templates ───
  neutral: `Template Neutral: Balanceado e Versátil
Geometria all-around da Futures — equilíbrio entre drive, hold e liberdade. O template Neutral é o mais versátil da linha, adapta-se a uma ampla variedade de pranchas e condições.`,

  pivot: `Template Pivot: Turns Apertados
Template mais vertical com menos sweep. Favorece pivot rápido, mudanças de direção ágeis e release fácil no tail. Ideal para surfistas que querem responsividade máxima.`,

  rake: `Template Rake (Drawn-out): Drive Sustentado
Template alongado com sweep elevado. Entrega drive consistente na saída do bottom, hold no rail e arcos longos. A escolha clássica para power surfers.`,

  // ─── Construções ───
  alpha: `Material: Alpha (NetPlus + C6)
Construção sustentável da Futures que usa redes de pesca recicladas (NetPlus) combinadas com nylon biobased. Material leve, durável e com flex pattern balanceado. Recuperação rápida sem perder responsividade. Ride Number tipicamente 5-6 (Balanced).`,

  honeycomb: `Material: Honeycomb (HC)
Núcleo alveolar hexagonal exposto que reduz peso mantendo flex pattern progressivo. Mais rígido que o Blackstix, mais flexível que fiberglass. Ideal para uma ampla variedade de condições — equilíbrio perfeito entre resposta e controle. Flex pattern médio.`,

  techflex: `Material: Techflex
Construção tubo-de-carbono que combina núcleo Honeycomb com camada de tecido de carbono 3K. Resposta rápida e controle excepcional em ondas potentes. Stiffer layup com retorno de flex preciso — preferida por power surfers profissionais para ondas críticas.`,

  blackstix: `Material: Blackstix
Construção precisão carbono + matriz de fiberglass + resina epóxi de alta resposta. A construção mais leve da Futures — flex pattern dinâmico tipo "spring-loaded". O V2 Foil interno gera e mantém velocidade em todas as condições. Resina epóxi emite 50-75% menos VOCs que poliéster. Ride Number alto (Speed Generating 8-10).`,

  blackstixPlus: `Material: Blackstix+ (próxima geração)
Evolução do Blackstix tradicional com layup MAIS RÍGIDO. Mantém os foils 100% engajados durante toda a curva — mais drive, hold e spring back sem sacrificar a transição fluida rail-to-rail. Resposta explosiva e precisa. Combinação premium absoluta.`,

  vaporCore: `Material: Vapor Core
Construção hand-made em Huntington Beach com núcleo oco (hollow core) — o que torna a quilha extremamente leve mantendo rigidez estrutural. Resposta ultra-rápida com peso reduzido. Topo de linha Futures USA.`,

  controlSeries: `Material: Control Series (Fiberglass + Uni-Carbon)
Upgrade da linha Fiberglass tradicional da Futures. Fiberglass sólido + camada estratégica de tiras de carbono unidirecional (uni-carbon). Recuperação de memória ultra-rápida com mais dinamismo de resposta. Stiff e durável — escolha de power surfers e veteranos do North Shore.`,

  g10: `Material: G-10 Fiberglass
Resina fenólica + fibra de vidro estratificada compactadas em altíssima pressão. O material mais rígido e durável usado pela Futures, padrão da indústria para quilhas de big wave. Suporta as forças extremas de Jaws, Mavericks, Eddie Aikau e Nazaré sem deformar.`,

  generationSeries: `Material: Generation Series
Construção exclusiva combinando carbono unidirecional vertical + fibra de vidro unidirecional. Disposição estratificada permite flex pattern customizado de acordo com cada template. Resposta precisa e drive consistente. Construção premium top-tier.`,

  legacySeries: `Material: Legacy Series
Construção em honeycomb com construção atualizada da geração clássica. Mantém o flex pattern equilibrado que tornou as quilhas clássicas da Futures famosas, agora com construção moderna mais consistente.`,

  // ─── Foils & Tecnologias ───
  v2Foil: `Tecnologia: V2 Foil
Foil interno proprietário da Futures presente nos Blackstix. Gera e mantém velocidade ao longo dos turns, mantendo o sweet spot mesmo em ondas softer. Acelera em condições fracas e segura em ondas potentes.`,

  vectorFoil: `Tecnologia: Vector Foil
Foil proprietário com superfície CÔNCAVA no lado interno das quilhas frontais. Aumenta área de superfície, water attachment e lift — gera mais velocidade quando a quilha está engajada na curva.`,

  vector32: `Tecnologia: 3/2 (Vector 3/2)
Complementa o Vector Foil com 3° adicionais de cant e 2° de toe — introduz um "twist" no foil para melhorar o ângulo de planagem em curvas fechadas. Cria lift e hold mais profundo no maneuver.`,

  scimitarTip: `Tecnologia: Scimitar Tip
Ponta achatada no trailing edge da quilha (desenvolvida em 2006). Reduz o comprimento template para fechar o arco da curva, mantendo as propriedades de lift e velocidade do foil. Feeling de release pronunciado na saída de cada turn.`,

  // ─── Compatibilidade ───
  encaixe: `Atenção: Este sistema de encaixe é exclusivo para o sistema Futures Fins (single-tab) e não serve em copinhos FCS original (twin-tab) ou FCS II.`,
};

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface SeedFin {
  sku: string;
  name: string;
  productFamily: string;
  size: string;
  setup: 'Thruster' | 'Quad' | 'Quad Rear' | 'Twin' | 'Twin+1' | '5-Fin';
  isMainVariant: boolean;
  isFeatured: boolean;
  price: number;
  gtin: string; // EAN ou vazio se não confirmado
  weight: number; // gramas
  color: string;
  colorCode: string;
  colorCode2?: string;
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS DE PREÇO (BRL)
// Posicionamento baseado nas faixas Futures:
//   - Alpha entry            → ~R$ 650
//   - Honeycomb mid          → ~R$ 1.100
//   - Legacy Series          → ~R$ 1.300
//   - Techflex / Generation  → ~R$ 1.400-1.500
//   - Vapor Core             → ~R$ 1.700
//   - Blackstix / Blackstix+ → ~R$ 1.800-2.000
//   - Quad Rear (par)        → ~R$ 750
//   - G-10 Big Wave Quad Set → ~R$ 2.500
// ═══════════════════════════════════════════════════════════════

const PRICE_ALPHA = 650;
const PRICE_HONEYCOMB = 1100;
const PRICE_LEGACY = 1300;
const PRICE_TECHFLEX = 1400;
const PRICE_VAPOR_CORE = 1700;
const PRICE_BLACKSTIX = 1800;
const PRICE_BLACKSTIX_PLUS = 2000;
const PRICE_CONTROL_SERIES = 1500;
const PRICE_QUAD_REAR_PAIR = 750;
const PRICE_QUAD_SET_BIG_WAVE = 2500;
const PRICE_GENERATION = 1500;

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO COMPLETO — 18 QUILHAS FUTURES FINS
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedFin[] = [
  // ════════════════════════════════════════════════════════════
  // #1 — JJF Alpha (M) Thruster Carbon/Green
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JJF-ALP-M-CGR',
    name: 'Quilha Futures JJF Alpha Thruster Medium Carbon/Green',
    productFamily: 'quilha-futures-jjf-alpha',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_ALPHA,
    gtin: '815681024258',
    weight: 140,
    color: 'Carbon/Green',
    colorCode: '#1F2937',
    colorCode2: '#10B981',
    description: [
      'Quilha Futures JJF (John John Florence) Alpha Thruster Medium — colorway Carbon/Green.',
      '',
      'Quilha-assinatura do bicampeão (e atualmente tricampeão) mundial John John Florence em construção Alpha sustentável. Template Neutral com foil C6 — equilíbrio ideal entre velocidade, drive e responsividade. A quilha que JJF usa para todos os tipos de onda.',
      '',
      'Athlete Series — John John Florence',
      'John John Florence é um dos surfistas mais técnicos e versáteis da história. Suas conquistas mundiais (2016, 2017, 2024) foram alcançadas com o template Alpha JJF.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral balanceado (Balanced 5.9)',
      '- Foil C6 (interior foil performance)',
      '- Construção Alpha NetPlus + C6 (sustentável)',
      '- Speed Generating moderado — versátil em todas as condições',
      '- Cor: Carbon Black + detalhes em Verde',
      '',
      DESC_BLOCKS.alpha,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 14.98 / Height 4.56 / Base 4.45',
      '- Center Fin: Area 14.98 / Height 4.45 / Base 4.56',
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #2 — R4 Legacy Series Small Thruster Teal/Black
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-R4-LEG-S-TBK',
    name: 'Quilha Futures R4 Legacy Series Thruster Small Teal/Black',
    productFamily: 'quilha-futures-r4-legacy-series',
    size: 'S',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_LEGACY,
    gtin: '815681023381',
    weight: 130,
    color: 'Teal/Black',
    colorCode: '#0D9488',
    colorCode2: '#000000',
    description: [
      'Quilha Futures R4 Legacy Series Thruster Small — colorway Teal/Black.',
      '',
      'Template Rake clássico da linha Legacy Series — atualizado com construção honeycomb moderna mantendo o flex equilibrado que tornou a R4 famosa. Ideal para surfistas leves que querem drive consistente com controle.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Foil Flat (laterais) + Symmetrical (central)',
      '- Construção Legacy Series (honeycomb)',
      '- Balanced 5.4',
      '- Cor: Teal (azul-petróleo) + Black',
      '',
      DESC_BLOCKS.legacySeries,
      '',
      'Especificações Técnicas',
      '- Side & Center Fins: Area 14.22 / Height 4.42 / Base 4.42',
      '- Foil: FLAT / SYMM',
      '',
      'Tamanho: Small (recomendado para surfistas 105-155 lbs / 48-70 kg)',
      '',
      'Manufacturer Model: 1136-159-00',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #3 — AM1 Alpha (M) Thruster — Hexagon (versão anterior)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-AM1-ALP-M-HEX',
    name: 'Quilha Futures AM1 Alpha Thruster Medium Hexagon',
    productFamily: 'quilha-futures-am1-alpha',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_ALPHA,
    gtin: '815681024258',
    weight: 140,
    color: 'Carbon Hexagon',
    colorCode: '#1F2937',
    colorCode2: '#6B7280',
    description: [
      'Quilha Futures AM1 (Al Merrick / Channel Islands) Alpha Thruster Medium — colorway Carbon Hexagon (versão anterior da embalagem).',
      '',
      'Quilha-assinatura do lendário shaper Al Merrick, fundador da Channel Islands. Template Rake drawn-out desenhado para complementar os modelos icônicos da CI. Versão "Hexagon" — design clássico de embalagem com padrões hexagonais.',
      '',
      'Shaper Series — Al Merrick (Channel Islands)',
      'Al Merrick é o maior nome do shaping moderno. Pranchas CI equipam Kelly Slater, Tom Curren, Dane Reynolds, Conner Coffin, Lakey Peterson.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Foil Flat (laterais) + Symmetrical (central)',
      '- Construção Alpha NetPlus + C6 (sustentável)',
      '- Balanced 6.2',
      '- Versão clássica com gráfico hexagonal',
      '',
      DESC_BLOCKS.alpha,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 14.84 / Height 4.50 / Base 4.50',
      '- Center Fin: Area 13.35 / Height 4.29 / Base 4.31',
      '- Foil: FLAT / SYMM',
      '',
      'Tamanho: Medium (recomendado para surfistas 145-195 lbs / 65-88 kg na faixa de peso da embalagem original; faixa atual: 125-175 lbs)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #4 — AM1 Alpha (M) Thruster — Stripes (versão atual)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-AM1-ALP-M-STR',
    name: 'Quilha Futures AM1 Alpha Thruster Medium Stripes',
    productFamily: 'quilha-futures-am1-alpha',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: false,
    isFeatured: false,
    price: PRICE_ALPHA,
    gtin: '815681024258',
    weight: 140,
    color: 'Carbon Stripes',
    colorCode: '#1F2937',
    colorCode2: '#F3F4F6',
    description: [
      'Quilha Futures AM1 (Al Merrick / Channel Islands) Alpha Thruster Medium — colorway Carbon Stripes (versão atual da embalagem).',
      '',
      'Quilha-assinatura do lendário shaper Al Merrick em construção Alpha sustentável. Versão atual com gráfico de listras verticais — mesmo template AM1, embalagem moderna.',
      '',
      'Shaper Series — Al Merrick (Channel Islands)',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Foil Flat (laterais) + Symmetrical (central)',
      '- Construção Alpha NetPlus + C6 (sustentável)',
      '- Balanced 6.2',
      '- Versão atual com gráfico de listras verticais',
      '',
      DESC_BLOCKS.alpha,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 14.84 / Height 4.50 / Base 4.50',
      '- Center Fin: Area 13.35 / Height 4.29 / Base 4.31',
      '- Foil: FLAT / SYMM',
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #5 — Vector 3/2 Alpha Thruster (M) Carbon/Gold
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-VEC32-ALP-M-CGD',
    name: 'Quilha Futures Vector 3/2 Alpha Thruster Medium Carbon/Gold',
    productFamily: 'quilha-futures-vector-32-alpha',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_ALPHA,
    gtin: '815681025958',
    weight: 140,
    color: 'Carbon/Gold',
    colorCode: '#1F2937',
    colorCode2: '#D4AF37',
    description: [
      'Quilha Futures Vector 3/2 Alpha Thruster Medium — colorway Carbon/Gold (carbono marmorizado com detalhes dourados).',
      '',
      'A revolução de tecnologia de foil da Futures em construção Alpha sustentável. Combina o Vector Foil (côncavo) + 3°/2° twist + Scimitar Tip para máxima velocidade e lift em todos os tipos de onda.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral all-around',
      '- Vector Foil + 3°cant + 2°toe twist',
      '- Scimitar Tip para arcos fechados',
      '- Construção Alpha NetPlus + C6 (sustentável)',
      '- Speed Generating',
      '- Cor: Carbon Black com detalhes dourados',
      '',
      DESC_BLOCKS.alpha,
      '',
      DESC_BLOCKS.vectorFoil,
      '',
      DESC_BLOCKS.vector32,
      '',
      DESC_BLOCKS.scimitarTip,
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Manufacturer Model: 1402-345-00',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #6 — Sharp Eye Thruster (M) Honeycomb Black/White
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-SE-HC-M-BKW',
    name: 'Quilha Futures Sharp Eye Honeycomb Thruster Medium Black/White',
    productFamily: 'quilha-futures-sharp-eye-honeycomb',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_HONEYCOMB,
    gtin: '815681025125',
    weight: 145,
    color: 'Black/White',
    colorCode: '#000000',
    colorCode2: '#FFFFFF',
    description: [
      'Quilha Futures Sharp Eye Honeycomb Thruster Medium — colorway Black/White.',
      '',
      'Quilha-assinatura de Marcio Zouvi, fundador da Sharp Eye Surfboards. Template Neutral em construção Honeycomb — equilíbrio ideal entre drive consistente e responsividade explosiva.',
      '',
      'Shaper Series — Marcio Zouvi / Sharp Eye Surfboards',
      'Sharp Eye é uma das marcas mais hot do mundo, com modelos como Storms 77, Disco, Modern 2 surfados por campeões mundiais como Filipe Toledo e Kanoa Igarashi.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral balanceado',
      '- Construção Honeycomb (núcleo alveolar)',
      '- Balanced 6.1',
      '- Drive forte + responsividade',
      '- Cor: Black/White',
      '',
      DESC_BLOCKS.honeycomb,
      '',
      'Especificações Técnicas',
      '- Side & Center Fins: Area 14.86 / Height 4.51 / Base 4.44',
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Manufacturer Model: 1067-104-00',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #7 — Jordy Signature (M) Honeycomb White/Red (atual)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JOR-HC-M-WRD',
    name: 'Quilha Futures Jordy Signature Honeycomb Thruster Medium White/Red',
    productFamily: 'quilha-futures-jordy-signature-honeycomb',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_HONEYCOMB,
    gtin: '',
    weight: 145,
    color: 'White/Red',
    colorCode: '#FFFFFF',
    colorCode2: '#DC2626',
    description: [
      'Quilha Futures Jordy Signature Honeycomb Thruster Medium — colorway White/Red (versão atual).',
      '',
      'Quilha-assinatura do sul-africano Jordy Smith, um dos maiores power surfers do CT. Template Rake desenhado para drive máximo e arcos longos no rail — combina perfeitamente com o estilo agressivo e potente do Jordy.',
      '',
      'Athlete Series — Jordy Smith',
      'Jordy Smith é referência mundial em power surfing, múltiplas vezes vice-campeão mundial e referência absoluta em ondas grandes e parede aberta.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Construção Honeycomb (núcleo alveolar)',
      '- Balanced 4.8 (USA) / 5.7 (UK)',
      '- Drive máximo para power surfers',
      '- Cor: White/Red (versão atual da embalagem)',
      '',
      DESC_BLOCKS.honeycomb,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 14.50 / Height 4.47 / Base 4.44',
      '- Center Fin: Area 13.50 / Height 4.22 / Base 4.29',
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Manufacturer Model: 1045-124-00',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #8 — Jordy Signature (M) Vintage Honeycomb (sem 100% certeza no EAN)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JOR-HC-M-VINT',
    name: 'Quilha Futures Jordy Signature Honeycomb Thruster Medium Vintage Gradient',
    productFamily: 'quilha-futures-jordy-signature-honeycomb',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: false,
    isFeatured: false,
    price: PRICE_HONEYCOMB,
    gtin: '', // ⚠️ EAN não confirmado com 100% certeza — preencher manualmente
    weight: 145,
    color: 'Gradient Yellow/Orange/Red',
    colorCode: '#FBBF24',
    colorCode2: '#DC2626',
    description: [
      'Quilha Futures Jordy Signature Honeycomb Thruster Medium — colorway Vintage Gradient (gradiente amarelo → laranja → vermelho).',
      '',
      'Versão vintage descontinuada da quilha-assinatura de Jordy Smith. Mesmo template Rake icônico, agora com gráfico vintage de gradiente quente — peça de coleção para fãs do Jordy e da identidade visual clássica da Futures.',
      '',
      'Athlete Series — Jordy Smith (versão vintage)',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Construção Honeycomb (núcleo alveolar)',
      '- Drive máximo para power surfers',
      '- Cor: Gradient Yellow/Orange/Red (vintage)',
      '- ⚠️ Versão descontinuada — última oportunidade',
      '',
      DESC_BLOCKS.honeycomb,
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #9 — JJF Vapor Core Scimitar (M) Thruster
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JJF-VC-M-BCB',
    name: 'Quilha Futures JJF Vapor Core Scimitar Thruster Medium Black Carbon',
    productFamily: 'quilha-futures-jjf-vapor-core-scimitar',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_VAPOR_CORE,
    gtin: '',
    weight: 110,
    color: 'Black Carbon',
    colorCode: '#000000',
    colorCode2: '#1F2937',
    description: [
      'Quilha Futures JJF (John John Florence) Vapor Core Scimitar Thruster Medium — colorway Black Carbon (holográfico).',
      '',
      'Topo de linha da Futures — construção Vapor Core hand-made em Huntington Beach (California) com núcleo OCO que torna a quilha ultraleve mantendo rigidez. Combinada com o Vector Foil + Scimitar Tip — a quilha mais rápida e responsiva do catálogo JJF.',
      '',
      'Athlete Series — John John Florence (top tier)',
      'Esta é a quilha que JJF usa em ondas premium do CT — Pipeline, Teahupoo, J-Bay. Construção limitada hand-made.',
      '',
      DESC_BLOCKS.pivot,
      '',
      'Características Principais',
      '- Template Pivot (turns apertados / quick)',
      '- Vapor Core (núcleo oco hand-made HB)',
      '- Vector Foil + Scimitar Tip',
      '- Speed Generating',
      '- Cor: Black Carbon (embalagem holográfica)',
      '',
      DESC_BLOCKS.vaporCore,
      '',
      DESC_BLOCKS.vectorFoil,
      '',
      DESC_BLOCKS.scimitarTip,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 14.45 / Height 4.45 / Base 4.40',
      '- Center Fin: Area 14.21 / Height 4.40 / Base 4.40',
      '- Foil: VECTOR / SYMM',
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Manufacturer Model: 1410-603-00',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #10 — Mayhem | M Thruster Yellow/Blue (RTM Hex)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-MAY-RTM-M-YBL',
    name: 'Quilha Futures Mayhem RTM Hex Thruster Medium Yellow/Blue',
    productFamily: 'quilha-futures-mayhem-rtm',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_HONEYCOMB,
    gtin: '815681023756',
    weight: 145,
    color: 'Yellow/Blue',
    colorCode: '#FBBF24',
    colorCode2: '#1E40AF',
    description: [
      'Quilha Futures Mayhem RTM Hex Thruster Medium — colorway Yellow/Blue (versão signature).',
      '',
      'Quilha-assinatura de Matt "Mayhem" Biolos, fundador da ...Lost Surfboards. Construção RTM Hex — honeycomb com camada de carbono na base + honeycomb no tip — combinação balanceada de drive sólido e soltura no pocket.',
      '',
      'Shaper Series — Matt "Mayhem" Biolos (...Lost Surfboards)',
      'Matt Biolos é um dos shapers mais inovadores do surfe moderno. Suas pranchas equipam Mason Ho, Yago Dora e Caroline Marks.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral balanceado',
      '- Construção RTM Hex (Honeycomb + Carbon base + Honeycomb tip)',
      '- Drive sólido + soltura no pocket',
      '- Cor: Yellow/Blue (signature ...Lost)',
      '- ⚠️ Versão descontinuada (substituída pela Mayhem 3.0)',
      '',
      DESC_BLOCKS.honeycomb,
      '',
      'Especificações Técnicas',
      '- Side & Center Fins: Area 14.78 / Height 4.50 / Base 4.44',
      '- Foil: FLAT / 50-50',
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #11 — Rob Machado Blackstix 3.0 (M) Bamboo/Grey
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-RM-BSX-M-BGR',
    name: 'Quilha Futures Rob Machado Blackstix 3.0 Thruster Medium Bamboo/Grey',
    productFamily: 'quilha-futures-rob-machado-blackstix',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_BLACKSTIX,
    gtin: '815681022940',
    weight: 110,
    color: 'Bamboo/Grey',
    colorCode: '#A07855',
    colorCode2: '#6B7280',
    description: [
      'Quilha Futures Rob Machado Blackstix 3.0 Thruster Medium — colorway Bamboo/Grey (bambu natural com detalhes cinza).',
      '',
      'Quilha-assinatura do lendário Rob Machado em construção Blackstix 3.0 — combinação premium de carbono + camada de bambu natural + V2 Foil + resina epóxi. Speed Generating de alto nível (Ride Number 9.8) — uma das quilhas mais responsivas da linha Futures.',
      '',
      'Athlete Series — Rob Machado',
      'Rob Machado é um dos surfistas mais estilísticos da história. Sua quilha-assinatura prioriza fluidez, flow e geração de velocidade em ondas softer.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out)',
      '- Construção Blackstix 3.0 + camada de bambu',
      '- V2 Foil interno',
      '- Speed Generating 9.8 (Ride Number)',
      '- Resina epóxi (50-75% menos VOCs)',
      '- Cor: Bamboo natural com Grey',
      '',
      DESC_BLOCKS.blackstix,
      '',
      DESC_BLOCKS.v2Foil,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 15.23 / Height 4.57 / Base 4.45',
      '- Center Fin: Area 14.24 / Height 4.41 / Base 4.31',
      '- Foil: V2 / SYMM',
      '',
      'Tamanho: Medium (recomendado para surfistas 145-195 lbs / 65-88 kg)',
      '',
      'Manufacturer MPN: 450044900',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #12 — HS2 Generation Series (M) Thruster Black Carbon
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-HS2-GEN-M-BCB',
    name: 'Quilha Futures HS2 Generation Series Thruster Medium Black Carbon',
    productFamily: 'quilha-futures-hs2-generation-series',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_GENERATION,
    gtin: '815681020076',
    weight: 130,
    color: 'Black Carbon',
    colorCode: '#000000',
    colorCode2: '#1F2937',
    description: [
      'Quilha Futures HS2 Generation Series Thruster Medium — colorway Black Carbon.',
      '',
      'Quilha-assinatura de Hayden Cox, fundador da Haydenshapes. Construção Generation Series exclusiva — carbono unidirecional vertical + fibra de vidro unidirecional — com V2 Foil. Speed Generating 8.3-9.1 — combinação topo de linha para drive forte + manobrabilidade fluida.',
      '',
      'Shaper Series — Hayden Cox / Haydenshapes',
      'Hayden Cox revolucionou o design de pranchas com a Hypto Krypto, all-rounder mais vendido da última década. A quilha HS2 traduz o DNA da marca em foil precise.',
      '',
      DESC_BLOCKS.pivot,
      '',
      'Características Principais',
      '- Template Pivot',
      '- Construção Generation Series (uni-carbon vertical + uni-glass)',
      '- V2 Foil interno',
      '- Speed Generating 8.3-9.1 (Ride Number)',
      '- Ideal para shortboards modernos e hybrids',
      '- Cor: Black Carbon',
      '',
      DESC_BLOCKS.generationSeries,
      '',
      DESC_BLOCKS.v2Foil,
      '',
      'Tamanho: Medium (recomendado para surfistas 145-195 lbs / 65-88 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #13 — JJF Techflex (M) Thruster Digi Yellow
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JJF-TFX-M-DYL',
    name: 'Quilha Futures JJF Techflex Thruster Medium Digi Yellow',
    productFamily: 'quilha-futures-jjf-techflex',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_TECHFLEX,
    gtin: '815681026412',
    weight: 145,
    color: 'Digi Yellow',
    colorCode: '#FBBF24',
    colorCode2: '#000000',
    description: [
      'Quilha Futures JJF (John John Florence) Techflex Thruster Medium — colorway Digi Yellow (amarelo camuflado).',
      '',
      'A quilha que John John Florence usou para conquistar seus 3 títulos mundiais. Construção Techflex — núcleo Honeycomb + camada de carbono 3K — combinação de leveza, drive e controle excepcional em ondas críticas. Speed Control 3.4-3.7.',
      '',
      'Athlete Series — John John Florence (3x World Champion)',
      '⭐ Esta é a construção e template que JJF usa em ondas premium do CT mundial.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral all-around',
      '- Construção Techflex (Honeycomb core + Carbon 3K)',
      '- Speed Control 3.4-3.7 (Ride Number)',
      '- Drive sólido + controle preciso',
      '- Cor: Digi Yellow (amarelo camuflado)',
      '',
      DESC_BLOCKS.techflex,
      '',
      'Especificações Técnicas',
      '- Side & Center Fins: Area 14.98 / Height 4.56 / Base 4.45',
      '- Foil: FLAT / SYMM',
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #14 — AM1 Techflex (M) Thruster Blue/Cyan
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-AM1-TFX-M-BCY',
    name: 'Quilha Futures AM1 Techflex Thruster Medium Blue/Cyan',
    productFamily: 'quilha-futures-am1-techflex',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_TECHFLEX,
    gtin: '815681022841',
    weight: 145,
    color: 'Blue/Cyan',
    colorCode: '#1E40AF',
    colorCode2: '#06B6D4',
    description: [
      'Quilha Futures AM1 (Al Merrick / Channel Islands) Techflex Thruster Medium — colorway Blue/Cyan.',
      '',
      'Versão premium da quilha-assinatura AM1 em construção Techflex — núcleo Honeycomb + camada de carbono 3K. Drive máximo + controle preciso em ondas potentes para os modelos icônicos da Channel Islands.',
      '',
      'Shaper Series — Al Merrick (Channel Islands)',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Construção Techflex (Honeycomb + Carbon 3K)',
      '- Speed Control 4.0 (Ride Number)',
      '- Foil Flat (laterais) + Symmetrical (central)',
      '- Cor: Blue/Cyan',
      '',
      DESC_BLOCKS.techflex,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 14.84 / Height 4.50 / Base 4.50',
      '- Center Fin: Area 13.35 / Height 4.29 / Base 4.31',
      '- Foil: FLAT / SYMM',
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Manufacturer Model: 5510-443-00',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #15 — Vector 3/2 Blackstix+ Thruster (M) Gold
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-VEC32-BSX-M-GLD',
    name: 'Quilha Futures Vector 3/2 Blackstix+ Thruster Medium Gold',
    productFamily: 'quilha-futures-vector-32-blackstix-plus',
    size: 'M',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_BLACKSTIX_PLUS,
    gtin: '815681026351',
    weight: 110,
    color: 'Gold',
    colorCode: '#000000',
    colorCode2: '#D4AF37',
    description: [
      'Quilha Futures Vector 3/2 Blackstix+ Thruster Medium — colorway Gold (carbono preto com detalhes dourados).',
      '',
      'A NOVA ERA da Vector 3/2 — construção Blackstix+ com layup MAIS RÍGIDO que mantém os foils 3/2 totalmente engajados durante toda a curva. Mais drive, hold e spring back sem sacrificar a transição fluida rail-to-rail. NEW RELEASE.',
      '',
      'Premium Performance Series',
      '⭐ A próxima evolução da Vector 3/2 — versão topo de linha 2024/2025.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral all-around',
      '- Vector Foil + 3°cant + 2°toe twist',
      '- Scimitar Tip',
      '- Construção Blackstix+ (layup stiffer)',
      '- Speed Generating (10-7)',
      '- Cor: Gold (carbono + detalhes dourados)',
      '- ⭐ NEW RELEASE — premium top tier',
      '',
      DESC_BLOCKS.blackstixPlus,
      '',
      DESC_BLOCKS.vectorFoil,
      '',
      DESC_BLOCKS.vector32,
      '',
      DESC_BLOCKS.scimitarTip,
      '',
      'Tamanho: Medium (recomendado para surfistas 125-175 lbs / 55-80 kg)',
      '',
      'Manufacturer Model: 1402-474-00',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #16 — Neutral Quad Rears Small (par) Grey
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-QR-NEU-HC-S',
    name: 'Quilha Futures QD2 3.75 Honeycomb Neutral Quad Rear Small (Par)',
    productFamily: 'quilha-futures-qd2-honeycomb-quad-rear',
    size: 'S',
    setup: 'Quad Rear',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_QUAD_REAR_PAIR,
    gtin: '815681024647',
    weight: 90,
    color: 'Grey',
    colorCode: '#6B7280',
    colorCode2: '',
    description: [
      'Par de quilhas traseiras Futures QD2 3.75 Honeycomb Neutral Quad Rear — tamanho Small.',
      '',
      'Par de quilhas traseiras (left + right) para CONVERTER um set Thruster em setup Quad. Pode ser combinado com qualquer quilha frontal Futures para criar a configuração ideal para sua prancha e estilo. Template Neutral com Foil 80/20 — equilíbrio perfeito entre resposta e controle.',
      '',
      'Função Especial',
      '⚠️ Esta NÃO é um set completo — é apenas o par de quilhas traseiras. Você precisa ter as quilhas frontais Futures separadamente para montar o setup Quad completo (4 quilhas).',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Par de Quad Rears (2 quilhas — esquerda + direita)',
      '- Template Neutral balanceado',
      '- Foil 80/20 (resposta + controle)',
      '- Construção Honeycomb',
      '- Compatível com shallow depth fin boxes Futures',
      '- Cor: Grey (honeycomb natural)',
      '',
      DESC_BLOCKS.honeycomb,
      '',
      'Especificações Técnicas (cada quilha)',
      '- Area 10.73 / Height 3.76 / Base 3.71',
      '- Foil: 80/20',
      '',
      'Tamanho: Small (recomendado para surfistas 95-135 lbs / 45-60 kg)',
      '',
      'Embalagem contém 1 par de quilhas traseiras (2 unidades — Quad Rear).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #17 — JJF Big Wave Quad (set 4 quilhas) Red G-10
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JJF-BW-G10-L-RED',
    name: 'Set Futures JJF Big Wave Quad G-10 Large Red',
    productFamily: 'quilha-futures-jjf-big-wave-quad',
    size: 'L',
    setup: 'Quad',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_QUAD_SET_BIG_WAVE,
    gtin: '815681025118',
    weight: 280,
    color: 'Red',
    colorCode: '#DC2626',
    colorCode2: '',
    description: [
      'Set Futures JJF (John John Florence) Big Wave Quad G-10 Large — colorway Red.',
      '',
      'Set completo de 4 quilhas Quad para BIG WAVE — assinatura do bicampeão mundial John John Florence. Design único e INVERTIDO criado pelo próprio JJF: laterais frontais MENORES (geram velocidade) + traseiras MAIORES (controle e hold). Construção G-10 fiberglass — padrão big wave para suportar Jaws, Mavericks, Eddie Aikau e Nazaré.',
      '',
      'Athlete Series — John John Florence (BIG WAVE TOP TIER)',
      '⭐ Testada por JJF como runner-up na Eddie Aikau 2023. Esta é a quilha para os momentos mais críticos do surfe — quando ondas gigantes exigem stability máxima.',
      '',
      DESC_BLOCKS.pivot,
      '',
      'Características Principais',
      '- Set Quad COMPLETO (4 quilhas)',
      '- Design INVERTIDO (laterais frontais menores + traseiras maiores)',
      '- Template Pivot (tight turns / quick)',
      '- Construção G-10 fiberglass (padrão big wave)',
      '- Foil 80/20 nas frontais + Symmetrical nas traseiras',
      '- Speed Control — 2.2 (Ride Number)',
      '- Cor: Red icônica',
      '',
      DESC_BLOCKS.g10,
      '',
      'Especificações Técnicas',
      '- Side Fins (frontais): Area 9.49 / Height 3.25 / Base 4.36 / Angle 4.0° / Foil 80/20',
      '- Rear Fins (traseiras): Area 11.69 / Height 3.63 / Base 3.87 / Angle 2.0° / Foil SYMM',
      '',
      'Condições Ideais',
      'BIG WAVE exclusivamente — Jaws, Mavericks, Eddie Aikau, Nazaré, Itacoatiara em swells gigantes. Para tow-in e paddle em ondas overhead muito grandes.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      'Embalagem contém 1 set completo com 4 quilhas (Quad: 2 frontais + 2 traseiras).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #18 — Pancho Control Series Large Thruster Aina (Green)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-PAN-CS-L-AIN',
    name: 'Quilha Futures Pancho Control Series Thruster Large Aina',
    productFamily: 'quilha-futures-pancho-control-series',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_CONTROL_SERIES,
    gtin: '815681023909',
    weight: 165,
    color: 'Aina (Green)',
    colorCode: '#84CC16',
    colorCode2: '',
    description: [
      'Quilha Futures Pancho Control Series Thruster Large — colorway Aina (verde-limão translúcido).',
      '',
      'Quilha-assinatura de Pancho Sullivan, lendário power surfer do North Shore (Havaí). A MAIOR quilha thruster da linha Futures — feita para os "big boys", surfistas pesados e potentes. Template Neutral full-bodied com tip espesso para sustentar as cravadas de rail signature do Pancho.',
      '',
      'Athlete Series — Pancho Sullivan (North Shore Powerhouse)',
      'Pancho Sullivan é referência absoluta em power surfing no Havaí. Esta quilha foi desenvolvida especificamente para surfistas potentes e pesados que querem stability máxima e drive incomparável.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral full-bodied (corpo cheio com tip espesso)',
      '- Construção Control Series (Fiberglass + Uni-Carbon)',
      '- Speed Control 4-1 (Ride Number — sólido, engajado, previsível)',
      '- A MAIOR quilha thruster da Futures',
      '- Ideal para reef breaks e ondas potentes',
      '- Cor: Aina (verde-limão translúcido — palavra havaiana para "terra")',
      '',
      DESC_BLOCKS.controlSeries,
      '',
      'Condições Ideais',
      'Todos os tipos de onda — do reef break ao beach break potente. Performance máxima em ondas com força e tamanho.',
      '',
      'Tamanho: Large/XL (recomendado para surfistas 180+ lbs / 80+ kg — público "big boy")',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
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

  // ─── Supplier ──────────────────────────────────────────────
  console.log('🔍 Procurando fornecedor MAGIC SURF LTDA...');
  const supplier = await Supplier.findOne({ name: 'MAGIC SURF LTDA' });
  if (!supplier) {
    console.error('❌ Fornecedor MAGIC SURF LTDA não encontrado.');
    console.error('   Cadastre primeiro em /admin/fornecedores');
    process.exit(1);
  }
  console.log(`✅ Supplier: ${supplier.name}\n`);

  // ─── Brand ─────────────────────────────────────────────────
  console.log('🔍 Verificando marca Futures Fins...');
  let brand = await Brand.findOne({ name: 'Futures Fins' });
  if (!brand) {
    brand = await Brand.create({
      name: 'Futures Fins',
      slug: 'futures-fins',
      isActive: true,
    });
    console.log(`✨ Marca "Futures Fins" criada\n`);
  } else {
    console.log(`✅ Brand: ${brand.name}\n`);
  }

  // ─── Category (raiz) ───────────────────────────────────────
  console.log('🔍 Procurando categoria Quilhas...');
  const category = await Category.findOne({ slug: 'quilhas', level: 0 });
  if (!category) {
    console.error(
      '❌ Categoria Quilhas não encontrada. Rode seed-categories.ts primeiro.',
    );
    process.exit(1);
  }
  console.log(`✅ Category: ${category.name}\n`);

  // ─── Subcategory: Sistema Futures ──────────────────────────
  console.log('🔍 Procurando subcategoria Sistema Futures...');
  const subcategory = await Category.findOne({
    slug: 'quilhas-sistema-futures',
    parent: category._id,
  });
  if (!subcategory) {
    console.error('❌ Subcategoria "Sistema Futures" não encontrada.');
    console.error('   Rode seed-categories.ts primeiro.');
    process.exit(1);
  }
  console.log(`✅ Subcategory: ${subcategory.name}\n`);

  // ─── WIPE (opcional) ───────────────────────────────────────
  if (WIPE_FUTURES_BEFORE_SEED) {
    console.log('⚠️  WIPE_FUTURES_BEFORE_SEED = true');
    console.log(`🗑️  Apagando todos produtos da marca Futures Fins...`);
    const wipeResult = await Product.deleteMany({ brand: brand._id });
    console.log(
      `🗑️  ${wipeResult.deletedCount} produto(s) Futures apagado(s)\n`,
    );
  }

  // ─── Validação: SKUs duplicados ────────────────────────────
  const skuSet = new Set<string>();
  const duplicates: string[] = [];
  for (const p of PRODUCTS) {
    if (skuSet.has(p.sku)) duplicates.push(p.sku);
    skuSet.add(p.sku);
  }
  if (duplicates.length > 0) {
    console.error('❌ SKUs duplicados:');
    duplicates.forEach(s => console.error(`   ${s}`));
    process.exit(1);
  }

  // ─── Validação: 1 isMainVariant por família ────────────────
  const familyMainCount = new Map<string, number>();
  for (const p of PRODUCTS) {
    if (p.isMainVariant) {
      familyMainCount.set(
        p.productFamily,
        (familyMainCount.get(p.productFamily) || 0) + 1,
      );
    }
  }
  for (const [family, count] of familyMainCount) {
    if (count > 1)
      console.warn(`⚠️  Família ${family} tem ${count} mainVariants`);
  }

  // ─── Inserção ──────────────────────────────────────────────
  console.log(`📦 Inserindo ${PRODUCTS.length} quilhas Futures Fins...\n`);

  let created = 0;
  let skipped = 0;
  const errors: { sku: string; error: string }[] = [];

  for (const p of PRODUCTS) {
    try {
      const existing = await Product.findOne({ sku: p.sku });
      if (existing) {
        console.log(`⏭️  ${p.sku} já existe — pulando`);
        skipped++;
        continue;
      }

      const normalizedName = normalizeName(p.name);
      const slug = generateSlug(normalizedName) + '-' + generateSlug(p.sku);
      const costPrice = +(p.price / 2).toFixed(2);

      // Tags por setup
      const setupTag = generateSlug(p.setup);
      const tags = ['quilha', 'futures', 'futures-fins', 'surf', setupTag];

      await Product.create({
        name: normalizedName,
        slug,
        sku: p.sku,
        description: p.description,
        richDescription: '',
        price: p.price,
        costPrice,
        compareAtPrice: 0,
        category: category._id,
        subcategory: subcategory._id,
        brand: brand._id,
        supplier: supplier._id,
        supplierProductCode: p.sku,
        stock: 1,
        weight: p.weight,
        dimensions: { length: 20, width: 15, height: 3 },
        images: [],
        thumbnail: '',
        tags,
        gtin: p.gtin,
        ncm: '9506.29.00',
        origin: '2',
        cest: '',
        productFamily: p.productFamily,
        variantType: 'size',
        color: p.color,
        colorCode: p.colorCode,
        colorCode2: p.colorCode2 || '',
        size: p.size,
        isMainVariant: p.isMainVariant,
        isActive: true,
        isAvailableInStore: true,
        isPublishedOnline: false,
        isFeatured: p.isFeatured,
        isNewArrival: true,
        isOnSale: false,
        salePercentage: 0,
        seoTitle: '',
        seoDescription: '',
      });

      const star = p.isFeatured ? '⭐' : '  ';
      const main = p.isMainVariant ? '🏠' : '  ';
      const priceStr = `R$ ${p.price.toFixed(2)}`.padStart(11);
      console.log(
        `✅ ${star} ${main} ${p.sku.padEnd(25)} ${priceStr}  ${normalizedName}`,
      );
      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${p.sku} — ${msg}`);
      errors.push({ sku: p.sku, error: msg });
    }
  }

  // ─── Resumo ────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log(`📦 Total no array:  ${PRODUCTS.length}`);
  console.log(`✅ Criados:         ${created}`);
  console.log(`⏭️  Pulados:         ${skipped}`);
  console.log(`❌ Erros:           ${errors.length}`);
  if (errors.length) {
    console.log('\nDetalhes:');
    errors.forEach(e => console.log(`  ${e.sku}: ${e.error}`));
  }

  const familyCount = new Map<string, number>();
  for (const p of PRODUCTS) {
    familyCount.set(
      p.productFamily,
      (familyCount.get(p.productFamily) || 0) + 1,
    );
  }
  console.log(`\n📊 Total de famílias: ${familyCount.size}`);

  const setupCount = new Map<string, number>();
  for (const p of PRODUCTS) {
    setupCount.set(p.setup, (setupCount.get(p.setup) || 0) + 1);
  }
  console.log(`\n📋 Distribuição por setup:`);
  for (const [setup, count] of setupCount) {
    console.log(`   ${setup.padEnd(12)} ${count}`);
  }

  const totalRevenue = PRODUCTS.reduce((sum, p) => sum + p.price, 0);
  console.log(
    `\n💰 Valor total do estoque (preço de venda): R$ ${totalRevenue.toFixed(2)}`,
  );
  console.log(
    `💵 Valor total do custo estimado (preço/2): R$ ${(totalRevenue / 2).toFixed(2)}`,
  );

  // Avisos sobre GTINs faltantes
  const noGtin = PRODUCTS.filter(p => !p.gtin);
  if (noGtin.length > 0) {
    console.log(
      `\n⚠️  ${noGtin.length} produto(s) sem GTIN/EAN — preencher manualmente no admin:`,
    );
    noGtin.forEach(p => console.log(`   ${p.sku} — ${p.name}`));
  }

  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Desconectado');
  process.exit(0);
}

seed().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});
