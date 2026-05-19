/**
 * seed-quilhas-fcs-ii.ts
 *
 * Seed para inserir as 46 quilhas FCS II catalogadas no estoque físico
 * do Surfers Paradise (Moema). Baseado no padrão de seed-fcs.ts.
 *
 * Rodar com:
 *   npx tsx scripts/seed-quilhas-fcs-ii.ts
 *
 * Flags:
 *   WIPE_FCS_BEFORE_SEED = true  → apaga TODOS os produtos da marca FCS antes
 *                                  de inserir (use com cuidado, default = false)
 *
 * Versão 2.0 — descrições + preços + GTINs + pesos embutidos.
 *
 * Campos preenchidos:
 *   ✅ sku, name, supplierProductCode
 *   ✅ description (descrição PT-BR técnica completa)
 *   ✅ price, costPrice (= price/2)
 *   ✅ gtin (EAN internacional FCS)
 *   ✅ weight (peso em gramas por tamanho/material)
 *   ✅ color, colorCode, colorCode2 (cores extraídas das etiquetas)
 *   ✅ ncm, origin, dimensions, tags, productFamily, variantType, size
 *   ✅ isMainVariant, isFeatured, isActive, isAvailableInStore, isNewArrival
 *
 * Campos em branco (você completa depois):
 *   ⬜ images, thumbnail (anexar fotos via admin)
 *   ⬜ seoTitle, seoDescription (opcional)
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

const WIPE_FCS_BEFORE_SEED = false; // ⚠️ true = apaga TODOS produtos FCS

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
    'PC',
    'PCC',
    'PG',
    'NG',
    'CC',
    'NC',
    'BK',
    'GF',
    'AM',
    'CI',
    'MR',
    'GM',
    'SE',
    'SF',
    'MF',
    'FT',
    'RP',
    'WT',
    'JW',
    'KA',
    'MB',
    'HS',
    'H4',
    'II',
    'III',
    'XL',
    'XS',
    'SM',
    'MD',
    'LG',
    'ML',
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
// DESCRIÇÕES REUTILIZÁVEIS POR TEMPLATE E MATERIAL
// ═══════════════════════════════════════════════════════════════

const DESC_BLOCKS = {
  performer: `Família Performer: Find Balance
Equilíbrio entre velocidade, fluidez e resposta. O template Performer é o mais popular da FCS no mundo, com geometria balanceada e Inside Foil Technology (IFT) — entrega drive consistente e manobrabilidade fluida em qualquer condição.`,

  accelerator: `Família Accelerator: Find Control
Velocidade, fluidez e resposta com controle adicional. Template raked com mais sweep que a Performer, ideal para surfistas que querem mais drive na saída do bottom e segurança em ondas críticas.`,

  carver: `Família Carver: Find Power
Turns potentes, desenhados, com hold adicional. Template alongado com alto grau de sweep — perfeito para surfistas potentes que adoram empurrar contra a quilha e desenhar arcos longos no rail.`,

  reactor: `Família Reactor: Find Speed
Velocidade, turns curtos e snaps explosivos. Template mais vertical com menos sweep — favorece pivot rápido, mudanças de direção ágeis e release fácil no tail.`,

  pc: `Material: Performance Core (PC)
Construção por molde de resina por transferência multi-camada. O padrão de flex se estende progressivamente da base até a ponta, ajudando a manter drive e segurança durante todo o turn. Material leve e versátil para uma ampla variedade de condições. Flex 3.5/5.`,

  pcc: `Material: Performance Core Carbon (PCC)
A construção com a resposta mais rápida de toda a linha FCS. Possui inlay de tecido de carbono estrategicamente posicionado para complementar o template. Resulta em flex muito uniforme da base à ponta, com feedback positivo em cada turn. Flex 4/5 — recomendado para power surfers.`,

  pcAircore: `Material: Performance Core + AirCore (PC AirCore)
Tecnologia AirCore com núcleo de espuma de poliuretano comprimida que mimetiza a geometria do foil. Reduz o uso de fibra de vidro no processo RTM, tornando a quilha mais leve e permitindo manipulação total do flex pattern. Resultado: drive consistente, ultra-leveza e resposta rápida.`,

  pccAircore: `Material: PC Carbon + AirCore (PCC AirCore)
Combinação premium: tecido de carbono estratégico + núcleo AirCore ultraleve. Entrega a resposta explosiva do PCC com peso reduzido. Padrão de flex uniforme e feedback imediato.`,

  pg: `Material: Performance Glass (PG)
Fibra de vidro sólida usinada em CNC a partir de múltiplas camadas de fiberglass. Material mais rígido da linha FCS, amplamente utilizado por surfistas profissionais por manter a integridade do flex sob força extrema. Recuperação de memória ultra-rápida — velocidade pura e aceleração imediata. Flex 5/5 (Stiff).`,

  neoGlass: `Material: Neo Glass (NG)
Quilhas moldadas por precisão usando fibra de vidro de fio longo combinada com polímero marine grade. Construção acessível mas premium pelo alto conteúdo de fibra de vidro e padrão de flex ativo. A versão EcoBlend usa 50% fibra de vidro e bio-resina (mamona), reduzindo o impacto ambiental sem comprometer performance. Flex 3/5.`,

  neoCarbon: `Material: Neo Carbon (NC)
Fibra de carbono de fio longo com resina europeia de alto padrão. Super leve com flex firme tipo "spring-loaded". O carbono gera velocidade até em ondas pequenas pelo "whipping effect" — a ponta da quilha chicoteia ao sair de cada turn, projetando o board com mais força.`,

  uniCarbon: `Material: Uni-Carbon (Swiss Made)
Construção topo de linha da FCS, feita na Suíça com tecido de carbono unidirecional. Material mais responsivo e leve da linha — recuperação de flex instantânea e feedback ultra-preciso.`,

  glassFlex: `Material: Glass Flex (GF)
Polímero engineering-grade injetado. Formulado para replicar o flex e mem��ria da fibra de vidro tradicional. Vantagens: rigidez consistente, padrão de flex positivo (ponta flexível, base rígida) e excelente memória de flex. Construção mais acessível da linha FCS.`,

  encaixe: `Atenção: Este sistema de encaixe é exclusivo para o sistema FCS II e não serve em copinhos FCS original ou Futures.`,
};

function buildDescription(opts: {
  intro: string;
  family: 'performer' | 'accelerator' | 'carver' | 'reactor';
  material: keyof typeof DESC_BLOCKS;
  features: string[];
  size: string;
  weight: string;
  conditions?: string;
  setup?: string;
}): string {
  const setupText =
    opts.setup || 'Embalagem contém 1 jogo com 3 quilhas (Thruster).';
  return [
    opts.intro,
    '',
    DESC_BLOCKS[opts.family],
    '',
    'Características Principais',
    ...opts.features.map(f => `- ${f}`),
    '',
    DESC_BLOCKS[opts.material],
    '',
    opts.conditions ? `Condições Ideais\n${opts.conditions}\n` : '',
    `Tamanho: ${opts.size} (recomendado para surfistas ${opts.weight})`,
    '',
    setupText,
    '',
    DESC_BLOCKS.encaixe,
  ]
    .filter(Boolean)
    .join('\n');
}

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface SeedFin {
  sku: string;
  name: string;
  productFamily: string;
  size: string;
  isMainVariant: boolean;
  isFeatured: boolean;
  price: number;
  gtin: string;
  weight: number; // gramas
  color: string;
  colorCode: string;
  colorCode2?: string;
  description: string;
}

// Helpers para preço
const PRICE_NG_TRI = 1100; // Performer/Accelerator/Carver Neo Glass Tri
const PRICE_PC_QR = 799.9; // PC Quad Rear pair
const PRICE_NG_QR = 639.9; // Neo Glass Quad Rear pair
const PRICE_H4 = 2200; // H4 Uni-Carbon top de linha
const PRICE_STD = 1699; // Maioria Shaper/Athlete Series
const PRICE_MR_SMOKE = 1199; // MR Smoke promo
const PRICE_TWIN = 1499; // Power Twin e AM Robber
const PRICE_PER_PC_LG = 1399.9; // Performer PC Large
const PRICE_MF_NC = 1450; // MF Neo Carbon
const PRICE_AM_AIRCORE = 1540; // AM PC AirCore L
const PRICE_RUSTY = 2098; // RP Tri-Quad 5 fins
const PRICE_GF_TRI = 440; // Carver Glass Flex Tri
const PRICE_GF_QR = 240; // Carver Glass Flex Quad Rear

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO COMPLETO — 46 QUILHAS FCS II
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedFin[] = [
  // ─── #1 Performer NG Medium Pacific ───
  {
    sku: 'FPER-NG04-MD-TS-R',
    name: 'Quilha FCS II Performer Neo Glass Tri Medium Pacific',
    productFamily: 'quilha-fcs-ii-performer-neo-glass',
    size: 'M',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_NG_TRI,
    gtin: '9340935060788',
    weight: 145,
    color: 'Pacific',
    colorCode: '#1E40AF',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Quilha FCS II Performer Neo Glass Tri Medium — colorway Pacific (azul oceânico). A quilha mais vendida da FCS no mundo em construção Neo Glass eco-friendly, ideal para surfistas que querem confiabilidade em qualquer condição.',
      family: 'performer',
      material: 'neoGlass',
      features: [
        'Template Performer com Inside Foil Technology (IFT)',
        'Construção Neo Glass EcoBlend (50% fibra de vidro e bio-resina)',
        'Equilíbrio ideal entre velocidade, fluidez e resposta',
        'Versátil em ampla gama de condições — de beach breaks a point breaks',
        'Cor: Pacific (azul oceânico)',
      ],
      size: 'Medium',
      weight: '65-80 kg / 145-175 lbs',
      conditions:
        'Ampla variedade de condições, de beach breaks a point breaks. Funciona muito bem em ondas pequenas a médias.',
    }),
  },

  // ─── #2 Performer NG Medium Mango ───
  {
    sku: 'FPER-NG05-MD-TS-R',
    name: 'Quilha FCS II Performer Neo Glass Tri Medium Mango',
    productFamily: 'quilha-fcs-ii-performer-neo-glass',
    size: 'M',
    isMainVariant: false,
    isFeatured: false,
    price: PRICE_NG_TRI,
    gtin: '9340935065660',
    weight: 145,
    color: 'Mango',
    colorCode: '#F97316',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Quilha FCS II Performer Neo Glass Tri Medium — colorway Mango (laranja vibrante). A quilha mais vendida da FCS no mundo em construção Neo Glass eco-friendly.',
      family: 'performer',
      material: 'neoGlass',
      features: [
        'Template Performer com Inside Foil Technology (IFT)',
        'Construção Neo Glass EcoBlend (50% fibra de vidro e bio-resina)',
        'Equilíbrio ideal entre velocidade, fluidez e resposta',
        'Versátil em beach breaks e point breaks',
        'Cor: Mango (laranja vibrante)',
      ],
      size: 'Medium',
      weight: '65-80 kg / 145-175 lbs',
      conditions:
        'Ampla variedade de condições, de beach breaks a point breaks.',
    }),
  },

  // ─── #3 Performer NG Large Pacific ───
  {
    sku: 'FPER-NG04-LG-TS-R',
    name: 'Quilha FCS II Performer Neo Glass Tri Large Pacific',
    productFamily: 'quilha-fcs-ii-performer-neo-glass',
    size: 'L',
    isMainVariant: false,
    isFeatured: false,
    price: PRICE_NG_TRI,
    gtin: '9340935060559',
    weight: 155,
    color: 'Pacific',
    colorCode: '#1E40AF',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Quilha FCS II Performer Neo Glass Tri Large — colorway Pacific (azul oceânico). A quilha all-round mais vendida da FCS, agora em Large para surfistas mais pesados.',
      family: 'performer',
      material: 'neoGlass',
      features: [
        'Template Performer com Inside Foil Technology (IFT)',
        'Construção Neo Glass EcoBlend (eco-friendly)',
        'Equilíbrio ideal entre velocidade, fluidez e resposta',
        'Versátil em ampla gama de condições',
        'Cor: Pacific (azul oceânico)',
      ],
      size: 'Large',
      weight: '75-95 kg / 165-210 lbs',
      conditions:
        'Ampla variedade de condições, especialmente boas para surfistas mais pesados.',
    }),
  },

  // ─── #34 Performer NG Small Pacific ───
  {
    sku: 'FPER-NG01-SM-TS-R',
    name: 'Quilha FCS II Performer Neo Glass Tri Small Pacific',
    productFamily: 'quilha-fcs-ii-performer-neo-glass',
    size: 'S',
    isMainVariant: false,
    isFeatured: false,
    price: PRICE_STD,
    gtin: '9340935031030',
    weight: 130,
    color: 'Pacific',
    colorCode: '#1E40AF',
    colorCode2: '#000000',
    description: buildDescription({
      intro:
        'Quilha FCS II Performer Neo Glass Tri Small — colorway Pacific (azul oceânico com detalhes em preto). A quilha mais vendida da FCS, agora no tamanho Small para surfistas mais leves e ágeis.',
      family: 'performer',
      material: 'neoGlass',
      features: [
        'Template Performer com Inside Foil Technology (IFT)',
        'Construção Neo Glass EcoBlend (eco-friendly)',
        'Tamanho Small para surfistas leves',
        'Versátil em ondas fracas a médias',
        'Cor: Pacific (azul com preto)',
      ],
      size: 'Small',
      weight: '55-70 kg / 120-155 lbs',
      conditions:
        'Ondas fracas a médias, beach breaks. Ideal para surfistas mais leves.',
    }),
  },

  // ─── #4 Accelerator NG Medium Red ───
  {
    sku: 'FACC-NG04-MD-TS-R',
    name: 'Quilha FCS II Accelerator Neo Glass Tri Medium Red',
    productFamily: 'quilha-fcs-ii-accelerator-neo-glass',
    size: 'M',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_NG_TRI,
    gtin: '9340935060719',
    weight: 150,
    color: 'Red',
    colorCode: '#DC2626',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Quilha FCS II Accelerator Neo Glass Tri Medium — colorway Red (vermelho vibrante). Template raked com mais sweep que a Performer, ideal para surfistas que querem drive máximo na saída do bottom.',
      family: 'accelerator',
      material: 'neoGlass',
      features: [
        'Template Accelerator com sweep elevado',
        'Construção Neo Glass EcoBlend (eco-friendly)',
        'Drive excepcional na saída do bottom + controle em ondas críticas',
        'Ideal para ondas mais cavadas e steep',
        'Cor: Red (vermelho vibrante)',
      ],
      size: 'Medium',
      weight: '65-80 kg / 145-175 lbs',
      conditions: 'Ondas cavadas e steep, ondas críticas overhead.',
    }),
  },

  // ─── #5 Carver NG Medium Eucalyptus ───
  {
    sku: 'FCAR-NG05-MD-TS-R',
    name: 'Quilha FCS II Carver Neo Glass Tri Medium Eucalyptus',
    productFamily: 'quilha-fcs-ii-carver-neo-glass',
    size: 'M',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_NG_TRI,
    gtin: '9340935073597',
    weight: 155,
    color: 'Eucalyptus',
    colorCode: '#10B981',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Quilha FCS II Carver Neo Glass Tri Medium — colorway Eucalyptus (verde oliva). Template alongado com alto grau de sweep — ideal para surfistas que vivem para o carve.',
      family: 'carver',
      material: 'neoGlass',
      features: [
        'Template Carver alongado com sweep elevado',
        'Construção Neo Glass EcoBlend (eco-friendly)',
        'Hold excepcional na saída do bottom e em carves longos',
        'Ideal para parede aberta, point breaks e reef breaks',
        'Cor: Eucalyptus (verde oliva)',
      ],
      size: 'Medium',
      weight: '65-80 kg / 145-175 lbs',
      conditions:
        'Ondas de parede aberta, point breaks e reef breaks. Brilha em ondas para rasgar.',
    }),
  },

  // ─── #6 Carver NG Large Eucalyptus ───
  {
    sku: 'FCAR-NG05-LG-TS-R',
    name: 'Quilha FCS II Carver Neo Glass Tri Large Eucalyptus',
    productFamily: 'quilha-fcs-ii-carver-neo-glass',
    size: 'L',
    isMainVariant: false,
    isFeatured: false,
    price: PRICE_NG_TRI,
    gtin: '9340935073603',
    weight: 165,
    color: 'Eucalyptus',
    colorCode: '#10B981',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Quilha FCS II Carver Neo Glass Tri Large — colorway Eucalyptus (verde oliva). Template Carver em tamanho Large para surfistas mais pesados que querem hold máximo em carves longos.',
      family: 'carver',
      material: 'neoGlass',
      features: [
        'Template Carver alongado com sweep elevado',
        'Construção Neo Glass EcoBlend (eco-friendly)',
        'Hold máximo para power surfers',
        'Ideal para parede aberta e point breaks',
        'Cor: Eucalyptus (verde oliva)',
      ],
      size: 'Large',
      weight: '75-95 kg / 165-210 lbs',
      conditions: 'Ondas de parede aberta, point breaks e reef breaks.',
    }),
  },

  // ─── #40 Carver NG Large (NG01) ───
  {
    sku: 'FCAR-NG01-LG-TS-R',
    name: 'Quilha FCS II Carver Neo Glass Tri Large',
    productFamily: 'quilha-fcs-ii-carver-neo-glass',
    size: 'L',
    isMainVariant: false,
    isFeatured: false,
    price: PRICE_STD,
    gtin: '9340935031478',
    weight: 160,
    color: '',
    colorCode: '',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Quilha FCS II Carver Neo Glass Tri Large — versão NG01 (safra anterior). Template Carver clássico para power surfers em construção Neo Glass.',
      family: 'carver',
      material: 'neoGlass',
      features: [
        'Template Carver alongado com sweep elevado',
        'Construção Neo Glass — fibra de vidro de fio longo',
        'Hold máximo em carves longos',
        'Ideal para parede aberta e point breaks',
      ],
      size: 'Large',
      weight: '75-95 kg / 165-210 lbs',
      conditions: 'Ondas de parede aberta, point breaks e reef breaks.',
    }),
  },

  // ─── #35 Performer PC Large Mango ───
  {
    sku: 'FPER-PC05-LG-TS-R',
    name: 'Quilha FCS II Performer PC Tri Large Mango',
    productFamily: 'quilha-fcs-ii-performer-pc',
    size: 'L',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_PER_PC_LG,
    gtin: '9340935062317',
    weight: 150,
    color: 'Mango',
    colorCode: '#F97316',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Quilha FCS II Performer PC Tri Large — colorway Mango (laranja vibrante). A quilha all-round mais vendida da FCS em Performance Core, versão Large para surfistas mais pesados.',
      family: 'performer',
      material: 'pc',
      features: [
        'Template Performer com Inside Foil Technology (IFT)',
        'Construção Performance Core (PC) — leve com flex progressivo',
        'Equilíbrio ideal entre velocidade, fluidez e resposta',
        'Versátil em ampla gama de condições',
        'Cor: Mango (laranja vibrante)',
      ],
      size: 'Large',
      weight: '75-95 kg / 165-210 lbs',
      conditions: 'Ampla variedade — de beach breaks a point breaks.',
    }),
  },

  // ─── #7 Performer PC Quad Rear Large Tranquil Blue ───
  {
    sku: 'FPER-PC06-LG-RS-R',
    name: 'Quilha FCS II Performer PC Quad Rear Large Tranquil Blue',
    productFamily: 'quilha-fcs-ii-performer-pc-quad-rear',
    size: 'L',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_PC_QR,
    gtin: '9340935074280',
    weight: 95,
    color: 'Tranquil Blue',
    colorCode: '#0EA5E9',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Par de quilhas traseiras Quad Rear FCS II Performer PC Large — colorway Tranquil Blue (azul claro). Complementa seu setup quad com versatilidade e drive consistente.',
      family: 'performer',
      material: 'pc',
      features: [
        'Par de Quad Rears (2 quilhas traseiras) para setup de 4 quilhas',
        'Template Performer balanceado',
        'Construção Performance Core (PC) leve e responsiva',
        'Inside Foil Technology (IFT)',
        'Cor: Tranquil Blue (azul claro)',
      ],
      size: 'Large',
      weight: '75-95 kg',
      conditions: 'Versátil em todas as condições.',
      setup:
        'ATENÇÃO: Embalagem contém APENAS 2 quilhas traseiras (Quad Rear). Para montar setup quad você precisa de 2 quilhas laterais FCS II adicionais.',
    }),
  },

  // ─── #10 Performer NG Quad Rear Medium Pacific ───
  {
    sku: 'FPER-NG04-MD-RS-R',
    name: 'Quilha FCS II Performer Neo Glass Quad Rear Medium Pacific',
    productFamily: 'quilha-fcs-ii-performer-neo-glass-quad-rear',
    size: 'M',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_NG_QR,
    gtin: '9340935060795',
    weight: 85,
    color: 'Pacific',
    colorCode: '#1E40AF',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Par de quilhas traseiras Quad Rear FCS II Performer Neo Glass Medium — colorway Pacific (azul). Versão eco-friendly em Neo Glass EcoBlend.',
      family: 'performer',
      material: 'neoGlass',
      features: [
        'Par de Quad Rears (2 quilhas traseiras)',
        'Template Performer balanceado',
        'Construção Neo Glass EcoBlend (sustentável)',
        'Cor: Pacific (azul oceânico)',
      ],
      size: 'Medium',
      weight: '65-80 kg',
      conditions: 'Versátil em beach breaks e point breaks.',
      setup:
        'ATENÇÃO: Embalagem contém APENAS 2 quilhas traseiras (Quad Rear).',
    }),
  },

  // ─── #8 Carver PC Quad Rear Medium Eucalyptus ───
  {
    sku: 'FCAR-PC05-MD-RS-R',
    name: 'Quilha FCS II Carver PC Quad Rear Medium Eucalyptus',
    productFamily: 'quilha-fcs-ii-carver-pc-quad-rear',
    size: 'M',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_PC_QR,
    gtin: '9340935074334',
    weight: 90,
    color: 'Eucalyptus',
    colorCode: '#10B981',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Par de quilhas traseiras Quad Rear FCS II Carver PC Medium — colorway Eucalyptus (verde). Template Carver alongado para hold máximo em carves longos.',
      family: 'carver',
      material: 'pc',
      features: [
        'Par de Quad Rears (2 quilhas traseiras)',
        'Template Carver alongado com sweep elevado',
        'Construção Performance Core (PC)',
        'Hold excepcional para carves',
        'Cor: Eucalyptus (verde oliva)',
      ],
      size: 'Medium',
      weight: '65-80 kg',
      conditions: 'Parede aberta, point breaks, reef breaks.',
      setup:
        'ATENÇÃO: Embalagem contém APENAS 2 quilhas traseiras (Quad Rear).',
    }),
  },

  // ─── #9 H4 Uni-Carbon Large Smoke ───
  {
    sku: 'FH4-CC01-LG-TS-R',
    name: 'Quilha FCS II H4 Uni-Carbon Tri Large Smoke',
    productFamily: 'quilha-fcs-ii-h4-tri',
    size: 'L',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_H4,
    gtin: '9340935028405',
    weight: 130,
    color: 'Smoke',
    colorCode: '#1F2937',
    colorCode2: '',
    description: buildDescription({
      intro:
        'Quilha FCS II H4 Uni-Carbon Tri Large — colorway Smoke (preto fumê). A quilha topo de linha da FCS, fabricada na Suíça com tecido de carbono unidirecional para resposta instantânea.',
      family: 'performer',
      material: 'uniCarbon',
      features: [
        'Template H4 desenhado pelo time FCS em colaboração com surfistas do CT',
        'Construção Uni-Carbon (Swiss Made) — premium absoluto',
        'Recuperação de flex instantânea',
        'Feedback ultra-preciso em cada turn',
        'Cor: Smoke (preto fumê translúcido)',
      ],
      size: 'Large',
      weight: '75-95 kg / 165-210 lbs',
      conditions:
        'Excelente em qualquer condição. Performance máxima em ondas críticas overhead.',
    }),
  },

  // ─── #11 MR Twin+1 NG M-L Cyber Lime ───
  {
    sku: 'FMR-NG02-ML-TS-R',
    name: 'Quilha FCS II MR Twin+1 Neo Glass M-L Cyber Lime',
    productFamily: 'quilha-fcs-ii-mr-twin-stabilizer-neo-glass',
    size: 'M-L',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935074662',
    weight: 170,
    color: 'Cyber Lime/Black',
    colorCode: '#C5E834',
    colorCode2: '#000000',
    description: [
      'Quilha FCS II MR (Mark Richards) Twin + Stabilizer Neo Glass M-L — colorway Cyber Lime/Black.',
      '',
      'O template lendário de Mark Richards — 4x campeão mundial (1979-1982) e pioneiro do setup twin fin — agora em construção Neo Glass EcoBlend™. Drive e velocidade excepcionais das laterais twin, com quilha estabilizadora central pequena que adiciona controle sem comprometer a liberdade do setup duplo.',
      '',
      'Specialty Series — Mark Richards',
      'Mark Richards revolucionou o surfe com seu uso pioneiro do twin fin nos anos 70 e 80. Esta quilha-assinatura traz o DNA daquela era para pranchas modernas.',
      '',
      'Características Principais',
      '- Twin + Stabilizer: 2 laterais grandes + 1 central pequena',
      '- Template MR clássico — drive e velocidade ao estilo retro',
      '- Construção Neo Glass EcoBlend (eco-friendly)',
      '- Ideal para fish, mid-lengths e twins modernos',
      '- Cor: Cyber Lime/Black (verde-limão neon com preto)',
      '',
      DESC_BLOCKS.neoGlass,
      '',
      'Condições Ideais',
      'Beach breaks divertidos, ondas com face plana, point breaks suaves. Sweet spot em ondas cintura-peito.',
      '',
      'Tamanho: M-L (recomendado para surfistas 65-90 kg / 145-200 lbs)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (2 laterais + 1 estabilizador).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #12 MR Twin+1 NG XL Smoke ───
  {
    sku: 'FMRX-NG02-XL-TS-R',
    name: 'Quilha FCS II MR Twin+1 Neo Glass XL Smoke',
    productFamily: 'quilha-fcs-ii-mr-twin-stabilizer-neo-glass',
    size: 'XL',
    isMainVariant: false,
    isFeatured: true,
    price: PRICE_MR_SMOKE,
    gtin: '9340935074044',
    weight: 180,
    color: 'Smoke',
    colorCode: '#1F2937',
    colorCode2: '',
    description: [
      'Quilha FCS II MR (Mark Richards) Twin + Stabilizer Neo Glass XL — colorway Smoke (preto fumê).',
      '',
      'Template lendário do 4x campeão mundial Mark Richards, agora em tamanho XL para surfistas mais pesados. Construção Neo Glass EcoBlend™ — sustentável e com flex consistente.',
      '',
      'Specialty Series — Mark Richards (4x World Champion 1979-1982)',
      '',
      'Características Principais',
      '- Twin + Stabilizer (3 quilhas)',
      '- Template MR icônico em tamanho XL',
      '- Construção Neo Glass EcoBlend',
      '- Cor: Smoke (preto fumê translúcido)',
      '',
      DESC_BLOCKS.neoGlass,
      '',
      'Tamanho: XL (recomendado para surfistas 75+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (2 laterais + 1 estabilizador).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #13 Power Twin PC XL Coke ───
  {
    sku: 'FPTX-PC04-XL-SS-R',
    name: 'Quilha FCS II Power Twin PC XL Coke',
    productFamily: 'quilha-fcs-ii-power-twin-pc',
    size: 'XL',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_TWIN,
    gtin: '9340935074051',
    weight: 140,
    color: 'Coke',
    colorCode: '#A0522D',
    colorCode2: '',
    description: [
      'Quilha FCS II Power Twin PC XL — colorway Coke (âmbar caramelo).',
      '',
      'O Power Twin tem a maior área de superfície da linha FCS Twin, projetado por Harley Ingleby para entregar drive máximo e estabilidade em pranchas twin modernas. Construção Performance Core leve com flex progressivo.',
      '',
      'Specialty Series — Power Twin',
      'Designed by Harley Ingleby. Maior área de toda a linha twin da FCS — perfeito para mid-lengths e twin fishes de volume mais alto.',
      '',
      'Características Principais',
      '- Setup TWIN puro (2 quilhas — sem estabilizador)',
      '- Maior área de toda a linha FCS Twin',
      '- Construção Performance Core (PC)',
      '- Drive máximo para mid-lengths e twins de alto volume',
      '- Cor: Coke (âmbar/caramelo translúcido)',
      '',
      DESC_BLOCKS.pc,
      '',
      'Tamanho: XL (recomendado para surfistas 75+ kg / 165+ lbs)',
      '',
      'Embalagem contém 1 jogo com 2 quilhas (Twin).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #14 AM CI Robber PC Twin+1 XL B/W ───
  {
    sku: 'FAMX-PC02-XL-TS-R',
    name: 'Quilha FCS II AM Channel Islands "The Robber" PC Twin+1 XL Black/White',
    productFamily: 'quilha-fcs-ii-am-channel-islands-twin-stabilizer-pc',
    size: 'XL',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_TWIN,
    gtin: '9340935039173',
    weight: 165,
    color: 'Black/White',
    colorCode: '#000000',
    colorCode2: '#FFFFFF',
    description: [
      'Quilha FCS II AM (Al Merrick / Channel Islands) "The Robber" PC Twin + Stabilizer XL — colorway Black/White.',
      '',
      'Quilha-assinatura do lendário Al Merrick, fundador da Channel Islands Surfboards. Baseada no template "The Robber" da CI — a quilha twin de MENOR área da linha FCS, desenhada para pivot e release excepcionais em twins modernos.',
      '',
      'Shaper Series — Al Merrick (Channel Islands)',
      'Al Merrick é o shaper mais influente da história do surfe moderno — pranchas equipam (e equiparam) Kelly Slater, Tom Curren, Dane Reynolds, Lakey Peterson, Bobby Martinez. Esta quilha foi desenvolvida especificamente para complementar os modelos twin da CI.',
      '',
      'Características Principais',
      '- Twin + Stabilizer (3 quilhas)',
      '- Quilha de MENOR ÁREA da linha twin FCS',
      '- Template "The Robber" da Channel Islands',
      '- Construção Performance Core (PC)',
      '- Pivot e release excepcionais',
      '- Cor: Black/White',
      '',
      DESC_BLOCKS.pc,
      '',
      'Tamanho: XL (recomendado para surfistas 75+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (2 laterais + 1 estabilizador).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #15 MB Matt Biolos PCC Medium Blue/Black ───
  {
    sku: 'FMBM-CC04-MD-TS-R',
    name: 'Quilha FCS II MB Matt Biolos PCC Medium Blue/Black',
    productFamily: 'quilha-fcs-ii-mb-matt-biolos-pcc',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935010516',
    weight: 140,
    color: 'Blue/Black',
    colorCode: '#1E40AF',
    colorCode2: '#000000',
    description: [
      'Quilha FCS II MB (Matt "Mayhem" Biolos) Performance Core Carbon Medium — colorway Blue/Black (azul marmorizado).',
      '',
      'Quilha-assinatura de Matt Biolos, fundador da ...Lost Surfboards. Combinação vibrante de drive, sustentação e manobrabilidade em construção PCC — a mais responsiva da linha FCS.',
      '',
      'Shaper Series — Matt "Mayhem" Biolos',
      'Matt Biolos é um dos shapers mais inovadores do surfe moderno. Suas pranchas equipam Mason Ho, Yago Dora e Caroline Marks. O template MB carrega o DNA do shape: versatilidade entre velocidade pura e turns curtos no pocket.',
      '',
      'Família Reactor: Find Speed',
      'Velocidade, turns curtos e snaps explosivos.',
      '',
      'Características Principais',
      '- Template MB com geometria balanceada',
      '- Base curta + profundidade alta — favorece pivot e reação rápida',
      '- Construção PCC com inlay de carbono',
      '- Drive sólido + soltura no pocket',
      '- Cor: Blue/Black (azul marmorizado com base preta)',
      '',
      DESC_BLOCKS.pcc,
      '',
      'Condições Ideais',
      'Ampla variedade, especialmente boa em ondas críticas overhead. Funciona em parede longa e pocket apertado.',
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg / 130-175 lbs)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #36 MB Matt Biolos PCC Large Red/Black ───
  {
    sku: 'FMBL-CC04-LG-TS-R',
    name: 'Quilha FCS II MB Matt Biolos PCC Large Red/Black',
    productFamily: 'quilha-fcs-ii-mb-matt-biolos-pcc',
    size: 'L',
    isMainVariant: false,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935010813',
    weight: 145,
    color: 'Red/Black',
    colorCode: '#DC2626',
    colorCode2: '#000000',
    description: [
      'Quilha FCS II MB (Matt "Mayhem" Biolos) Performance Core Carbon Large — colorway Red/Black (vermelho marmorizado).',
      '',
      'Quilha-assinatura de Matt Biolos (...Lost Surfboards), versão Large para surfistas potentes. Construção PCC — a mais responsiva da linha FCS, com inlay de carbono para resposta ultra-rápida.',
      '',
      'Shaper Series — Matt "Mayhem" Biolos (...Lost Surfboards)',
      '',
      'Família Reactor: Find Speed',
      '',
      'Características Principais',
      '- Template MB com geometria balanceada',
      '- Construção PCC (Performance Core Carbon)',
      '- Drive sólido + soltura no pocket',
      '- Recomendado para Powerful Surfers',
      '- Cor: Red/Black (vermelho marmorizado)',
      '',
      DESC_BLOCKS.pcc,
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #16 HS Haydenshapes PCC Medium W/G ───
  {
    sku: 'FHSM-CC01-MD-TS-R',
    name: 'Quilha FCS II HS Haydenshapes PCC Medium White/Green',
    productFamily: 'quilha-fcs-ii-hs-haydenshapes-pcc',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935028115',
    weight: 140,
    color: 'White/Green',
    colorCode: '#FFFFFF',
    colorCode2: '#10B981',
    description: [
      'Quilha FCS II HS (Haydenshapes / Hayden Cox) Performance Core Carbon Medium — colorway White/Green.',
      '',
      'Quilha-assinatura de Hayden Cox, fundador da Haydenshapes Surfboards. Template raked moderno desenhado para complementar os modelos icônicos da HS — Hypto Krypto, Holy Grail, White Noiz. Construção PCC para resposta ultra-rápida.',
      '',
      'Shaper Series — Hayden Cox / Haydenshapes',
      'Hayden Cox revolucionou o design de pranchas com a Hypto Krypto, modelo all-rounder mais vendido da última década. A quilha HS traduz o DNA das suas pranchas em foil precise.',
      '',
      'Características Principais',
      '- Template HS com rake moderado',
      '- Construção PCC com carbono',
      '- Drive forte + manobrabilidade fluida',
      '- Ideal para pranchas hybrid e shortboards modernos',
      '- Cor: White/Green',
      '',
      DESC_BLOCKS.pcc,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #17 CI Channel Islands PC Medium White/Orange ───
  {
    sku: 'FCIM-PC02-MD-TS-R',
    name: 'Quilha FCS II CI Channel Islands PC Medium White/Orange',
    productFamily: 'quilha-fcs-ii-ci-channel-islands-pc',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935043774',
    weight: 145,
    color: 'White/Orange',
    colorCode: '#FFFFFF',
    colorCode2: '#F97316',
    description: [
      'Quilha FCS II CI (Channel Islands) Performance Core Medium — colorway White/Orange.',
      '',
      'Quilha-assinatura da Channel Islands Surfboards, fundada por Al Merrick. Template raked desenhado para o surfe radical e progressivo das pranchas CI. Laterais com sweep elevado para drive máximo + central downsized para tail release rápido.',
      '',
      'Shaper Series — Channel Islands',
      'Pranchas CI equipam (e equiparam) Kelly Slater, Tom Curren, Dane Reynolds, Conner Coffin. Esta quilha foi desenvolvida para complementar shortboards CI performance.',
      '',
      'Características Principais',
      '- Template CI com alto sweep e ponta estreita alongada',
      '- Quilha central downsized para release rápido',
      '- Construção Performance Core (PC)',
      '- Foil flat nas laterais',
      '- Cor: White/Orange',
      '',
      DESC_BLOCKS.pc,
      '',
      'Condições Ideais',
      'Ondas ocas e steep, beach breaks com punch. Excelente para surfe progressivo.',
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster — 2 laterais + 1 central downsized).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #29 CI Channel Islands PC Large White/Flame ───
  {
    sku: 'FCIL-PC04-LG-TS-R',
    name: 'Quilha FCS II CI Channel Islands PC Large White/Flame',
    productFamily: 'quilha-fcs-ii-ci-channel-islands-pc',
    size: 'L',
    isMainVariant: false,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935074679',
    weight: 155,
    color: 'White/Flame',
    colorCode: '#FFFFFF',
    colorCode2: '#EF4444',
    description: [
      'Quilha FCS II CI (Channel Islands) Performance Core Large — colorway White/Flame (branco com vermelho-laranja).',
      '',
      'Template CI em tamanho Large para surfistas mais pesados. Laterais raked para drive máximo + central downsized para tail release ágil.',
      '',
      'Shaper Series — Channel Islands (fundada por Al Merrick)',
      '',
      'Características Principais',
      '- Template CI com alto sweep',
      '- Quilha central downsized',
      '- Construção Performance Core (PC)',
      '- Surf radical e progressivo',
      '- Cor: White/Flame',
      '',
      DESC_BLOCKS.pc,
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #18 MR Freeride PG Twin XL B/W/R ───
  {
    sku: 'FMRX-PG02-XL-SS-R',
    name: 'Quilha FCS II MR Freeride PG Twin XL Blue/White/Red',
    productFamily: 'quilha-fcs-ii-mr-freeride-pg-twin',
    size: 'XL',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935074068',
    weight: 175,
    color: 'Blue/White/Red',
    colorCode: '#1E40AF',
    colorCode2: '#DC2626',
    description: [
      'Quilha FCS II MR Freeride Performance Glass Twin XL — colorway Blue/White/Red (azul/branco/vermelho).',
      '',
      'Versão Freeride do template Mark Richards em construção Performance Glass (fibra de vidro sólida) — material mais rígido da linha FCS, com rake elevado para freeride clássico em pranchas mid-length e fish vintage.',
      '',
      'Specialty Series — MR Freeride',
      'A versão "Freeride" da assinatura Mark Richards traz mais rake e área para um feeling clássico de twin fin — ideal para mid-lengths, fish vintage e ondas longas tipo point break.',
      '',
      'Características Principais',
      '- Setup TWIN puro (2 quilhas)',
      '- Template MR Freeride com rake elevado',
      '- Construção Performance Glass (PG) — máxima rigidez',
      '- Drive consistente para ondas longas',
      '- Cor: Blue/White/Red',
      '',
      DESC_BLOCKS.pg,
      '',
      'Tamanho: XL (recomendado para surfistas 75+ kg)',
      '',
      'Embalagem contém 1 jogo com 2 quilhas (Twin).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #19 GM Gabriel Medina PC AirCore Medium Fireball ───
  {
    sku: 'FGMM-PC02-MD-TS-R',
    name: 'Quilha FCS II GM Gabriel Medina PC AirCore Medium Fireball',
    productFamily: 'quilha-fcs-ii-gm-gabriel-medina-pc-aircore',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935081639',
    weight: 140,
    color: 'Fireball',
    colorCode: '#DC2626',
    colorCode2: '#000000',
    description: [
      'Quilha FCS II GM (Gabriel Medina) PC AirCore Medium — colorway Fireball (vermelho/preto fogo).',
      '',
      'Quilha-assinatura do tricampeão mundial brasileiro Gabriel Medina. Template GM Performer com padrão de flex customizado e quilha central downsized para soltura adicional no tail.',
      '',
      'Athlete Series — Gabriel Medina',
      'Tricampeão mundial da WSL (2014, 2018, 2021) e medalha de prata olímpica em Tóquio 2020 — o maior surfista brasileiro de todos os tempos. Suas três conquistas mundiais foram alcançadas com o template Performer da FCS, agora atualizado com flex pattern customizado.',
      '',
      'Família Performer: Find Balance',
      '',
      'Características Principais',
      '- Template Performer com flex GM customizado',
      '- Quilha central downsized para tail release',
      '- Construção PC + AirCore (entre PC e PC Carbon)',
      '- Inside Foil Technology (IFT)',
      '- Balance ideal de drive, power e flair',
      '- Cor: Fireball (vermelho/preto fogo)',
      '',
      DESC_BLOCKS.pcAircore,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #45 GM Gabriel Medina PC AirCore XL Blue ───
  {
    sku: 'FGMX-PC01-XL-TS-R',
    name: 'Quilha FCS II GM Gabriel Medina PC AirCore XL Blue',
    productFamily: 'quilha-fcs-ii-gm-gabriel-medina-pc-aircore',
    size: 'XL',
    isMainVariant: false,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935081622',
    weight: 145,
    color: 'Blue',
    colorCode: '#1E40AF',
    colorCode2: '',
    description: [
      'Quilha FCS II GM (Gabriel Medina) PC AirCore XL — colorway Blue (azul vibrante).',
      '',
      'Quilha-assinatura do tricampeão mundial Gabriel Medina em tamanho XL (90+ kg). Template GM Performer com flex pattern customizado e quilha central downsized.',
      '',
      'Athlete Series — Gabriel Medina (Tricampeão Mundial WSL 2014, 2018, 2021)',
      '',
      'Características Principais',
      '- Template Performer com flex GM customizado',
      '- Quilha central downsized',
      '- Construção PC + AirCore',
      '- Inside Foil Technology (IFT)',
      '- Tamanho XL para surfistas pesados',
      '- Cor: Blue (azul vibrante)',
      '',
      DESC_BLOCKS.pcAircore,
      '',
      'Tamanho: XLarge (recomendado para surfistas 90+ kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #20 SE Sharpeye PC Medium Black/Red Dots ───
  {
    sku: 'FSEM-PC01-MD-TS-R',
    name: 'Quilha FCS II SE Sharpeye PC Medium Black/Red',
    productFamily: 'quilha-fcs-ii-se-sharpeye-pc',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935073566',
    weight: 145,
    color: 'Black/Red',
    colorCode: '#000000',
    colorCode2: '#DC2626',
    description: [
      'Quilha FCS II SE (Sharpeye / Marcio Zouvi) PC Medium — colorway Black/Red Dots.',
      '',
      'Quilha-assinatura de Marcio Zouvi, fundador da Sharpeye Surfboards. Template desenvolvido em parceria com surfistas da CT como Filipe Toledo e Kanoa Igarashi — entrega drive consistente e responsividade explosiva.',
      '',
      'Shaper Series — Marcio Zouvi / Sharpeye',
      'Sharpeye Surfboards é uma das marcas mais hot do mundo, com modelos como Storms 77, Disco, Modern 2 surfados por campeões mundiais.',
      '',
      'Características Principais',
      '- Template SE com sweep moderado',
      '- Construção Performance Core (PC)',
      '- Drive forte + responsividade explosiva',
      '- Ideal para shortboards modernos performance',
      '- Cor: Black/Red Dots',
      '',
      DESC_BLOCKS.pc,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #21 SE Sharpeye PCC AirCore Medium B/W ───
  {
    sku: 'FSEM-PC02-MD-TS-R',
    name: 'Quilha FCS II SE Sharpeye PCC AirCore Medium Black/White',
    productFamily: 'quilha-fcs-ii-se-sharpeye-pcc-aircore',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935073573',
    weight: 135,
    color: 'Black/White',
    colorCode: '#000000',
    colorCode2: '#FFFFFF',
    description: [
      'Quilha FCS II SE (Sharpeye / Marcio Zouvi) PCC AirCore Medium — colorway Black/White.',
      '',
      'Versão premium da quilha SE em PCC AirCore — combinação de tecido de carbono estratégico + núcleo AirCore ultraleve. Resposta explosiva com peso reduzido.',
      '',
      'Shaper Series — Marcio Zouvi / Sharpeye Surfboards',
      '',
      'Características Principais',
      '- Template SE com sweep moderado',
      '- Construção PCC AirCore (premium ultraleve)',
      '- Resposta explosiva + leveza extrema',
      '- Inlay de carbono estratégico',
      '- Cor: Black/White',
      '',
      DESC_BLOCKS.pccAircore,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #28 SE Sharpeye PCC AirCore Large B/W ───
  {
    sku: 'FSEL-PC02-LG-TS-R',
    name: 'Quilha FCS II SE Sharpeye PCC AirCore Large Black/White',
    productFamily: 'quilha-fcs-ii-se-sharpeye-pcc-aircore',
    size: 'L',
    isMainVariant: false,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935073580',
    weight: 150,
    color: 'Black/White',
    colorCode: '#000000',
    colorCode2: '#FFFFFF',
    description: [
      'Quilha FCS II SE (Sharpeye / Marcio Zouvi) PCC AirCore Large — colorway Black/White.',
      '',
      'Versão premium da quilha SE em PCC AirCore, tamanho Large para surfistas mais pesados. Resposta explosiva com peso reduzido.',
      '',
      'Shaper Series — Marcio Zouvi / Sharpeye Surfboards',
      '',
      'Características Principais',
      '- Template SE com sweep moderado',
      '- Construção PCC AirCore (premium ultraleve)',
      '- Resposta explosiva + leveza',
      '- Cor: Black/White',
      '',
      DESC_BLOCKS.pccAircore,
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #22 SF Sally Fitzgibbons PC Medium Dusty Pink ───
  {
    sku: 'FSFM-PC03-MD-TS-R',
    name: 'Quilha FCS II SF Sally Fitzgibbons PC Medium Dusty Pink',
    productFamily: 'quilha-fcs-ii-sf-sally-fitzgibbons-pc',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935073856',
    weight: 140,
    color: 'Dusty Pink',
    colorCode: '#F9A8D4',
    colorCode2: '',
    description: [
      'Quilha FCS II SF (Sally Fitzgibbons) PC Medium — colorway Dusty Pink (rosa suave).',
      '',
      'Quilha-assinatura da australiana Sally Fitzgibbons — uma das veteranas mais respeitadas da WSL. Template desenhado para o estilo potente e técnico da Sally, com drive consistente em ondas de beach break.',
      '',
      'Athlete Series — Sally Fitzgibbons',
      'Sally Fitzgibbons é uma das surfistas mais consistentes da história da WSL, vencedora de múltiplos eventos do CT, com participação em duas Olimpíadas. Sua quilha-assinatura entrega o equilíbrio perfeito entre potência e responsividade.',
      '',
      'Características Principais',
      '- Template SF balanceado',
      '- Construção Performance Core (PC)',
      '- Drive consistente em beach breaks',
      '- Athlete Series WSL',
      '- Cor: Dusty Pink (rosa suave)',
      '',
      DESC_BLOCKS.pc,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #23 MF Mick Fanning PC Medium Charcoal/Lavender ───
  {
    sku: 'FMFM-PC04-MD-TS-R',
    name: 'Quilha FCS II MF Mick Fanning PC Medium Charcoal/Lavender',
    productFamily: 'quilha-fcs-ii-mf-mick-fanning-pc',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935073825',
    weight: 145,
    color: 'Charcoal/Lavender',
    colorCode: '#36454F',
    colorCode2: '#B57EDC',
    description: [
      'Quilha FCS II MF (Mick Fanning) PC Medium — colorway Charcoal/Lavender (carvão com lilás).',
      '',
      'Quilha-assinatura do tricampeão mundial Mick Fanning. Template MF com base alongada e sweep elevado — projetado para drive máximo na saída do bottom e cutbacks longos no roundhouse.',
      '',
      'Athlete Series — Mick Fanning',
      'Tricampeão mundial WSL (2007, 2009, 2013), referência mundial em power surfing. Sua quilha-assinatura traduz o estilo: drive consistente, controle no rail e bursts de aceleração.',
      '',
      'Família Carver: Find Power',
      '',
      'Características Principais',
      '- Template MF com base alongada e sweep elevado',
      '- Construção Performance Core (PC)',
      '- Drive máximo + carve longo',
      '- Ideal para parede aberta e point breaks',
      '- Cor: Charcoal/Lavender',
      '',
      DESC_BLOCKS.pc,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #24 MF Mick Fanning PC Medium Black/White ───
  {
    sku: 'FMFM-PC03-MD-TS-R',
    name: 'Quilha FCS II MF Mick Fanning PC Medium Black/White',
    productFamily: 'quilha-fcs-ii-mf-mick-fanning-pc',
    size: 'M',
    isMainVariant: false,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935073832',
    weight: 145,
    color: 'Black/White',
    colorCode: '#000000',
    colorCode2: '#FFFFFF',
    description: [
      'Quilha FCS II MF (Mick Fanning) PC Medium — colorway Black/White.',
      '',
      'Quilha-assinatura do tricampeão mundial Mick Fanning, agora em colorway clássico Black/White. Template MF para power surfing — drive máximo e carves potentes.',
      '',
      'Athlete Series — Mick Fanning (Tricampeão Mundial WSL 2007, 2009, 2013)',
      '',
      'Características Principais',
      '- Template MF com base alongada e sweep elevado',
      '- Construção Performance Core (PC)',
      '- Drive máximo + roundhouse longo',
      '- Cor: Black/White',
      '',
      DESC_BLOCKS.pc,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #37 MF Mick Fanning PC Large Black/Mango ───
  {
    sku: 'FMFL-PC05-LG-TS-R',
    name: 'Quilha FCS II MF Mick Fanning PC Large Black/Mango',
    productFamily: 'quilha-fcs-ii-mf-mick-fanning-pc',
    size: 'L',
    isMainVariant: false,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935073849',
    weight: 150,
    color: 'Black/Mango',
    colorCode: '#000000',
    colorCode2: '#F97316',
    description: [
      'Quilha FCS II MF (Mick Fanning) PC Large — colorway Black/Mango (preto com laranja).',
      '',
      'Quilha-assinatura do tricampeão mundial Mick Fanning em tamanho Large. Drive máximo + carves potentes para power surfers.',
      '',
      'Athlete Series — Mick Fanning',
      '',
      'Características Principais',
      '- Template MF com base alongada e sweep elevado',
      '- Construção Performance Core (PC)',
      '- Drive máximo + roundhouse longo',
      '- Cor: Black/Mango',
      '',
      DESC_BLOCKS.pc,
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #25 Carver Essential PCC AirCore Medium Black/Acid ───
  {
    sku: 'FCAR-CC03-MD-TS-R',
    name: 'Quilha FCS II Carver Essential PCC AirCore Medium Black/Acid',
    productFamily: 'quilha-fcs-ii-carver-pcc-aircore',
    size: 'M',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_STD,
    gtin: '9340935074648',
    weight: 135,
    color: 'Black/Acid',
    colorCode: '#000000',
    colorCode2: '#D4FF00',
    description: [
      'Quilha FCS II Carver Essential PCC AirCore Medium — colorway Black/Acid (preto com amarelo neon).',
      '',
      'Template Carver Essential em construção premium PCC AirCore — combinação de tecido de carbono estratégico + núcleo AirCore ultraleve. Hold máximo dos carves com peso reduzido e resposta ultra-rápida.',
      '',
      'Família Carver: Find Power',
      '',
      'Características Principais',
      '- Template Carver alongado com sweep elevado',
      '- Construção PCC AirCore (premium)',
      '- Resposta explosiva + leveza',
      '- Ideal para parede aberta e point breaks',
      '- Cor: Black/Acid (preto com amarelo neon)',
      '',
      DESC_BLOCKS.pccAircore,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #26 FT Filipe Toledo PC AirCore Large Black/Red ───
  {
    sku: 'FFTL-PC05-LG-TS-R',
    name: 'Quilha FCS II FT Filipe Toledo PC AirCore Large Black/Red',
    productFamily: 'quilha-fcs-ii-ft-filipe-toledo-pc-aircore',
    size: 'L',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935081677',
    weight: 145,
    color: 'Black/Red',
    colorCode: '#000000',
    colorCode2: '#DC2626',
    description: [
      'Quilha FCS II FT (Filipe Toledo) PC AirCore Large — colorway Black/Red.',
      '',
      'Quilha-assinatura do bicampeão mundial Filipe Toledo em construção PC AirCore — ultraleve com flex pattern manipulável. Template do Filipinho desenhado para o estilo aéreo-progressivo e velocidade em ondas rápidas.',
      '',
      'Athlete Series — Filipe Toledo',
      'Bicampeão Mundial da WSL (2022 e 2023), Filipinho é referência mundial em surfe aéreo-progressivo. Sua quilha-assinatura acompanha o estilo explosivo: drive na saída do bottom, soltura no topo, liberdade total para aéreos.',
      '',
      'Características Principais',
      '- Template Filipe Toledo com rake elevado',
      '- Construção PC + AirCore (ultraleve)',
      '- Drive excepcional + soltura no topo',
      '- Ideal para shortboards performance',
      '- Cor: Black/Red',
      '',
      DESC_BLOCKS.pcAircore,
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #27 FT Filipe Toledo PG PRO Medium Black/Acid ───
  {
    sku: 'FFTM-PG01-MD-TS-R',
    name: 'Quilha FCS II FT Filipe Toledo PG PRO Medium Black/Acid',
    productFamily: 'quilha-fcs-ii-ft-filipe-toledo-pg-pro',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935081684',
    weight: 155,
    color: 'Black/Acid',
    colorCode: '#000000',
    colorCode2: '#D4FF00',
    description: [
      'Quilha FCS II FT (Filipe Toledo) PG PRO Medium — colorway Black/Acid (preto com amarelo neon).',
      '',
      'Versão PRO da quilha-assinatura do bicampeão mundial Filipe Toledo em construção Performance Glass (PG) — material mais rígido da linha FCS, escolhido pelos surfistas do CT para máximo drive.',
      '',
      'Athlete Series — Filipe Toledo (Bicampeão Mundial WSL 2022, 2023)',
      '',
      'Família Accelerator: Find Control',
      '',
      'Características Principais',
      '- Template Filipe Toledo com rake elevado',
      '- Construção Performance Glass (PG) — fibra de vidro sólida',
      '- Máxima rigidez e memória de flex',
      '- Drive excepcional para ondas críticas',
      '- Cor: Black/Acid',
      '',
      DESC_BLOCKS.pg,
      '',
      'Tamanho: Medium (recomendado para Stronger Surfers — surfistas potentes 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #32 FT Filipe Toledo PG PRO Large Black/Acid ───
  {
    sku: 'FFTL-PG01-LG-TS-R',
    name: 'Quilha FCS II FT Filipe Toledo PG PRO Large Black/Acid',
    productFamily: 'quilha-fcs-ii-ft-filipe-toledo-pg-pro',
    size: 'L',
    isMainVariant: false,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935081691',
    weight: 160,
    color: 'Black/Acid',
    colorCode: '#000000',
    colorCode2: '#D4FF00',
    description: [
      'Quilha FCS II FT (Filipe Toledo) PG PRO Large — colorway Black/Acid.',
      '',
      'Versão PRO em Performance Glass — material mais rígido da linha FCS, agora em tamanho Large para Stronger Surfers. Template do bicampeão mundial.',
      '',
      'Athlete Series — Filipe Toledo (Bicampeão Mundial WSL 2022, 2023)',
      '',
      'Características Principais',
      '- Template Filipe Toledo com rake elevado',
      '- Construção Performance Glass (PG)',
      '- Drive máximo para ondas críticas overhead',
      '- Cor: Black/Acid',
      '',
      DESC_BLOCKS.pg,
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #30 RP Rusty Preisendorfer PC Tri-Quad Medium Fluro Green ───
  {
    sku: 'FRPM-PC02-MD-FS-R',
    name: 'Quilha FCS II RP Rusty PC Tri-Quad Medium Fluro Green',
    productFamily: 'quilha-fcs-ii-rp-rusty-pc-tri-quad',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_RUSTY,
    gtin: '9340935074723',
    weight: 220,
    color: 'Fluro Green',
    colorCode: '#39FF14',
    colorCode2: '',
    description: [
      'Quilha FCS II RP (Rusty Preisendorfer) PC Tri-Quad 5 Fins Medium — colorway Fluro Green (verde neon).',
      '',
      'Set completo de 5 quilhas (3 Tri + 2 Quad Rear) do lendário Rusty Preisendorfer. Permite alternar entre setup Thruster e Quad na mesma prancha, oferecendo máxima versatilidade.',
      '',
      'Shaper Series — Rusty Preisendorfer (Rusty Designs)',
      'Rusty Preisendorfer é uma lenda viva do shaping, fundador da Rusty Surfboards. Suas pranchas equipam (e equiparam) surfistas como Taj Burrow, Sebastian Zietz e Mick Campbell.',
      '',
      'Características Principais',
      '- Set 5 quilhas (Tri-Quad): 2 laterais + 1 central + 2 quad rears',
      '- Permite alternar entre Thruster e Quad',
      '- Construção Performance Core (PC)',
      '- Cor: Fluro Green (verde neon)',
      '',
      DESC_BLOCKS.pc,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 5 quilhas (Tri-Quad setup).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #31 AM Al Merrick PC Medium Cobalt ───
  {
    sku: 'FAMM-PC04-MD-TS-R',
    name: 'Quilha FCS II AM Al Merrick PC Medium Cobalt',
    productFamily: 'quilha-fcs-ii-am-al-merrick-pc',
    size: 'M',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935048533',
    weight: 140,
    color: 'Cobalt',
    colorCode: '#0047AB',
    colorCode2: '',
    description: [
      'Quilha FCS II AM (Al Merrick / Channel Islands) PC Medium — colorway Cobalt (azul cobalto).',
      '',
      'Quilha-assinatura do lendário Al Merrick, fundador da Channel Islands. Template desenhado para o surfe radical e progressivo — laterais raked produzem velocidade e drive excepcionais, central downsized para release rápido no rabeta.',
      '',
      'Shaper Series — Al Merrick (Channel Islands)',
      'Al Merrick é o maior nome do shaping moderno. Pranchas CI equipam Kelly Slater, Tom Curren, Dane Reynolds, Bobby Martinez.',
      '',
      'Família Carver: Find Power',
      '',
      'Características Principais',
      '- Template AM com alto sweep e ponta estreita',
      '- Foil flat nas laterais',
      '- Quilha central downsized',
      '- Construção Performance Core (PC)',
      '- Cor: Cobalt (azul cobalto)',
      '',
      DESC_BLOCKS.pc,
      '',
      'Condições Ideais',
      'Ondas ocas e steep, beach breaks com punch. Surf progressivo radical.',
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #46 AM Al Merrick PC AirCore Large Grey ───
  {
    sku: 'FAML-PC03-LG-TS-R',
    name: 'Quilha FCS II AM Al Merrick PC AirCore Large Grey',
    productFamily: 'quilha-fcs-ii-am-al-merrick-pc',
    size: 'L',
    isMainVariant: false,
    isFeatured: true,
    price: PRICE_AM_AIRCORE,
    gtin: '9340935044191',
    weight: 140,
    color: 'Grey',
    colorCode: '#6B7280',
    colorCode2: '',
    description: [
      'Quilha FCS II AM (Al Merrick) PC AirCore Large — colorway Grey (cinza grafite).',
      '',
      'Versão Large com construção PC AirCore — ultraleve com flex manipulável. Template Channel Islands para surfe radical e progressivo.',
      '',
      'Shaper Series — Al Merrick (Channel Islands)',
      '',
      'Características Principais',
      '- Template AM com alto sweep',
      '- Quilha central downsized',
      '- Construção PC + AirCore (ultraleve)',
      '- Surf radical e progressivo',
      '- Cor: Grey (cinza grafite)',
      '',
      DESC_BLOCKS.pcAircore,
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #33 WT Tokoro PC Large Black ───
  {
    sku: 'FWTL-PC01-LG-TS-R',
    name: 'Quilha FCS II WT Tokoro PC Large Black',
    productFamily: 'quilha-fcs-ii-wt-tokoro-pc',
    size: 'L',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935015795',
    weight: 150,
    color: 'Black',
    colorCode: '#000000',
    colorCode2: '',
    description: [
      'Quilha FCS II WT (Wade Tokoro) PC Large — colorway Black (preto com gráficos brancos).',
      '',
      'Quilha-assinatura do shaper Wade Tokoro, lendário no North Shore de Oahu. Conhecido como mestre dos tubos de Pipeline, Tokoro projetou esta quilha com o estilo de carve poderoso em mente.',
      '',
      'Shaper Series — Wade Tokoro',
      'Wade Tokoro é um dos maiores shapers do North Shore. Suas pranchas artesanais são confiadas por surfistas ao redor do mundo, especialmente para Pipeline.',
      '',
      'Família Accelerator: Find Control',
      '',
      'Características Principais',
      '- Template Tokoro para carve poderoso',
      '- Construção Performance Core (PC)',
      '- Drive excepcional + estabilidade em alta velocidade',
      '- Ideal para ondas ocas e steep',
      '- Cor: Black',
      '',
      DESC_BLOCKS.pc,
      '',
      'Condições Ideais',
      'Ondas ocas e steep, beach breaks com punch. Perfeita para tubos e parede vertical.',
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #38 MF Mick Fanning Neo Carbon Large Black/Charcoal ───
  {
    sku: 'FMFL-NC01-LG-TS-R',
    name: 'Quilha FCS II MF Mick Fanning Neo Carbon Large Black/Charcoal',
    productFamily: 'quilha-fcs-ii-mf-mick-fanning-neo-carbon',
    size: 'L',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_MF_NC,
    gtin: '9340935044511',
    weight: 130,
    color: 'Black/Charcoal',
    colorCode: '#000000',
    colorCode2: '#36454F',
    description: [
      'Quilha FCS II MF (Mick Fanning) Neo Carbon Large — colorway Black/Charcoal.',
      '',
      'Versão premium da quilha-assinatura de Mick Fanning em Neo Carbon — tecido de carbono de fio longo com resina europeia. Super leve com flex firme tipo "spring-loaded" e o famoso "whipping effect" na ponta.',
      '',
      'Athlete Series — Mick Fanning (Tricampeão Mundial WSL)',
      'Versão Neo Carbon para surfistas que querem drive máximo + leveza extrema + resposta ultra-rápida. O carbono dispara aceleração a partir de cada bottom turn e gera velocidade em condições softer.',
      '',
      'Características Principais',
      '- Template MF com base alongada e sweep elevado',
      '- Construção Neo Carbon (NC) com carbono de fio longo',
      '- "Whipping effect" — velocidade extra em ondas pequenas',
      '- Flex firme "spring-loaded"',
      '- Cor: Black/Charcoal',
      '',
      DESC_BLOCKS.neoCarbon,
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #39 JW Julian Wilson PC AirCore Large B/W ───
  {
    sku: 'FJWL-PC03-LG-TS-R',
    name: 'Quilha FCS II JW Julian Wilson PC AirCore Large Black/White',
    productFamily: 'quilha-fcs-ii-jw-julian-wilson-pc-aircore',
    size: 'L',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935048816',
    weight: 135,
    color: 'Black/White',
    colorCode: '#000000',
    colorCode2: '#FFFFFF',
    description: [
      'Quilha FCS II JW (Julian Wilson) PC AirCore Large — colorway Black/White.',
      '',
      'Quilha-assinatura do australiano Julian Wilson — referência absoluta em aéreos modernos. Atualizada de PG para PC AirCore (ultraleve com resposta rápida). Template raked para velocidade e projeção em aéreos.',
      '',
      'Athlete Series — Julian Wilson',
      'Julian Wilson é um dos surfistas mais técnicos da WSL, eleito várias vezes "best aerialist" do tour. Vencedor em Pipeline, Trestles e mais. Sua quilha-assinatura permite decolar do lip com velocidade extra.',
      '',
      'Família Carver: Find Power',
      '',
      'Características Principais',
      '- Template JW com rake elevado',
      '- Construção PC + AirCore (ultraleve)',
      '- Velocidade e projeção em aéreos',
      '- Controle em arcos longos',
      '- Cor: Black/White',
      '',
      DESC_BLOCKS.pcAircore,
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #41 KA Kolohe Andino PC Large W/G ───
  {
    sku: 'FKAL-PC02-LG-TS-R',
    name: 'Quilha FCS II KA Kolohe Andino PC Large White/Grey',
    productFamily: 'quilha-fcs-ii-ka-kolohe-andino-pc',
    size: 'L',
    isMainVariant: true,
    isFeatured: true,
    price: PRICE_STD,
    gtin: '9340935048957',
    weight: 150,
    color: 'White/Grey',
    colorCode: '#FFFFFF',
    colorCode2: '#6B7280',
    description: [
      'Quilha FCS II KA (Kolohe Andino) PC Large — colorway White/Grey.',
      '',
      'Quilha-assinatura do havaiano Kolohe Andino, olímpico USA. Entrega mistura viva de drive, pivot rápido e tail release — desenhada para turns explosivos e aéreos acima do lip. "All Rounder +" com sweep neutro.',
      '',
      'Athlete Series — Kolohe Andino',
      'Kolohe Andino é um dos surfistas mais consistentes da WSL, com participação na seleção olímpica dos EUA (Tokyo 2020). Conhecido pelo surf rápido e explosivo.',
      '',
      'Família Accelerator: Find Control',
      '',
      'Características Principais',
      '- Template KA com base longa e rake moderado',
      '- "All Rounder +" — drive + pivot + tail release',
      '- Construção Performance Core (PC)',
      '- Ideal para turns explosivos e aéreos',
      '- Cor: White/Grey',
      '',
      DESC_BLOCKS.pc,
      '',
      'Condições Ideais',
      'Ampla variedade, especialmente boas em ondas críticas overhead. Sweet spot em ondas com mais tamanho.',
      '',
      'Tamanho: Large (recomendado para surfistas 75-95 kg)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster).',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #42 Carver Glass Flex Quad Rear Medium Black ───
  {
    sku: 'FCAR-BK01-MD-RS-R',
    name: 'Quilha FCS II Carver Glass Flex Quad Rear Medium Black',
    productFamily: 'quilha-fcs-ii-carver-glass-flex-quad-rear',
    size: 'M',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_GF_QR,
    gtin: '9340935044436',
    weight: 90,
    color: 'Black',
    colorCode: '#000000',
    colorCode2: '',
    description: [
      'Par de quilhas traseiras Quad Rear FCS II Carver Glass Flex Medium — colorway Black.',
      '',
      'Opção mais acessível da linha FCS para completar setup quad. Template Carver alongado em construção Glass Flex.',
      '',
      'Família Carver: Find Power',
      '',
      'Características Principais',
      '- Par de Quad Rears (2 quilhas traseiras)',
      '- Template Carver alongado',
      '- Construção Glass Flex (GF) — polímero engineering-grade',
      '- Excelente custo-benefício',
      '- Cor: Black',
      '',
      DESC_BLOCKS.glassFlex,
      '',
      'Tamanho: Medium (recomendado para surfistas 60-80 kg)',
      '',
      'ATENÇÃO: Embalagem contém APENAS 2 quilhas traseiras (Quad Rear). Para montar setup quad você precisa de 2 quilhas laterais FCS II adicionais.',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #43 Carver Glass Flex Tri Large Black ───
  {
    sku: 'FCAR-BK01-LG-TS-R',
    name: 'Quilha FCS II Carver Glass Flex Tri Large Black',
    productFamily: 'quilha-fcs-ii-carver-glass-flex',
    size: 'L',
    isMainVariant: true,
    isFeatured: false,
    price: PRICE_GF_TRI,
    gtin: '9340935044399',
    weight: 160,
    color: 'Black',
    colorCode: '#000000',
    colorCode2: '',
    description: [
      'Quilha FCS II Carver Glass Flex Tri Large — colorway Black.',
      '',
      'Jogo de 3 quilhas Tri (Thruster) do template Carver em construção Glass Flex (GF) — a opção mais acessível da linha FCS, ideal para surfistas que querem o template Carver com excelente custo-benefício. Embalagem em saquinho de pano FCS.',
      '',
      'Família Carver: Find Power',
      '',
      'Características Principais',
      '- Template Carver alongado com alto grau de sweep',
      '- Construção Glass Flex (GF) — polímero injetado',
      '- Réplica do flex e memória da fibra de vidro tradicional',
      '- Geometria precisa do processo de injection molding',
      '- Excelente custo-benefício',
      '- Cor: Black',
      '',
      DESC_BLOCKS.glassFlex,
      '',
      'Condições Ideais',
      'Ondas de parede aberta, down-the-line, point breaks e reef breaks.',
      '',
      'Tamanho: Large (recomendado para surfistas 75-90 kg / 165-200 lbs)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster). Esta versão vem em saquinho de pano FCS.',
      '',
      DESC_BLOCKS.encaixe,
    ].join('\n'),
  },

  // ─── #44 Carver Glass Flex Tri Medium Black ───
  {
    sku: 'FCAR-BK01-MD-TS-R',
    name: 'Quilha FCS II Carver Glass Flex Tri Medium Black',
    productFamily: 'quilha-fcs-ii-carver-glass-flex',
    size: 'M',
    isMainVariant: false,
    isFeatured: false,
    price: PRICE_GF_TRI,
    gtin: '9340935044405',
    weight: 145,
    color: 'Black',
    colorCode: '#000000',
    colorCode2: '',
    description: [
      'Quilha FCS II Carver Glass Flex Tri Medium — colorway Black.',
      '',
      'Jogo de 3 quilhas Tri (Thruster) do template Carver em construção Glass Flex (GF), agora em tamanho Medium. Excelente custo-benefício para o template Carver. Embalagem em saquinho de pano FCS.',
      '',
      'Família Carver: Find Power',
      '',
      'Características Principais',
      '- Template Carver alongado',
      '- Construção Glass Flex (GF)',
      '- Excelente custo-benefício',
      '- Cor: Black',
      '',
      DESC_BLOCKS.glassFlex,
      '',
      'Tamanho: Medium (recomendado para surfistas 65-80 kg / 145-175 lbs)',
      '',
      'Embalagem contém 1 jogo com 3 quilhas (Thruster). Esta versão vem em saquinho de pano FCS.',
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
  console.log('🔍 Procurando fornecedor BRAZIL TRADE EIRELI...');
  const supplier = await Supplier.findOne({ name: 'BRAZIL TRADE EIRELI' });
  if (!supplier) {
    console.error('❌ Fornecedor BRAZIL TRADE EIRELI não encontrado.');
    console.error('   Cadastre primeiro em /admin/fornecedores');
    process.exit(1);
  }
  console.log(`✅ Supplier: ${supplier.name}\n`);

  // ─── Brand ─────────────────────────────────────────────────
  console.log('🔍 Verificando marca FCS...');
  let brand = await Brand.findOne({ name: 'FCS' });
  if (!brand) {
    brand = await Brand.create({ name: 'FCS', slug: 'fcs', isActive: true });
    console.log(`✨ Marca "FCS" criada\n`);
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

  // ─── Subcategory: Sistema FCS II ───────────────────────────
  console.log('🔍 Procurando subcategoria Sistema FCS II...');
  const subcategory = await Category.findOne({
    slug: 'quilhas-sistema-fcs-ii',
    parent: category._id,
  });
  if (!subcategory) {
    console.error('❌ Subcategoria "Sistema FCS II" não encontrada.');
    console.error('   Rode seed-categories.ts primeiro.');
    process.exit(1);
  }
  console.log(`✅ Subcategory: ${subcategory.name}\n`);

  // ─── WIPE (opcional) ───────────────────────────────────────
  if (WIPE_FCS_BEFORE_SEED) {
    console.log('⚠️  WIPE_FCS_BEFORE_SEED = true');
    console.log(`🗑️  Apagando todos produtos da marca FCS...`);
    const wipeResult = await Product.deleteMany({ brand: brand._id });
    console.log(`🗑️  ${wipeResult.deletedCount} produto(s) FCS apagado(s)\n`);
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
  console.log(`📦 Inserindo ${PRODUCTS.length} quilhas FCS II...\n`);

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
        tags: ['quilha', 'fcs', 'fcs-ii', 'surf'],
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
        `✅ ${star} ${main} ${p.sku.padEnd(22)} ${priceStr}  ${normalizedName}`,
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

  const totalRevenue = PRODUCTS.reduce((sum, p) => sum + p.price, 0);
  console.log(
    `💰 Valor total do estoque (preço de venda): R$ ${totalRevenue.toFixed(2)}`,
  );
  console.log(
    `💵 Valor total do custo estimado (preço/2): R$ ${(totalRevenue / 2).toFixed(2)}`,
  );
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Desconectado');
  process.exit(0);
}

seed().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});
