/**
 * seed-quilhas-futures-pt2.ts
 *
 * Seed PARTE 2 para inserir as 16 quilhas Futures Fins ADICIONAIS catalogadas
 * no estoque físico do Surfers Paradise (Moema). Continuação direta do
 * seed-quilhas-futures.ts (parte 1 com 18 quilhas).
 *
 * Total Futures após pt1 + pt2: 18 + 16 = 34 quilhas
 *
 * Rodar com:
 *   npx tsx scripts/seed-quilhas-futures-pt2.ts
 *
 * Flags:
 *   WIPE_FUTURES_BEFORE_SEED = false (padrão — NÃO apagar a parte 1)
 *
 * Campos preenchidos:
 *   ✅ sku, name, supplierProductCode
 *   ✅ description (descrição PT-BR técnica completa)
 *   ✅ price, costPrice (= price/2)
 *   ✅ gtin (EAN/UPC internacional Futures — VAZIO se não confirmado 100%)
 *   ✅ weight (peso em gramas por tamanho/material)
 *   ✅ color, colorCode, colorCode2
 *   ✅ ncm, origin, dimensions, tags, productFamily, variantType, size
 *   ✅ isMainVariant, isFeatured, isActive, isAvailableInStore, isNewArrival
 *
 * Campos em branco (você completa depois):
 *   ⬜ images, thumbnail (anexar fotos via admin)
 *   ⬜ seoTitle, seoDescription (opcional)
 *
 * Pendências GTIN (preencher manualmente após escaneamento do código de barras):
 *   ⚠️ FUT-JJF-TFX-L-BKR  (JJF Techflex Large Black/Red — JJ-2 versão antiga)
 *   ⚠️ FUT-AM2-TFX-L-BKY  (AM2 Techflex Large Black/Yellow Hexagons)
 *
 * Pré-requisitos:
 *   ✓ Fornecedor "MAGIC SURF LTDA" cadastrado em /admin/fornecedores
 *   ✓ Categoria raiz "Quilhas" + subcategoria "Sistema Futures" via
 *     seed-categories.ts
 *   ✓ Marca "Futures Fins" criada (rodando o seed parte 1 primeiro)
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
// ⚠️ NÃO ative — vai apagar a parte 1!

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
    'EE',
    'DHD',
    'JR',
    'GP',
    'EU',
    'TC',
    'USA',
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
// (Mesmas do seed parte 1 — mantidas idênticas para consistência)
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

  fiberglassSolid: `Material: Fiberglass Sólido
Construção em fiberglass sólido tradicional — pattern de flex consistente, oferecendo stability e controle em ondas potentes. Material clássico de quilhas competitivas que mantém memória de flex sem perder resposta. Preferido por surfistas que valorizam feel sólido e previsível.`,

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
//   - Honeycomb premium (HC) → ~R$ 1.200
//   - Legacy Series          → ~R$ 1.300
//   - Techflex / Generation  → ~R$ 1.400-1.500
//   - Vapor Core             → ~R$ 1.700-1.800
//   - Blackstix / Blackstix+ → ~R$ 1.800-2.000
//   - Quad Rear (par)        → ~R$ 750
//   - G-10 Big Wave Quad Set → ~R$ 2.500
// ═══════════════════════════════════════════════════════════════

const PRICE_ALPHA = 650;
const PRICE_ALPHA_5FIN = 900;
const PRICE_HONEYCOMB = 1100;
const PRICE_HONEYCOMB_PREMIUM = 1200;
const PRICE_LEGACY = 1300;
const PRICE_TECHFLEX = 1400;
const PRICE_TECHFLEX_PREMIUM = 1500;
const PRICE_TECHFLEX_TOP = 1700;
const PRICE_VAPOR_CORE = 1700;
const PRICE_VAPOR_CORE_LIMITED = 1800;
const PRICE_BLACKSTIX = 1800;
const PRICE_BLACKSTIX_PLUS = 2000;
const PRICE_CONTROL_SERIES = 1500;
const PRICE_QUAD_REAR_PAIR = 750;
const PRICE_QUAD_SET_BIG_WAVE = 2500;
const PRICE_GENERATION = 1500;

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO PARTE 2 — 16 QUILHAS FUTURES FINS (#19 a #34)
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedFin[] = [
  // ════════════════════════════════════════════════════════════
  // #19 — Vector 3/2 Alpha 5-Fin Large Carbon/Silver
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-VEC32-ALP-L-CSI-5F',
    name: 'Set Futures Vector 3/2 Alpha 5-Fin Large Carbon/Silver',
    productFamily: 'quilha-futures-vector-3-2-alpha-5fin',
    size: 'L',
    setup: '5-Fin',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_ALPHA_5FIN,
    gtin: '815681026160',
    weight: 200,
    color: 'Carbon/Silver',
    colorCode: '#1F2937',
    colorCode2: '#C0C0C0',
    description: [
      'Set Futures Vector 3/2 Alpha 5-Fin Large — colorway Carbon/Silver (carbono preto com swirls prateados marmorizados).',
      '',
      'SET 5-FIN COMPLETO — pode ser rodado como Thruster (3 quilhas) OU Quad (4 quilhas) na mesma prancha. Versatilidade máxima na quiver. Construção Alpha sustentável (NetPlus + C6 air-infused), Made in USA em Huntington Beach. O template Vector 3/2 da Futures combina Vector Foil + 3° cant adicional + 2° toe twist + Scimitar Tip para máxima velocidade, lift e fluidez rail-to-rail.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Set 5-Fin (Tri/Quad — versatilidade total)',
      '- Template Neutral (all-around / versatile)',
      '- Construção Alpha (NetPlus reciclado + C6 air-infused)',
      '- Made in USA (Huntington Beach, CA)',
      '- Speed Generating (Ride Number alto)',
      '- Foil Vector 3/2 nas frontais + Symmetrical no center + Rear Quads',
      '- Cor Carbon/Silver com gráfico marmorizado',
      '',
      DESC_BLOCKS.alpha,
      '',
      DESC_BLOCKS.vectorFoil,
      '',
      DESC_BLOCKS.vector32,
      '',
      DESC_BLOCKS.scimitarTip,
      '',
      'Especificações Técnicas',
      '- Side Fins (frontais): Area 15.92 / Height 4.68 / Base 4.65 / Angle 6.5°/9.5° / Foil Vector 3/2',
      '- Center Fin: Area 15.50 / Height 4.64 / Base 4.79 / Foil SYMM',
      '- Rear Fins (quad rears): Area 11.67 / Height 4.05 / Base 3.87 / Angle 3.0° / Foil 80/20 FLAT',
      '',
      'Manufacturer Model: 1403-346-50',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      'Embalagem contém 1 set 5-FIN COMPLETO (5 quilhas: 2 frontais Vector 3/2 + 1 center + 2 quad rears). Permite rodar como Thruster (3 fins) ou Quad (4 fins).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #20 — AM2 Alpha Thruster Large Carbon/Teal Blue
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-AM2-ALP-L-BCY',
    name: 'Quilha Futures AM2 Alpha Thruster Large Carbon/Teal Blue',
    productFamily: 'quilha-futures-am2-alpha',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_ALPHA,
    gtin: '', // ⚠️ EAN não confirmado 100% — preencher manualmente
    weight: 175,
    color: 'Carbon/Teal Blue',
    colorCode: '#1F2937',
    colorCode2: '#0D9488',
    description: [
      'Quilha Futures AM2 Alpha Thruster Large — colorway Carbon/Teal Blue (carbono preto com gradiente azul-petróleo).',
      '',
      'Template Al Merrick 2 (AM2) em construção Alpha sustentável — a versão entry-level da família AM2 (Channel Islands). Template Rake clássico com base mais larga + tip refinada, combinação perfeita de drive e release. Designed pelo lendário Al Merrick (Channel Islands Surfboards — shaper de Kelly Slater 11x mundial).',
      '',
      'Shaper Series — Al Merrick (Channel Islands)',
      'Al Merrick é um dos 3 shapers mais influentes da história moderna do surf. Construiu pranchas para Kelly Slater, Tom Curren, Dane Reynolds, Mick Fanning, Conner Coffin, Lakey Peterson e dezenas de outros team riders CT.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Construção Alpha (NetPlus + C6)',
      '- Made in USA',
      '- Base mais larga + tip refinada',
      '- Center fin downsized (smaller than side fins)',
      '- Cor Carbon/Teal Blue translúcida',
      '',
      DESC_BLOCKS.alpha,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 15.98 / Height 4.73 / Base 4.64 / Foil FLAT',
      '- Center Fin: Area 15.32 / Height 4.49 / Base 4.63 / Foil SYMM',
      '- Ride Number: Balanced 6.7',
      '',
      'Manufacturer Model: 1160-333-00',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      '⚠️ Nota: EAN/UPC não confirmado nas fontes oficiais — preencher manualmente após escanear código de barras da embalagem.',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #21 — Glenn Pang Control Series Thruster Large Black/White
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-GP-CS-L-BKW',
    name: 'Quilha Futures Glenn Pang Control Series Thruster Large Black/White',
    productFamily: 'quilha-futures-glenn-pang-control-series',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_CONTROL_SERIES,
    gtin: '815681025101',
    weight: 165,
    color: 'Black/White',
    colorCode: '#0F172A',
    colorCode2: '#FFFFFF',
    description: [
      'Quilha Futures Glenn Pang Control Series T&C Thruster Large — colorway Black/White.',
      '',
      'Quilha-assinatura do lendário shaper havaiano Glenn Pang, head shaper da T&C Surf Designs (Town & Country) — uma das marcas mais respeitadas do Havaí, fundada em 1971 no North Shore de Oahu. Template Neutral balanceado all-around em construção Fiberglass sólido (Control Series) projetada para stability em ondas potentes.',
      '',
      'Shaper Series — Glenn Pang (T&C Surf Designs Hawaii)',
      "Glenn Pang é o head shaper da T&C Surf Designs há décadas — equipa surfistas lendários como Sunny Garcia, Jamie O'Brien, Coco Ho, Pancho Sullivan e Sebastian Zietz. O logo yin-yang com estrela é a identidade visual da marca desde os anos 70.",
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral (balanced / fluid / all-around / versatile)',
      '- Construção Fiberglass sólido (Control Series)',
      '- Designed by Glenn Pang (T&C Surf Designs)',
      '- Ride Number Speed Control 3.7',
      '- Side fins equal-sized ao center (área 15.57 vs 15.50)',
      '- Cor Black/White clássica T&C',
      '',
      DESC_BLOCKS.fiberglassSolid,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 15.57 / Height 4.66 / Base 4.38 / Angle 6.5° / Foil FLAT',
      '- Center Fin: Area 15.50 / Height 4.66 / Base 4.38 / Angle SYMM / Foil SYMM',
      '- Ride Number: Speed Control 3.7',
      '',
      'Condições Ideais',
      'All types / All conditions — funciona em qualquer tipo de onda, do beach break ao reef break ao point break.',
      '',
      'SKU UK Futures: FHCGP',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #22 — Sharp Eye Honeycomb Thruster Large Black/White
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-SE-HC-L-BKW',
    name: 'Quilha Futures Sharp Eye Honeycomb Thruster Large Black/White',
    productFamily: 'quilha-futures-sharp-eye-honeycomb',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: false, // variante L (main é Medium #6)
    isFeatured: false,
    price: PRICE_HONEYCOMB,
    gtin: '815681025132',
    weight: 145,
    color: 'Black/White',
    colorCode: '#0F172A',
    colorCode2: '#FFFFFF',
    description: [
      'Quilha Futures Sharp Eye Honeycomb Thruster Large — colorway Black/White (gráfico onda estilizada).',
      '',
      'Quilha-assinatura do shaper brasileiro Marcio Zouvi, fundador da Sharp Eye Surfboards (San Diego, CA). Template Neutral balanceado com base mais larga e tip refinada — entrega all-round performance em variedade de condições. Versão Large testada extensivamente pelos surfistas do Championship Tour Jack Robinson e Miguel Pupo.',
      '',
      'Athlete Series — Sharp Eye Surfboards',
      '⭐ Sharp Eye equipa Filipe Toledo (bicampeão mundial 2022/2023), Kanoa Igarashi (vice-campeão olímpico 2020), Jack Robinson e Miguel Pupo. Marcio Zouvi nasceu e cresceu no Rio de Janeiro — um dos shapers mais influentes do mundo.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral (balanced / all-around / versatile)',
      '- Construção Honeycomb (RTM Hex)',
      '- Designed by Marcio Zouvi (Sharp Eye Surfboards)',
      '- Ride Number Balanced 6.4',
      '- Testada por Jack Robinson e Miguel Pupo (WSL CT)',
      '- Cor Black/White com gráfico de onda estilizada',
      '',
      DESC_BLOCKS.honeycomb,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 15.96 / Height 4.68 / Base 4.60 / Foil FLAT',
      '- Center Fin: Area 15.96 / Height 4.68 / Base 4.60 / Foil SYMM',
      '- Ride Number: Balanced 6.4',
      '',
      'Manufacturer Model: 1068-117-00',
      '',
      'Condições Ideais',
      'All types / All conditions — versatilidade total, do beach break ao reef break.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #23 — Vector 3/2 Alpha Thruster Large Carbon/Silver
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-VEC32-ALP-L-CSI',
    name: 'Quilha Futures Vector 3/2 Alpha Thruster Large Carbon/Silver',
    productFamily: 'quilha-futures-vector-3-2-alpha',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: false, // variante L (main é M Gold #5)
    isFeatured: false,
    price: PRICE_ALPHA,
    gtin: '815681025965',
    weight: 165,
    color: 'Carbon/Silver',
    colorCode: '#1F2937',
    colorCode2: '#C0C0C0',
    description: [
      'Quilha Futures Vector 3/2 Alpha Thruster Large — colorway Carbon/Silver (carbono preto com swirls prateados marmorizados).',
      '',
      'A revolução de tecnologia de foil da Futures em construção Alpha sustentável, agora em tamanho Large para surfistas pesados. Setup Thruster (3 quilhas, sem rears). Combina o Vector Foil (superfície côncava no lado interno das laterais) + 3° cant adicional + 2° toe twist + Scimitar Tip (ponta achatada) para máxima velocidade, lift e fluidez rail-to-rail.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Setup Thruster (3 fins)',
      '- Template Neutral (all-around / versatile)',
      '- Construção Alpha (NetPlus + C6 air-infused)',
      '- Made in USA (Huntington Beach, CA)',
      '- Speed Generating (Ride Number alto)',
      '- Foil Vector 3/2 nas frontais',
      '- Cor Carbon/Silver',
      '',
      DESC_BLOCKS.alpha,
      '',
      DESC_BLOCKS.vectorFoil,
      '',
      DESC_BLOCKS.vector32,
      '',
      DESC_BLOCKS.scimitarTip,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 16.00 / Height 4.64 / Base 4.79 / Angle 6.5°/9.5° / Foil Vector 3/2',
      '- Center Fin: Area 15.50 / Height 4.64 / Base 4.79 / Foil SYMM',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster). NÃO inclui rears.',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #24 — Ethan Ewing Signature Fiberglass Thruster Large White/Red
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-EE-FG-L-WRD',
    name: 'Quilha Futures Ethan Ewing Signature Fiberglass Thruster Large White/Red',
    productFamily: 'quilha-futures-ethan-ewing-signature',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_TECHFLEX_PREMIUM,
    gtin: '815681026399',
    weight: 175,
    color: 'White/Red',
    colorCode: '#FFFFFF',
    colorCode2: '#DC2626',
    description: [
      'Quilha Futures Ethan Ewing Signature Fiberglass Thruster Large — colorway White/Red.',
      '',
      'A QUILHA QUE O ETHAN EWING USA — vice-campeão mundial da WSL 2023 e 3x Final 5 consecutivo do Championship Tour (2022, 2023, 2024). Após anos de prototipação e refinamento com seu fin sponsor Futures, EE escolheu este setup como sua quilha principal em todos os stops do CT — de J-Bay a Pipeline. Mesmo template DHD (Darren Handley Designs) que existe no Honeycomb, agora na construção Fiberglass sólido preferida do Ethan com foils refinados para acompanhar seu power surfing impecável.',
      '',
      'Athlete Series — Ethan Ewing (Vice-Campeão Mundial WSL 2023)',
      '⭐ Citação do Ethan: "I\'ve shaped my surfing around this template". NEW RELEASE 2025 (Austrália jun/2025, USA jul/2025).',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / control / drive)',
      "- Construção Fiberglass sólido (Ethan's preferred — não é Honeycomb)",
      '- Designed em colaboração DHD (Darren Handley Designs)',
      '- Ride Number Speed Control 3.3',
      '- Side fins equal-sized ao center',
      '- Cor White/Red signature Ethan Ewing',
      '- NEW RELEASE 2025',
      '',
      DESC_BLOCKS.fiberglassSolid,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 15.83 / Height 4.69 / Base 4.52 / Angle 6.5° / Foil Bevel',
      '- Center Fin: Area 15.83 / Height 4.69 / Base 4.52 / Foil SYMM (50/50)',
      '- Ride Number: Speed Control 3.3',
      '',
      'Manufacturer Model: 1230-292-00',
      '',
      'Sobre Ethan Ewing',
      'Ethan Ewing (Australia, 1998) é um dos surfistas mais técnicos da história moderna do CT. Conquistas: 3x Final 5 do WSL CT consecutivos (2022, 2023, 2024), Vice-campeão mundial WSL 2023, Vencedor de J-Bay Open (2022, 2023), Olímpico Paris 2024.',
      '',
      'Condições Ideais',
      'All types / All conditions — do J-Bay a Pipeline. Indicada para power surfing puro estilo CT.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg / 80+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #25 — Jack Robinson Signature Honeycomb Thruster Large Aqua
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JR-HC-L-AQ',
    name: 'Quilha Futures Jack Robinson Signature Honeycomb Thruster Large Aqua',
    productFamily: 'quilha-futures-jack-robinson-honeycomb',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_HONEYCOMB_PREMIUM,
    gtin: '815681026115',
    weight: 150,
    color: 'Aqua (Black/Blue)',
    colorCode: '#0F172A',
    colorCode2: '#06B6D4',
    description: [
      'Quilha Futures Jack Robinson Signature Honeycomb Thruster Large — colorway Aqua (preto com gradiente azul vibrante).',
      '',
      'Quilha-assinatura do australiano Jack Robinson, local de Margaret River e referência mundial em ondas de barril. Desenvolvida para acompanhar o estilo único do Jack de surfar acima e abaixo do lip — combina drive sustentado nos barreis pesados de Pipeline/Teahupoo com soltura nos aéreos. Template Rake com center fin downsized para mais manobrabilidade.',
      '',
      'Athlete Series — Jack Robinson (Pipe Masters Champion)',
      '⭐ Jack Robinson (Margaret River, Austrália, 1997) — Vencedor Pipe Masters 2022 e 2023 (back-to-back), Vencedor Margaret River Pro 2022, Vencedor Teahupoo 2024, Medalha de bronze Paris 2024 Olympics (Teahupoo), Top 5 WSL CT 2022-2024.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Construção Honeycomb (núcleo alveolar hexagonal)',
      '- Center fin DOWNSIZED (smaller than side fins)',
      '- Ride Number Balanced 5.7',
      '- Aplicação: All conditions / dia-a-dia',
      '- Cor Aqua signature Jack Robinson',
      '',
      DESC_BLOCKS.honeycomb,
      '',
      'Condições Ideais',
      'Open face / Point-break / All conditions — funciona desde beach break até reef break crítico. Jack surfa esta versão em condições do dia-a-dia.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #26 — JJF Vapor Core Scimitar Thruster Large Red/Carbon
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JJF-VC-L-RCB',
    name: 'Quilha Futures JJF Vapor Core Scimitar Thruster Large Red/Carbon',
    productFamily: 'quilha-futures-jjf-vapor-core-scimitar',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: false, // variante L (main é M #9)
    isFeatured: true,
    price: PRICE_VAPOR_CORE,
    gtin: '815681026238',
    weight: 130,
    color: 'Red/Carbon',
    colorCode: '#DC2626',
    colorCode2: '#1F2937',
    description: [
      'Quilha Futures JJF (John John Florence) Vapor Core Scimitar Thruster Large — colorway Red/Carbon (carbono marrom-vermelho translúcido com embalagem holográfica icônica).',
      '',
      'A QUILHA QUE O JOHN JOHN FLORENCE USA para gerar velocidade nas ondas pequenas e fracas — tricampeão mundial WSL (2016, 2017, 2024). Construção Vapor Core: núcleo OCO (hollow core) — a construção de quilha MAIS LEVE já feita pela Futures. Cada quilha é feita à mão (handmade) no HQ em Huntington Beach, CA, utilizando aerospace grade materials. Combina Full Vector Foil (lift + speed) + Scimitar Tip (ponta cut-off que afina o arco de turn).',
      '',
      'Athlete Series — John John Florence (Tricampeão Mundial WSL)',
      '⭐ "John rides this fin when he needs to generate speed when the waves are small and lack power" — Futures Fins.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral (all-around / versatile)',
      '- Construção Vapor Core (hollow core / handmade USA)',
      '- Full Vector Foil + Scimitar Tip',
      '- A construção mais leve da Futures',
      '- Made in USA (Huntington Beach)',
      '- Aerospace grade materials',
      '- Speed Generating',
      '- Embalagem holográfica icônica',
      '- Cor Red/Carbon signature',
      '',
      DESC_BLOCKS.vaporCore,
      '',
      DESC_BLOCKS.vectorFoil,
      '',
      DESC_BLOCKS.scimitarTip,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 15.63 / Height 4.62 / Base 4.57 / Angle 6.5° / Foil VECTOR',
      '- Center Fin: Area 15.36 / Height 4.58 / Base 4.57 / Foil SYMM',
      '',
      'Sobre John John Florence',
      'JJF (Hawaii, North Shore, 1992) — Tricampeão Mundial WSL CT (2016, 2017, 2024), múltiplos Pipe Masters, Olímpico Tokyo 2020 + Paris 2024. Local de Pipeline desde criança. Conhecido como "o surfista mais completo da história moderna".',
      '',
      'Condições Ideais',
      'Pequenas ondas + médias (Speed Generating em conditions weak). Para quem quer flagship signature JJF na quiver.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster) — embalagem holográfica colecionável.',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #27 — Mayhem 3.0 Vapor Core Thruster Med/Large Carbon/Blue
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-MAY-VC-ML-CB',
    name: 'Quilha Futures Mayhem 3.0 Vapor Core Thruster Med/Large Carbon/Blue',
    productFamily: 'quilha-futures-mayhem-3-0-vapor-core',
    size: 'M/L',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_VAPOR_CORE_LIMITED,
    gtin: '815681025484',
    weight: 130,
    color: 'Carbon/Blue',
    colorCode: '#1F2937',
    colorCode2: '#3B82F6',
    description: [
      'Quilha Futures Mayhem 3.0 Vapor Core Thruster Med/Large — colorway Carbon/Blue (carbono escuro com gradiente azul vibrante).',
      '',
      'EDIÇÃO LIMITADA colaboração entre Futures e o lendário shaper Matt "Mayhem" Biolos (...Lost Surfboards). Template Mayhem 3.0: ALL-NEW template projetado para os HP shortboards modernos com mais curvatura sob o pé traseiro — mais base + mais rake + tip narrow tapered para máximo bite nas curvas profundas mantendo drive nos turns de raio curto.',
      '',
      'Shaper Series — Matt Biolos (...Lost Surfboards)',
      '⭐ Matt Biolos é o fundador da ...Lost Surfboards (San Clemente, CA, 1989). Shaper dos campeões mundiais Mick Fanning (3x WSL) e Carissa Moore (5x WSL). Modelos icônicos: Sub-Driver, Rocket, Driver, Puddle Jumper, Round Nose Fish (RNF). LIMITED EDITION.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Mayhem 3.0 (ALL-NEW)',
      '- Construção Vapor Core (handmade hollow core)',
      '- Mais base + mais rake + tip narrow tapered',
      '- Made in USA (Huntington Beach)',
      '- Exoesqueleto de carbono tecido preloaded under tension',
      '- Ride Number Balanced 4.3',
      '- LIMITED EDITION',
      '- Cor Carbon/Blue com embalagem amarelo-neon icônica',
      '',
      DESC_BLOCKS.vaporCore,
      '',
      'Citação Matt Biolos',
      '"The Mayhem 3.0 is an all new template. With the trends in modern HP shortboards going towards more curve under the rear foot for critical pocket surfing, we felt the need for the fins to evolve with the board rockers."',
      '',
      'Especificações Técnicas',
      '- Template Rake (drawn-out / drive)',
      '- Construção Vapor Core (woven carbon exoskeleton + hollow core)',
      '- Aerospace grade materials',
      '- Ride Number: Balanced 4.3',
      '',
      'Manufacturer Model: 1089-602-00',
      '',
      'Condições Ideais',
      'HP Shortboards modernos / Critical pocket surfing. Para surfistas advanced/expert que querem o flagship Mayhem com tech Vapor Core.',
      '',
      'Tamanho: Medium/Large (recomendado para surfistas 145-190 lbs / 65-85 kg — "typically sized full-grown surfers")',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster) — Edição Limitada.',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #28 — Jordy Signature Techflex Thruster Large Black/Red
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JOR-TFX-L-BKR',
    name: 'Quilha Futures Jordy Signature Techflex Thruster Large Black/Red',
    productFamily: 'quilha-futures-jordy-techflex',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_TECHFLEX_PREMIUM,
    gtin: '815681025873',
    weight: 165,
    color: 'Black/Red',
    colorCode: '#0F172A',
    colorCode2: '#DC2626',
    description: [
      'Quilha Futures Jordy Signature Techflex Thruster Large — colorway Black/Red (carbono preto com linhas vermelho-coral em ziguezague).',
      '',
      'Quilha-assinatura do sul-africano Jordy Smith — Top 5 WSL CT e vencedor múltiplo do J-Bay Open (na onda da casa dele). Versão Techflex desenvolvida especificamente para quando as ondas estão pumping — Jordy escolhe ela quando precisa de mais controle e estabilidade em surf poderoso. Template Rake com center fin downsized para mais manobrabilidade.',
      '',
      'Athlete Series — Jordy Smith (J-Bay Open Champion)',
      '⭐ Jordy Smith (Durban, África do Sul, 1988) — Vice-campeão mundial WSL CT (2010, 2011), Vencedor J-Bay Open múltiplas vezes, Olímpico Tokyo 2020 + Paris 2024. Um dos mais power surfers da história — combina aéreos high-amplitude com carving devastador.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Construção Techflex (Honeycomb + Carbon weave 3K)',
      '- Center fin DOWNSIZED (smaller than side fins)',
      '- Ride Number Speed Control 3.2',
      '- Foil FLAT nas laterais',
      '- Aplicação: "Pumping waves" — Jordy go-to em ondas grandes',
      '- Cor Black/Red carbono',
      '',
      DESC_BLOCKS.techflex,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 15.92 / Height 4.68 / Base 4.65 / Foil FLAT',
      '- Center Fin: Downsized (menor que side fins)',
      '- Ride Number: Speed Control 3.2',
      '',
      'Condições Ideais',
      'Powerful waves / Open face / Point break. Para quando as ondas estão pumping — Jordy escolhe esta versão em condições potentes do WSL CT.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #29 — Jack Robinson Signature Techflex Thruster Large Black/Orange
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JR-TFX-L-BKO',
    name: 'Quilha Futures Jack Robinson Signature Techflex Thruster Large Black/Orange',
    productFamily: 'quilha-futures-jack-robinson-techflex',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_TECHFLEX_PREMIUM,
    gtin: '815681026108',
    weight: 165,
    color: 'Black/Orange',
    colorCode: '#0F172A',
    colorCode2: '#F97316',
    description: [
      'Quilha Futures Jack Robinson Signature Techflex Thruster Large — colorway Black/Orange (carbono preto com gradiente laranja vibrante).',
      '',
      'Versão Techflex da assinatura do australiano Jack Robinson (Margaret River local). A escolha do Jack quando as ondas estão pumping — projetada para surfar em condições poderosas como Pipeline, Teahupoo, Margaret River. Construção Techflex (stiff + light) → feel sólido e engajado para powerful surfers ou powerful conditions. Mesmo template Rake do Jack Robinson Honeycomb (#25), agora em construção mais firme para charging barrels e critical maneuvers.',
      '',
      'Athlete Series — Jack Robinson (Pipe Masters Champion)',
      '⭐ Jack Robinson — Vencedor Pipe Masters 2022 e 2023 (back-to-back), Vencedor Teahupoo 2024, Medalha de bronze Paris 2024 Olympics (Teahupoo). Jack usa Honeycomb no dia-a-dia e Techflex quando as ondas estão grandes.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Construção Techflex (Honeycomb + Carbon weave 3K)',
      '- Center fin DOWNSIZED (smaller than side fins)',
      '- Ride Number Speed Control 3.2',
      '- Aplicação: "When waves are pumping" — go-to do Jack em ondas grandes',
      '- Cor Black/Orange carbono signature',
      '',
      DESC_BLOCKS.techflex,
      '',
      'Especificações Técnicas',
      '- Side Fins: Rake template (specs side superior ao Honeycomb)',
      '- Center Fin: Downsized (menor que side fins)',
      '- Ride Number: Speed Control 3.2',
      '',
      'Condições Ideais',
      'Powerful waves / Solid conditions / Critical surf — para charging barrels e critical maneuvers em Pipeline, Teahupoo, Margaret River.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75-90 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #30 — JJF Techflex Thruster Large Black/Red (JJ-2)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-JJF-TFX-L-BKR',
    name: 'Quilha Futures JJF Techflex Thruster Large Black/Red',
    productFamily: 'quilha-futures-jjf-techflex',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: false, // variante L (main é M Digi Yellow #13)
    isFeatured: false,
    price: PRICE_TECHFLEX_TOP,
    gtin: '', // ⚠️ EAN NÃO CONFIRMADO — preencher manualmente
    weight: 175,
    color: 'Black/Red',
    colorCode: '#0F172A',
    colorCode2: '#DC2626',
    description: [
      'Quilha Futures JJF (John John Florence) Techflex Thruster Large — colorway Black/Red (carbono preto + bordas vermelho-neon pixelizadas).',
      '',
      'Versão Large do template MAIS VENDIDO DA FUTURES de todos os tempos — o mesmo que John John Florence usou exclusivamente para conquistar 3 títulos mundiais WSL (2016, 2017, 2024). Escolha do Tricampeão para pranchas de ondas menores com tail mais largo que precisam de mais lift. Construção Techflex com foil FLAT → feel sólido, engajado e previsível — ideal para controlar velocidade em ondas potentes.',
      '',
      'Athlete Series — John John Florence (Tricampeão Mundial WSL)',
      '⭐ "Stable and predictable at high speeds, springy and responsive in more playful conditions" — best-selling fin template de todos os tempos.',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Template Neutral (all-around / versatile) — scaled-up do Medium dos World Titles',
      '- Construção Techflex (Honeycomb + Carbon weave 3K)',
      '- Foil FLAT (side) / SYMM (center)',
      '- Ride Number Speed Control 3.4',
      '- Aplicação JJF: "Small wave boards with wider tail"',
      '- Cor Black/Bright Red com gráfico pixelizado',
      '',
      DESC_BLOCKS.techflex,
      '',
      'Especificações Técnicas (versão atual JJF Techflex L)',
      '- Side Fins: Area 16.05 / Height 4.71 / Base 4.61 / Angle 6.5° / Foil FLAT',
      '- Center Fin: Area 16.05 / Height 4.71 / Base 4.61 / Foil SYMM',
      '- Ride Number: Speed Control 3.4',
      '',
      'Manufacturer Model: 5557-477-00 (versão atual JJF Techflex L)',
      '',
      'Condições Ideais',
      'All types / All conditions — JJF usa em small wave boards com tail mais largo. Power surfing em condições potentes ou pranchas drivey.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      '⚠️ Nota: EAN/UPC não confirmado nas fontes oficiais — existem 2 versões (JJ-2 antiga e JJF Techflex L atual). Preencher manualmente após escanear código de barras da embalagem.',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #31 — AM2 Techflex Thruster Large Black/Yellow Hexagons
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-AM2-TFX-L-BKY',
    name: 'Quilha Futures AM2 Techflex Thruster Large Black/Yellow Hexagons',
    productFamily: 'quilha-futures-am2-techflex',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_TECHFLEX_PREMIUM,
    gtin: '', // ⚠️ EAN NÃO CONFIRMADO — preencher manualmente
    weight: 175,
    color: 'Black/Yellow Hexagons',
    colorCode: '#0F172A',
    colorCode2: '#FACC15',
    description: [
      'Quilha Futures AM2 Techflex Thruster Large — colorway Black/Yellow Hexagons (carbono preto com logos hexagonais amarelos icônicos Channel Islands).',
      '',
      'A MAIOR quilha thruster designed por Al Merrick — shaper lendário da Channel Islands Surfboards (Santa Barbara, CA), o homem que fez as pranchas de Kelly Slater (11x campeão mundial), Tom Curren, Dane Reynolds e dezenas de outros campeões CT. Template Rake com base mais larga + tip refinada = combinação perfeita de drive na saída do bottom + release no top. Construção Techflex premium para powerful surfers ou powerful conditions.',
      '',
      'Shaper Series — Al Merrick (Channel Islands)',
      '⭐ Al Merrick (Santa Barbara, CA) fundou a Channel Islands Surfboards em 1969 — considerado um dos 3 shapers mais influentes da história do surf moderno. Logo hexágono amarelo é um dos mais reconhecidos do surf.',
      '',
      DESC_BLOCKS.rake,
      '',
      'Características Principais',
      '- Template Rake (drawn-out / drive)',
      '- Construção Techflex (Honeycomb + 3K Carbon weave)',
      '- Center fin DOWNSIZED (smaller than side fins)',
      '- Ride Number Speed Control 3.4',
      '- Foil FLAT nas laterais / SYMM no center',
      '- A MAIOR thruster designed by Al Merrick',
      '- Cor Black/Yellow Hexagons clássica CI',
      '',
      DESC_BLOCKS.techflex,
      '',
      'Especificações Técnicas',
      '- Side Fins: Area 15.98 / Height 4.73 / Base 4.64 / Foil FLAT',
      '- Center Fin: Area 15.32 / Height 4.49 / Base 4.63 / Foil SYMM',
      '- Ride Number: Speed Control 3.4',
      '',
      'Manufacturer Model: 5560-463-00',
      '',
      'Sobre AM2 vs AM1',
      'AM2 = template Rake MAIOR que AM1, mais base + mais rake — para surfistas Large + powerful surfing. AM1 é Neutral all-around (medium optimal).',
      '',
      'Condições Ideais',
      'Powerful waves / Open face / Point break. Famosos pelos pros: Kelly Slater (11x mundial), Tom Curren, Dane Reynolds — todos team riders Channel Islands.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg / 80+ kg)',
      '',
      '⚠️ Nota: EAN/UPC não confirmado para colorway Black/Yellow Hexagons — versão Black/Orange tem EAN diferente. Preencher manualmente após escanear código de barras da embalagem.',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #32 — Neutral Quad Rears Large (par) Grey
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-QR-NEU-HC-L',
    name: 'Quilha Futures QD2 Honeycomb Neutral Quad Rear Large (Par)',
    productFamily: 'quilha-futures-qd2-honeycomb-quad-rear',
    size: 'L',
    setup: 'Quad Rear',
    isMainVariant: false, // variante L (main é S #16)
    isFeatured: false,
    price: PRICE_QUAD_REAR_PAIR,
    gtin: '815681024661',
    weight: 110,
    color: 'Grey',
    colorCode: '#6B7280',
    colorCode2: '',
    description: [
      'Par de quilhas traseiras Futures QD2 Honeycomb Neutral Quad Rear — tamanho Large.',
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
      '- Cor: Grey (honeycomb natural + linhas verde-água)',
      '',
      DESC_BLOCKS.honeycomb,
      '',
      'Especificações Técnicas (cada quilha)',
      '- Template Neutral',
      '- Foil: 80/20',
      '- Construção Honeycomb',
      '',
      'Combinações Recomendadas',
      'Este Quad Rear Large pode ser combinado com side fins Large: AM2 Alpha L, JJF Vapor Core L, Vector 3/2 Alpha L, Jordy Signature Techflex L ou HC, Jack Robinson HC L ou Techflex L, ou qualquer side fin Large da Futures.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
      '',
      'Embalagem contém 1 par de quilhas traseiras (2 unidades — Quad Rear).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // #33 — Vector 3/2 Blackstix+ Thruster Large Silver/Carbon
  // ════════════════════════════════════════════════════════════
  {
    sku: 'FUT-VEC32-BSX-L-SIL',
    name: 'Quilha Futures Vector 3/2 Blackstix+ Thruster Large Silver',
    productFamily: 'quilha-futures-vector-3-2-blackstix-plus',
    size: 'L',
    setup: 'Thruster',
    isMainVariant: false, // variante L (main é M Gold #15)
    isFeatured: true,
    price: PRICE_BLACKSTIX_PLUS,
    gtin: '815681026351',
    weight: 145,
    color: 'Silver/Carbon',
    colorCode: '#C0C0C0',
    colorCode2: '#1F2937',
    description: [
      'Quilha Futures Vector 3/2 Blackstix+ Thruster Large — colorway Silver/Carbon (carbono preto puro com checkerboard tecido visível).',
      '',
      'A evolução do template Vector 3/2 — agora em construção Blackstix+ (próxima geração do Blackstix tradicional com layup mais rígido). Combina o lendário Vector Foil (superfície côncava no lado interno) + 3° cant adicional + 2° toe twist + Scimitar Tip + V2 inside foil para máxima velocidade, lift e fluidez rail-to-rail. "Performance Elevated" — a Blackstix+ mantém os foils Vector 3/2 totalmente engajados durante as curvas, oferecendo drive, hold e spring back sem sacrificar a transição fluida.',
      '',
      'Premium Tier — Blackstix+ (Performance Elevated)',
      '⭐ Speed Generating (10-7) — Springy, Fluid, Responsive. Eco-friendly (resina epóxi proprietária com 50-75% menos VOCs).',
      '',
      DESC_BLOCKS.neutral,
      '',
      'Características Principais',
      '- Setup Thruster (3 fins)',
      '- Template Neutral (all-around / versatile)',
      '- Construção Blackstix+ (carbon + fiberglass matrix mais rígido)',
      '- Foil Vector 3/2 + V2 inside foil + Scimitar Tip',
      '- Speed Generating (Ride Number 10-7)',
      '- Resina epóxi eco-friendly (50-75% menos VOCs)',
      '- Cor Silver/Carbon Black com checkerboard tecido',
      '',
      DESC_BLOCKS.blackstixPlus,
      '',
      DESC_BLOCKS.v2Foil,
      '',
      DESC_BLOCKS.vectorFoil,
      '',
      DESC_BLOCKS.vector32,
      '',
      DESC_BLOCKS.scimitarTip,
      '',
      'Especificações Técnicas',
      '- Template Neutral',
      '- Construção Blackstix+ (V2 foil)',
      '- Ride Number: Speed Generating (10-7)',
      '',
      'Manufacturer Model: 1403-476-00',
      '',
      'Condições Ideais',
      'All types / All conditions — funciona em qualquer condição, com performance elevada em ondas formadas onde o Vector 3/2 brilha. Para surfistas que querem o Vector 3/2 elevado a outro patamar — mais drive, mais hold, mais spring que a versão Alpha.',
      '',
      'Tamanho: Large (recomendado para surfistas 165+ lbs / 75+ kg)',
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

  // ─── WIPE (opcional — DESABILITADO POR DEFAULT) ────────────
  if (WIPE_FUTURES_BEFORE_SEED) {
    console.log('⚠️  WIPE_FUTURES_BEFORE_SEED = true');
    console.log('⚠️  ATENÇÃO: vai apagar TAMBÉM a parte 1 (18 quilhas)!');
    console.log(`🗑️  Apagando todos produtos da marca Futures Fins...`);
    const wipeResult = await Product.deleteMany({ brand: brand._id });
    console.log(
      `🗑️  ${wipeResult.deletedCount} produto(s) Futures apagado(s)\n`,
    );
  }

  // ─── Validação: SKUs duplicados (interno + contra DB) ──────
  const skuSet = new Set<string>();
  const duplicatesInternal: string[] = [];
  for (const p of PRODUCTS) {
    if (skuSet.has(p.sku)) duplicatesInternal.push(p.sku);
    skuSet.add(p.sku);
  }
  if (duplicatesInternal.length > 0) {
    console.error('❌ SKUs duplicados dentro do PRODUCTS:');
    duplicatesInternal.forEach(s => console.error(`   ${s}`));
    process.exit(1);
  }

  // Validar SKU contra DB (não duplicar com parte 1)
  console.log(
    '🔍 Verificando se SKUs já existem na base (conflito com pt1)...',
  );
  const existingSkus = await Product.find({
    sku: { $in: PRODUCTS.map(p => p.sku) },
  })
    .select('sku')
    .lean();
  if (existingSkus.length > 0) {
    console.warn(
      '⚠️  SKUs já existentes no DB (serão atualizados via upsert):',
    );
    existingSkus.forEach(p => console.warn(`   ${p.sku}`));
  }
  console.log('');

  // ─── Validação: 1 isMainVariant por família ────────────────
  // ⚠️ Nota: nesta parte 2 algumas variantes apontam para famílias
  // da parte 1 (Sharp Eye HC, JJF Vapor Core, Vector 3/2 etc).
  // Para essas, isMainVariant=false, pois o main está no seed pt1.
  const familyMainCount = new Map<string, number>();
  for (const p of PRODUCTS) {
    if (p.isMainVariant) {
      familyMainCount.set(
        p.productFamily,
        (familyMainCount.get(p.productFamily) || 0) + 1,
      );
    }
  }
  const familiesWithMultipleMains: string[] = [];
  familyMainCount.forEach((count, family) => {
    if (count > 1) familiesWithMultipleMains.push(family);
  });
  if (familiesWithMultipleMains.length > 0) {
    console.error('❌ Famílias com múltiplas mainVariant em pt2:');
    familiesWithMultipleMains.forEach(f => console.error(`   ${f}`));
    process.exit(1);
  }

  // ─── Inserção via upsert ───────────────────────────────────
  console.log(
    `📦 Inserindo/atualizando ${PRODUCTS.length} quilhas Futures (parte 2)...\n`,
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
      'quilhas',
      'futures',
      'futures-fins',
      p.setup.toLowerCase().replace(' ', '-'),
      p.size.toLowerCase().replace('/', '-'),
      ...p.productFamily
        .split('-')
        .filter(t => !['quilha', 'futures'].includes(t)),
    ];

    const productData = {
      name: normalizedName,
      slug,
      description: p.description,
      sku: p.sku,
      price: p.price,
      compareAtPrice: 0,
      costPrice: Math.round(p.price / 2),
      category: category._id,
      subcategory: subcategory._id,
      brand: brand._id,
      supplier: supplier._id,
      supplierProductCode: p.sku,
      images: [],
      thumbnail: '',
      stock: 1,
      weight: p.weight,
      dimensions: {
        length: 18,
        width: 12,
        height: 3,
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
      variantType: 'both' as const,
      color: p.color,
      colorCode: p.colorCode,
      colorCode2: p.colorCode2 || '',
      size: p.size,
      isMainVariant: p.isMainVariant,
      isAvailableInStore: true,
      isPublishedOnline: true,
      gtin: p.gtin || '',
      ncm: '9506.29.00',
      origin: '2', // Estrangeira importação direta
      cest: '',
    };

    const existing = await Product.findOne({ sku: p.sku });
    if (existing) {
      await Product.updateOne({ sku: p.sku }, { $set: productData });
      updated++;
      console.log(`🔄 ${p.sku} → atualizado`);
    } else {
      await Product.create(productData);
      created++;
      console.log(`✨ ${p.sku} → criado`);
    }
  }

  // ─── Resumo Final ──────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 RESUMO PARTE 2');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total processado:  ${PRODUCTS.length}`);
  console.log(`✨ Criados:        ${created}`);
  console.log(`🔄 Atualizados:    ${updated}`);
  console.log(`📦 Famílias únicas: ${families.size}`);
  console.log(`💰 Valor total:    R$ ${totalValue.toLocaleString('pt-BR')}`);
  console.log('═══════════════════════════════════════════════════');

  // GTIN pendentes
  const pendingGtin = PRODUCTS.filter(p => !p.gtin);
  if (pendingGtin.length > 0) {
    console.log('');
    console.log('⚠️  GTIN PENDENTE (preencher manualmente via admin):');
    pendingGtin.forEach(p => {
      console.log(`   ${p.sku} — ${p.name}`);
    });
  }

  // Famílias listadas
  console.log('');
  console.log('📂 FAMÍLIAS desta parte 2:');
  Array.from(families)
    .sort()
    .forEach(f => console.log(`   ${f}`));

  console.log('');
  console.log('✅ Seed parte 2 finalizado.');
  console.log('');
  console.log('Total Futures Fins no catálogo após pt1 + pt2: 34 quilhas');
  console.log('');

  await mongoose.disconnect();
  console.log('🔌 Conexão encerrada.');
}

seed().catch(err => {
  console.error('❌ Erro:', err);
  mongoose.disconnect();
  process.exit(1);
});
