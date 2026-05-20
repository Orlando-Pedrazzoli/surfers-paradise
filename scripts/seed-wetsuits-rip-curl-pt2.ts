/**
 * seed-wetsuits-rip-curl-pt2.ts
 *
 * Seed PARTE 2 — Rip Curl Femininos + Dawn Patrol + Juvenis
 *
 * Esta parte cobre 16 produtos:
 *   - 6 Long Johns femininos (G-Bomb, E-Bomb WMS, Dawn Patrol WMS, Flashbomb WMS, Omega)
 *   - 6 Short Johns femininos (G-Bomb, Dawn Patrol WMS — incluindo 1.5mm Electric Blue)
 *   - 2 Long Johns juvenis (3/2mm BZ)
 *   - 2 Long Johns masculinos médios (Dawn Patrol + E-Bomb Pro)
 *
 * Rodar com:
 *   npx tsx scripts/seed-wetsuits-rip-curl-pt2.ts
 *
 * Pré-requisitos:
 *   ✓ Fornecedor MAGIC SURF LTDA cadastrado
 *   ✓ Categoria Wetsuits + subcategorias Long John e Short John via seed-categories.ts
 *   ✓ Marca Rip Curl criada (seed pt1)
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
  neopreneE6: `Neoprene E6 — Performance Comprovada
Construção em Neoprene E6 super stretch — 20% mais elástico e 15% mais quente que o E5. Padrão de alto desempenho usado por atletas profissionais.`,

  neopreneE5: `Neoprene E5 — Equilíbrio Custo-Benefício
Construção em Neoprene E5 com excelente equilíbrio entre durabilidade, flexibilidade e preço. Padrão da linha Dawn Patrol — a melhor relação custo-benefício do catálogo Rip Curl.`,

  neopreneE4: `Neoprene E4 — Linha G-Bomb
Construção em Neoprene E4 super stretch com costuras E4 Stitchless Double Taped. Design pensado para o corpo feminino: cortes anatômicos, painéis estratégicos e vedação superior. Padrão da linha G-Bomb.`,

  thermoLining: `Forro Thermo Lining
Revestimento térmico interno em toda a roupa que retém o calor corporal. Tecido macio em contato com a pele, secagem rápida e proteção contra vento gelado ao remar.`,

  flashLining: `Forro Flash Lining — Seca em até 15 minutos
A tecnologia Flash Lining é exclusiva da Rip Curl. Forro interno com fibras especiais que aceleram a evaporação da água — sua roupa fica seca em até 15 minutos.`,

  zipFree: `Sistema Zip Free — Sem Zíper
Tecnologia Zip Free elimina completamente o zíper, oferecendo máxima liberdade de remada, menos peso e zero pontos de infiltração nas costas.`,

  backZip: `Sistema Back Zip — Zíper nas Costas
Zíper longitudinal nas costas — o sistema mais fácil de vestir e tirar, ideal para quem está começando ou prefere praticidade.`,

  frontZip: `Sistema Front Zip — Zíper Frontal
Zíper na parte frontal (peito ou ombro). Praticidade para vestir e estilo característico da linha G-Bomb feminina.`,

  gBombLine: `Linha G-Bomb — Performance Feminina
A G-Bomb é a linha premium feminina da Rip Curl. Combina alta performance (Neoprene E4/E5 super stretch) com fit anatômico feminino e design fashion. Cortes pensados para o corpo da mulher surfista, painéis estratégicos para melhor mobilidade e estampas exclusivas.`,

  dawnPatrolLine: `Linha Dawn Patrol — A Melhor Custo-Benefício
Dawn Patrol é a roupa de entrada da Rip Curl — durável, confortável e com excelente valor. Ideal para quem está começando ou quer uma segunda roupa. Mais de 20 anos de história, é um dos modelos mais vendidos do mundo do surf.`,

  temp32: `Guia de Temperatura — 3/2mm
Espessura ideal para água fria entre 14 e 19°C. Recomendada para o inverno no Sul e Sudeste do Brasil (SC, PR, RS, SP, RJ).`,

  temp22: `Guia de Temperatura — 2/2mm
Espessura ideal para água amena entre 18 e 22°C. Recomendada para meia-estação no Sul/Sudeste, ou inverno do Nordeste.`,

  temp15: `Guia de Temperatura — 1.5mm
Espessura ideal para água amena/quente entre 20 e 24°C. Perfeita para os meses de verão no Sul/Sudeste ou para o ano todo no Nordeste. Oferece proteção térmica leve sem comprometer a mobilidade.`,

  cuidados: `Cuidados com sua Roupa de Borracha
• Sempre seque dobrada ao meio — nunca pendure pelo ombro.
• Lave apenas com água doce após cada uso.
• Não use sabão ou shampoo.
• Seque à sombra.
• Evite contato com gasolina, óleo e solventes.`,

  garantia: `Assistência Técnica & Garantia
A Rip Curl possui assistência técnica própria no Brasil para reparos especializados em roupas de borracha. Consulte detalhes sobre garantia no tag do produto.`,
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
  subcategorySlug: 'wetsuits-long-john' | 'wetsuits-short-john';
  wetsuitType: 'long-john' | 'short-john';
  thickness: string;
  gender: 'masculino' | 'feminino' | 'kids';
  wetsuitLine: string;
  zipperType: 'zip-free' | 'back-zip' | 'chest-zip' | 'front-zip';
  origin: '0' | '1' | '2';
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO PARTE 2 — 16 SKUs
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedWetsuit[] = [
  // ════════════════════════════════════════════════════════════
  // LONG JOHNS FEMININOS
  // ════════════════════════════════════════════════════════════

  // E-Bomb WMS 3/2mm Zip Free (Feminino)
  {
    sku: 'RC-EBOMB-WMS-32-ZF-P',
    name: 'Long John Feminino Rip Curl E-Bomb 3/2mm Zip Free Black P',
    productFamily: 'long-john-feminino-rip-curl-e-bomb-3-2-zip-free',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 2899.99,
    gtin: '7908938367451',
    weight: 950,
    supplierProductCode: '16QWFS80598059P',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'feminino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John FEMININO Rip Curl E-Bomb 3/2mm Zip Free — colorway Black, tamanho P.',
      '',
      'A versão feminina (WMS) do lendário E-Bomb da Rip Curl — a mesma roupa usada por Tyler Wright (campeã mundial WSL) nas competições do Circuito Mundial. Construção com Neoprene E6 super stretch e cortes anatômicos pensados para o corpo feminino. Painéis estratégicos para acomodar curvas naturais sem comprometer a liberdade de movimento.',
      '',
      'Por que escolher o E-Bomb WMS?',
      '- Mesma tecnologia E6 da versão masculina',
      '- Fit anatômico feminino (não é "versão menor da masculina")',
      '- Sistema Zip Free para máxima vedação',
      '- Forro Thermo Lining em toda a peça',
      "- Aprovado por atletas WSL women's tour",
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp32,
      '',
      'Tamanho P (Petite) — recomendado para altura entre 1,55m e 1,60m e busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // E-Bomb Pro Feminino 3/2mm
  {
    sku: 'RC-EBOMB-PRO-WMS-32-3805',
    name: 'Long John Feminino Rip Curl E-Bomb Pro 3/2mm E6',
    productFamily: 'long-john-feminino-rip-curl-e-bomb-pro-3-2',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 2799.9,
    gtin: '',
    weight: 950,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'feminino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'chest-zip',
    origin: '0',
    description: [
      'Long John FEMININO Rip Curl E-Bomb Pro 3/2mm — colorway Black, tamanho M.',
      '',
      'Versão Pro da linha E-Bomb feminina com Neoprene E6 e sistema Chest Zip — vedação superior ao Back Zip mantendo facilidade de vestir. Construção nacional com excelente acabamento e cortes femininos. Preço competitivo dentro da linha E-Bomb.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      `Sistema Chest Zip — Zíper no Peito\nZíper horizontal no peito (acima do esterno) oferece excelente vedação contra entrada de água e melhor flex nas costas que o Back Zip tradicional.`,
      '',
      DESC_BLOCKS.temp32,
      '',
      'Tamanho M (Medium) — recomendado para altura entre 1,60m e 1,65m e busto 88-92cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Flashbomb WMS 3/2mm (Feminino)
  {
    sku: 'RC-FB-WMS-32-FB',
    name: 'Long John Feminino Rip Curl Flashbomb 3/2mm Zip Free Black',
    productFamily: 'long-john-feminino-rip-curl-flashbomb-3-2',
    size: 'PP',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 3399.9,
    gtin: '7909580966016',
    weight: 1050,
    supplierProductCode: 'WSTYEG904/PP',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'feminino',
    wetsuitLine: 'Flashbomb',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John FEMININO Rip Curl Flashbomb 3/2mm Zip Free — colorway Black, tamanho PP.',
      '',
      'A versão feminina do lendário Flashbomb — eleita 4x melhor wetsuit do mundo pela SIMA. Mesmo Flash Lining que seca em 15 minutos da versão masculina, agora com cortes anatômicos femininos. Ideal para mulheres surfistas que treinam mais de uma vez por dia e querem sempre vestir uma roupa seca.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.flashLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp32,
      '',
      'Tamanho PP (Petite Petite) — recomendado para altura entre 1,50m e 1,55m e busto 80-84cm.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // G-Bomb Feminino 2/2mm (Long John)
  {
    sku: 'RC-GBOMB-WMS-LJ-22-P',
    name: 'Long John Feminino Rip Curl G-Bomb 2/2mm Black P',
    productFamily: 'long-john-feminino-rip-curl-g-bomb-2-2',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1399.99,
    gtin: '7908938367307',
    weight: 800,
    supplierProductCode: '15LWFS00900090P',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '2/2',
    gender: 'feminino',
    wetsuitLine: 'G-Bomb',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Long John FEMININO Rip Curl G-Bomb 2/2mm — colorway Black, tamanho P.',
      '',
      'A linha G-Bomb é a coleção feminina premium da Rip Curl — combina performance com fit anatômico feminino e estética fashion. Neoprene E4/E5 super stretch com costuras E-stitched para máximo conforto. Perfeita para meia-estação no Sul/Sudeste ou inverno do Nordeste.',
      '',
      DESC_BLOCKS.gBombLine,
      '',
      DESC_BLOCKS.neopreneE4,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho P (Petite) — recomendado para altura entre 1,55m e 1,60m e busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // G-Bomb Feminino 4267 (variação Floral)
  {
    sku: 'RC-FSHORT-RIP-4267',
    name: 'Short Feminino Rip Curl Floral 4267',
    productFamily: 'short-feminino-rip-curl-floral-4267',
    size: 'M',
    color: 'Floral',
    colorCode: '#EC4899',
    colorCode2: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1399.9,
    gtin: '',
    weight: 600,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'feminino',
    wetsuitLine: 'G-Bomb',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Short John FEMININO Rip Curl Floral — colorway Preto/Rosa Floral, tamanho M.',
      '',
      'Short John feminino com estampa floral exclusiva da Rip Curl. Construção em Neoprene 2/2mm com cortes anatômicos femininos. Estampa floral confere identidade visual única — perfeita para os dias quentes onde estilo e performance importam.',
      '',
      DESC_BLOCKS.gBombLine,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho M (Medium) — recomendado para altura entre 1,60m e 1,65m e busto 88-92cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Omega Feminino Floral 3/2 (4190)
  {
    sku: 'RC-OMEGA-WMS-32-4190',
    name: 'Long John Feminino Rip Curl Omega Floral 3/2mm',
    productFamily: 'long-john-feminino-rip-curl-omega-floral-3-2',
    size: 'M',
    color: 'Floral Preto',
    colorCode: '#000000',
    colorCode2: '#EC4899',
    isMainVariant: true,
    isFeatured: false,
    price: 2599.9,
    gtin: '',
    weight: 950,
    supplierProductCode: '',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'feminino',
    wetsuitLine: 'Omega',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Long John FEMININO Rip Curl Omega Floral 3/2mm — colorway Preto/Floral Rosa, tamanho M.',
      '',
      'A linha Omega Rip Curl combina performance com cortes elegantes para mulheres surfistas. Construção 3/2mm ideal para o inverno brasileiro com estampa floral exclusiva. Sistema Back Zip facilita vestir e tirar.',
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp32,
      '',
      'Tamanho M (Medium) — recomendado para altura entre 1,60m e 1,65m e busto 88-92cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // SHORT JOHNS FEMININOS
  // ════════════════════════════════════════════════════════════

  // Short John Fem DWP 2/2mm L/SL
  {
    sku: 'RC-DWP-WMS-SJ-22-LSL-PP',
    name: 'Short John Feminino Rip Curl Dawn Patrol L/SL 2/2mm Black PP',
    productFamily: 'short-john-feminino-rip-curl-dawn-patrol-l-sl-2-2',
    size: 'PP',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1399.99,
    gtin: '7908938356974',
    weight: 700,
    supplierProductCode: '14AWSP03780378PP',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'feminino',
    wetsuitLine: 'Dawn Patrol',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Short John FEMININO Rip Curl Dawn Patrol Long Sleeve 2/2mm — colorway Black, tamanho PP.',
      '',
      'A versão feminina do icônico Dawn Patrol — combina pernas curtas com mangas longas para máxima mobilidade nas pernas mantendo proteção térmica nos braços. Ideal para água amena onde o Long John seria demais e o Short John tradicional seria pouco.',
      '',
      DESC_BLOCKS.dawnPatrolLine,
      '',
      DESC_BLOCKS.neopreneE5,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho PP (Petite Petite) — recomendado para altura entre 1,50m e 1,55m e busto 80-84cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Short John Fem DWP 2/2mm (outra variação)
  {
    sku: 'RC-DWP-WMS-SJ-22-PP',
    name: 'Short John Feminino Rip Curl Dawn Patrol 2/2mm Black PP',
    productFamily: 'short-john-feminino-rip-curl-dawn-patrol-2-2',
    size: 'PP',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1399.99,
    gtin: '7908938364191',
    weight: 650,
    supplierProductCode: '142WSP00310031PP',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'feminino',
    wetsuitLine: 'Dawn Patrol',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Short John FEMININO Rip Curl Dawn Patrol 2/2mm — colorway Black, tamanho PP.',
      '',
      'Short John clássico feminino da linha Dawn Patrol — mangas e pernas curtas para máxima mobilidade em água amena. Excelente custo-benefício, ideal para iniciantes ou para complementar uma quiver de wetsuits.',
      '',
      DESC_BLOCKS.dawnPatrolLine,
      '',
      DESC_BLOCKS.neopreneE5,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho PP (Petite Petite) — recomendado para altura entre 1,50m e 1,55m e busto 80-84cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Short John Fem 1.5mm
  {
    sku: 'RC-FSHORT-WMS-15-P',
    name: 'Short John Feminino Rip Curl 1.5mm Black P',
    productFamily: 'short-john-feminino-rip-curl-1-5',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1399.99,
    gtin: '7908938367147',
    weight: 500,
    supplierProductCode: '147WSP00700070P',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '1.5mm',
    gender: 'feminino',
    wetsuitLine: 'G-Bomb',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Short John FEMININO Rip Curl 1.5mm — colorway Black, tamanho P.',
      '',
      'A roupa térmica feminina mais leve do catálogo Rip Curl — apenas 1.5mm de espessura, perfeita para os dias quentes onde uma proteção mínima é desejada. Cortes femininos e Sistema Back Zip para praticidade.',
      '',
      DESC_BLOCKS.gBombLine,
      '',
      DESC_BLOCKS.temp15,
      '',
      'Tamanho P (Petite) — recomendado para altura entre 1,55m e 1,60m e busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Short John WMS G-Bomb 2/2mm
  {
    sku: 'RC-GBOMB-WMS-SJ-22-P',
    name: 'Short John Feminino Rip Curl G-Bomb 2/2mm Black P',
    productFamily: 'short-john-feminino-rip-curl-g-bomb-2-2',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1499.99,
    gtin: '7908938367192',
    weight: 600,
    supplierProductCode: '148WSP00900090P',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'feminino',
    wetsuitLine: 'G-Bomb',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Short John FEMININO Rip Curl G-Bomb 2/2mm — colorway Black, tamanho P.',
      '',
      'Short John feminino premium da linha G-Bomb — Neoprene E4 super stretch com cortes anatômicos femininos. Combinação ideal de performance e estilo para mulheres surfistas exigentes.',
      '',
      DESC_BLOCKS.gBombLine,
      '',
      DESC_BLOCKS.neopreneE4,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho P (Petite) — recomendado para altura entre 1,55m e 1,60m e busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // G-Bomb 1.5mm Short John (Electric Blue — destaque)
  {
    sku: 'RC-GBOMB-WMS-SJ-15-EB-PP',
    name: 'Short John Feminino Rip Curl G-Bomb 1.5mm Front Zip Electric Blue PP',
    productFamily: 'short-john-feminino-rip-curl-g-bomb-1-5-electric-blue',
    size: 'PP',
    color: 'Electric Blue',
    colorCode: '#2096D7',
    colorCode2: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 999.99,
    gtin: '7908782998924',
    weight: 450,
    supplierProductCode: '13HWSP80008000PP',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '1.5mm',
    gender: 'feminino',
    wetsuitLine: 'G-Bomb',
    zipperType: 'front-zip',
    origin: '0',
    description: [
      'Short John FEMININO Rip Curl G-Bomb 1.5mm Front Zip — colorway Electric Blue, tamanho PP.',
      '',
      'A peça assinatura da linha G-Bomb — Short John feminino 1.5mm com sistema Front Zip e colorway Electric Blue (azul vibrante com painéis pretos). Design fashion sem comprometer performance. Perfeita para os dias quentes onde estilo e funcionalidade andam juntos.',
      '',
      DESC_BLOCKS.gBombLine,
      '',
      DESC_BLOCKS.frontZip,
      '',
      DESC_BLOCKS.temp15,
      '',
      'Tamanho PP (Petite Petite) — recomendado para altura entre 1,50m e 1,55m e busto 80-84cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // G-Bomb 1.5mm Short John (Black)
  {
    sku: 'RC-GBOMB-WMS-SJ-15-P',
    name: 'Short John Feminino Rip Curl G-Bomb 1.5mm Black P',
    productFamily: 'short-john-feminino-rip-curl-g-bomb-1-5',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 899.99,
    gtin: '7908938366799',
    weight: 450,
    supplierProductCode: '13IWSP00900090P',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '1.5mm',
    gender: 'feminino',
    wetsuitLine: 'G-Bomb',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Short John FEMININO Rip Curl G-Bomb 1.5mm — colorway Black, tamanho P.',
      '',
      'Short John feminino 1.5mm da linha G-Bomb em colorway Black clássico. Neoprene E4 super stretch com cortes femininos. Excelente para os dias quentes onde apenas uma proteção térmica leve é desejada.',
      '',
      DESC_BLOCKS.gBombLine,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp15,
      '',
      'Tamanho P (Petite) — recomendado para altura entre 1,55m e 1,60m e busto 84-88cm.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // DAWN PATROL MASCULINO + E-BOMB SHORT JOHN MASCULINO
  // ════════════════════════════════════════════════════════════

  // Dawn Patrol Short John Cavado Masculino
  {
    sku: 'RC-DWP-SJ-CAVADO-M',
    name: 'Short John Rip Curl Dawn Patrol Cavado Black M',
    productFamily: 'short-john-rip-curl-dawn-patrol-cavado',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 999.99,
    gtin: '7908938325000',
    weight: 700,
    supplierProductCode: '116MSP00900090M',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'Dawn Patrol',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Short John MASCULINO Rip Curl Dawn Patrol Cavado — colorway Black, tamanho M.',
      '',
      'Short John cavado (sem mangas) da linha Dawn Patrol — máxima mobilidade nos ombros e braços com proteção térmica no torso. Excelente para dias quentes ou para usar por baixo de uma jaqueta de neoprene em dias frescos. A melhor relação custo-benefício do catálogo.',
      '',
      DESC_BLOCKS.dawnPatrolLine,
      '',
      DESC_BLOCKS.neopreneE5,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho M (Medium) — recomendado para altura entre 1,73m e 1,78m e peso entre 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // E-Bomb Short John Iron L/SL 2/2mm (Masculino — alto volume estoque)
  {
    sku: 'RC-EBOMB-SJ-22-LSL-IRON-PP',
    name: 'Short John Rip Curl E-Bomb L/SL 2/2mm Zip Free Iron PP',
    productFamily: 'short-john-rip-curl-e-bomb-l-sl-2-2-iron',
    size: 'PP',
    color: 'Iron',
    colorCode: '#52525B',
    isMainVariant: true,
    isFeatured: true,
    price: 1999.99,
    gtin: '7908782994148',
    weight: 850,
    supplierProductCode: '123MSP01200120PP',
    subcategorySlug: 'wetsuits-short-john',
    wetsuitType: 'short-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Short John MASCULINO Rip Curl E-Bomb Long Sleeve 2/2mm Zip Free — colorway Iron (cinza chumbo), tamanho PP.',
      '',
      'Short John de performance com mangas longas e pernas curtas — combinação ideal para meia-estação onde os braços precisam de proteção mas as pernas pedem mobilidade. Neoprene E6 super stretch, sistema Zip Free para máxima vedação. Colorway Iron exclusivo.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho PP (Petite Petite) — recomendado para altura entre 1,60m e 1,65m e peso entre 58-65kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // JUVENIS — Long John Rip Curl 3/2mm
  // ════════════════════════════════════════════════════════════

  // Long John Juvenil 3/2mm BZ — PP
  {
    sku: 'RC-JUV-LJ-32-BZ-PP',
    name: 'Long John Juvenil Rip Curl 3/2mm Back Zip Black PP',
    productFamily: 'long-john-juvenil-rip-curl-3-2-back-zip',
    size: 'PP',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 1699.99,
    gtin: '7908938387565',
    weight: 700,
    supplierProductCode: '17AWFS00900090PP',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'kids',
    wetsuitLine: 'Dawn Patrol',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Long John JUVENIL Rip Curl 3/2mm Back Zip — colorway Black, tamanho PP.',
      '',
      'Long John infantil/juvenil para crianças e adolescentes que estão começando ou aprimorando o surf. Construção 3/2mm para o inverno brasileiro, com cortes apropriados para o corpo em desenvolvimento. Sistema Back Zip facilita os pais ajudarem a vestir e tirar.',
      '',
      DESC_BLOCKS.dawnPatrolLine,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp32,
      '',
      'Tamanho PP juvenil — recomendado para idade entre 8 e 10 anos, altura 1,30m a 1,40m.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // Long John Juvenil 3/2mm BZ — tamanho 8
  {
    sku: 'RC-JUV-LJ-32-BZ-8',
    name: 'Long John Juvenil Rip Curl 3/2mm Back Zip Black 8',
    productFamily: 'long-john-juvenil-rip-curl-3-2-back-zip',
    size: '8',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: false,
    isFeatured: false,
    price: 1399.99,
    gtin: '7908938387619',
    weight: 600,
    supplierProductCode: '14SBFS009000908',
    subcategorySlug: 'wetsuits-long-john',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'kids',
    wetsuitLine: 'Dawn Patrol',
    zipperType: 'back-zip',
    origin: '0',
    description: [
      'Long John JUVENIL Rip Curl 3/2mm Back Zip — colorway Black, tamanho 8 (numérico infantil).',
      '',
      'Long John para crianças entre 6 e 8 anos. Construção 3/2mm para o inverno brasileiro com sistema Back Zip que facilita os pais ajudarem. Cortes apropriados para o corpo em desenvolvimento, proporcionando aquecimento sem restringir movimentos.',
      '',
      DESC_BLOCKS.dawnPatrolLine,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp32,
      '',
      'Tamanho 8 (numérico infantil) — recomendado para idade entre 6 e 8 anos, altura 1,20m a 1,30m.',
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
  let brand = await Brand.findOne({ name: 'Rip Curl' });
  if (!brand) {
    brand = await Brand.create({
      name: 'Rip Curl',
      slug: 'rip-curl',
      isActive: true,
    });
    console.log(`✨ Marca "Rip Curl" criada\n`);
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

  // ─── Subcategorias (Long John e Short John) ────────────────
  console.log('🔍 Buscando subcategorias...');
  const subLongJohn = await Category.findOne({
    slug: 'wetsuits-long-john',
    parent: category._id,
  });
  const subShortJohn = await Category.findOne({
    slug: 'wetsuits-short-john',
    parent: category._id,
  });
  if (!subLongJohn || !subShortJohn) {
    console.error('❌ Subcategorias Long John ou Short John não encontradas.');
    process.exit(1);
  }
  console.log(`✅ Long John: ${subLongJohn.name}`);
  console.log(`✅ Short John: ${subShortJohn.name}\n`);

  const subcategoryMap: Record<string, mongoose.Types.ObjectId> = {
    'wetsuits-long-john': subLongJohn._id,
    'wetsuits-short-john': subShortJohn._id,
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

  // ─── Validação: SKUs duplicados internos ───────────────────
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

  // ─── Validação: SKUs conflito com pt1 ──────────────────────
  console.log('🔍 Verificando conflitos com seed pt1...');
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
  const multipleMains: string[] = [];
  familyMainCount.forEach((count, family) => {
    if (count > 1) multipleMains.push(family);
  });
  if (multipleMains.length > 0) {
    console.error('❌ Famílias com múltiplas mainVariant:', multipleMains);
    process.exit(1);
  }

  // ─── Inserção via upsert ───────────────────────────────────
  console.log(
    `📦 Inserindo/atualizando ${PRODUCTS.length} wetsuits Rip Curl (pt2)...\n`,
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
      p.thickness.replace('/', '-'),
      p.zipperType,
      p.gender,
      p.color.toLowerCase().replace(/\s+/g, '-'),
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
      ncm: '6112.41.00',
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
  console.log('📊 RESUMO PARTE 2 — RIP CURL FEMININOS + JUVENIS');
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
  console.log('📂 FAMÍLIAS desta parte 2:');
  Array.from(families)
    .sort()
    .forEach(f => console.log(`   ${f}`));

  console.log('');
  console.log('✅ Seed parte 2 finalizado.');
  console.log('');
  console.log(
    '🎯 Próximo: seed-wetsuits-rip-curl-pt3.ts (Jaquetas + Lycras + Acessórios)',
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
