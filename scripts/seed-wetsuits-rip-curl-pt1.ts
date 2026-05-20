/**
 * seed-wetsuits-rip-curl-pt1.ts
 *
 * Seed PARTE 1 — Rip Curl Long Johns Masculinos TOP-TIER
 *
 * Esta parte cobre os 12 produtos premium/top-of-line da Rip Curl no
 * catálogo do Surfers Paradise (Moema, SP):
 *   - Flashbomb Fusion E7 Zip Free (topo absoluto — Fusion Dry Seam)
 *   - Flashbomb 3/2mm Zip Free / Back Zip (linha premium secagem rápida)
 *   - E-Bomb E7 Zip Free (alto desempenho importado)
 *   - E-Bomb 3/2mm Zip Free Iced Grey / Black (linha performance nacional)
 *   - E-Bomb 2/2mm Zip Free (meia-estação performance)
 *
 * Total: 12 SKUs (incluindo variantes de tamanho da família E-Bomb 22GB Black)
 *
 * Rodar com:
 *   npx tsx scripts/seed-wetsuits-rip-curl-pt1.ts
 *
 * Flags:
 *   WIPE_RIPCURL_BEFORE_SEED = false (NÃO apaga nada por default)
 *
 * Campos preenchidos:
 *   ✅ sku, name, supplierProductCode (código do Bling)
 *   ✅ description (descrição técnica PT-BR completa)
 *   ✅ price, costPrice (= price/2)
 *   ✅ gtin (EAN do CSV Bling quando disponível)
 *   ✅ weight (estimado por modelo: 950g–1300g)
 *   ✅ dimensions (estimado para envio)
 *   ✅ ncm '6112.41.00' (vestuário esportivo de malha)
 *   ✅ origin '0' (Nacional) ou '1' (Importado) conforme produto
 *   ✅ color, colorCode, size, productFamily, isMainVariant
 *   ✅ wetsuitType, thickness, gender, wetsuitLine, zipperType (filtros)
 *   ✅ Categoria=Wetsuits, Subcategoria=Long John
 *   ✅ isActive, isAvailableInStore, isNewArrival
 *
 * Campos a completar depois (via admin):
 *   ⬜ images, thumbnail (fotos do produto)
 *   ⬜ isPublishedOnline (admin habilita após fotos)
 *
 * Pré-requisitos:
 *   ✓ Fornecedor "MAGIC SURF LTDA" cadastrado em /admin/fornecedores
 *   ✓ Categoria "Wetsuits" + subcategoria "Long John" via seed-categories.ts
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

const WIPE_RIPCURL_BEFORE_SEED = false; // ⚠️ true = apaga TODOS wetsuits Rip Curl

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
  return name.replace(/\s+/g, ' ').trim();
}

// ═══════════════════════════════════════════════════════════════
// BLOCOS DESCRITIVOS REUTILIZÁVEIS
// ═══════════════════════════════════════════════════════════════

const DESC_BLOCKS = {
  // ─── Tecnologias Rip Curl ───
  neopreneE7: `Neoprene E7 — Topo de Linha Rip Curl
A revolução E7 é o neoprene mais elástico e leve já produzido pela Rip Curl. Oferece 20% mais elasticidade que o E6 e 15% menos peso, sem perder durabilidade. Movimento praticamente sem resistência durante remadas e manobras.`,

  neopreneE6: `Neoprene E6 — Performance Comprovada
Construção em Neoprene E6 super stretch — 20% mais elástico e 15% mais quente que o E5. Padrão de alto desempenho usado por atletas profissionais nas competições do Circuito Mundial WSL. O forro Thermo Lining cobre toda a parte interna para máximo aquecimento.`,

  thermoLining: `Forro Thermo Lining
Revestimento térmico interno em toda a roupa que retém o calor corporal e reduz a sensação de frio. Tecido macio em contato com a pele, secagem rápida e proteção contra vento gelado ao remar.`,

  flashLining: `Forro Flash Lining — Seca em até 15 minutos
A tecnologia Flash Lining é exclusiva da Rip Curl. Forro interno com fibras especiais que aceleram drasticamente a evaporação da água — sua roupa fica seca em até 15 minutos, permitindo duas sessões no mesmo dia sem precisar vestir um wetsuit molhado e frio.`,

  zipFree: `Sistema Zip Free — Sem Zíper
Tecnologia Zip Free elimina completamente o zíper, oferecendo máxima liberdade de remada, menos peso e zero pontos de infiltração nas costas. O sistema lock slide na entrada é prático e rápido. Topo de linha em vedação.`,

  chestZip: `Sistema Chest Zip — Zíper no Peito
Zíper localizado horizontalmente no peito (acima do esterno). Oferece excelente vedação contra entrada de água, melhor flex nas costas e remada mais confortável que o Back Zip tradicional.`,

  backZip: `Sistema Back Zip — Zíper nas Costas
Zíper longitudinal nas costas — o sistema mais fácil de vestir e tirar, ideal para quem está começando ou prefere praticidade. Vedação boa, com flap interno para impedir a entrada de água.`,

  fusionDrySeam: `Tecnologia Fusion Dry Seam — Zero Costuras
A inovação Fusion Dry Seam elimina 96% das costuras tradicionais do wetsuit. Em vez de perfurar o neoprene com agulha, as bordas são afuniladas, coladas e cobertas com fita E7 — criando uma vedação superior, mais durável e mais flexível que qualquer costura. A única costura tradicional restante fica ao redor do pescoço.`,

  meshSkin: `Painéis Mesh Skin
Painéis externos em Mesh Skin que absorvem o calor solar e reduzem a sensação de frio durante a remada. Reduzem o atrito da água e o peso quando molhado.`,

  // ─── Guias de temperatura ───
  temp32: `Guia de Temperatura — 3/2mm
Espessura ideal para água fria entre 14 e 19°C. Recomendada para o inverno no Sul e Sudeste do Brasil (SC, PR, RS, SP, RJ, ES), além de picos internacionais como Peru, Califórnia, Austrália, África do Sul e Europa em meia-estação. A espessura mais versátil para o surfista brasileiro.`,

  temp32Cold: `Guia de Temperatura — 3/2mm (Água Gelada)
Espessura 3/2mm projetada para água gelada e fria entre 11 e 17°C. Recomendada para o inverno brasileiro nos estados do Rio Grande do Sul, Santa Catarina, São Paulo e Rio de Janeiro. Também ideal para meia-estação na Europa e EUA.`,

  temp22: `Guia de Temperatura — 2/2mm
Espessura ideal para água amena entre 18 e 22°C. Recomendada para meia-estação no Sul e Sudeste do Brasil, e para o inverno do Nordeste. Combinação leve entre proteção térmica e máxima mobilidade.`,

  // ─── Cuidados ───
  cuidados: `Cuidados com sua Roupa de Borracha
• Sempre seque dobrada ao meio — nunca pendure pelo ombro (o peso da roupa molhada pode esticar o neoprene).
• Lave apenas com água doce após cada uso — sal e cloro deterioram o neoprene.
• Não use sabão, sabonete ou shampoo.
• Seque à sombra — sol direto degrada o material.
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
  gtin: string; // EAN do Bling (vazio se não tiver)
  weight: number; // gramas
  supplierProductCode: string; // código do fornecedor Bling
  // Atributos de wetsuit
  wetsuitType: string;
  thickness: string;
  gender: string;
  wetsuitLine: string;
  zipperType: string;
  // Fiscal
  origin: '0' | '1' | '2';
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO PARTE 1 — 12 WETSUITS RIP CURL TOP-TIER
// ═══════════════════════════════════════════════════════════════

const PRODUCTS: SeedWetsuit[] = [
  // ════════════════════════════════════════════════════════════
  // FAMÍLIA: FLASHBOMB FUSION E7 3/2mm Zip Free — TOPO ABSOLUTO
  // ════════════════════════════════════════════════════════════
  {
    sku: 'RC-FB-FUSION-E7-32-ZF-MP',
    name: 'Long John Rip Curl Flashbomb Fusion E7 3/2mm Zip Free Black MP',
    productFamily: 'long-john-rip-curl-flashbomb-fusion-e7-3-2-zip-free',
    size: 'MP',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 3699.99,
    gtin: '7908782978933', // Bling: 14LMFSA628A628MP
    weight: 1100,
    supplierProductCode: '14LMFSA628A628MP',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Flashbomb Fusion',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John Rip Curl Flashbomb Fusion E7 3/2mm Zip Free — colorway Black, tamanho MP (Medium Petite).',
      '',
      'O PRIMEIRO WETSUIT DO MUNDO PRATICAMENTE SEM COSTURAS. O Flashbomb Fusion é o topo absoluto da linha Rip Curl — combinação inédita da tecnologia Fusion Dry Seam (96% sem costuras) com Neoprene 100% E7 Flash Lining (o mais leve e flexível disponível no mercado). Mais de 50 anos de inovações Rip Curl concentrados em uma única roupa de borracha.',
      '',
      'Por que é o topo de linha?',
      '- 96% sem costuras (Fusion Dry Seam) → vedação superior, zero infiltração',
      '- 100% Neoprene E7 (o mais elástico do mercado) → 20% mais flex que E6',
      '- Forro 100% E7 Flash Lining → seca em até 15 minutos',
      '- Sistema Zip Free de última geração → sem zíper, sem peso, sem vazamento',
      '- Punhos selados e gola anatômica',
      '- Construção 100% importada',
      '',
      DESC_BLOCKS.fusionDrySeam,
      '',
      DESC_BLOCKS.neopreneE7,
      '',
      DESC_BLOCKS.flashLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp32Cold,
      '',
      'Tamanho MP (Medium Petite) — recomendado para altura entre 1,68m e 1,73m e peso entre 70-78kg, com tronco menos alongado.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // FAMÍLIA: FLASHBOMB 3/2mm Zip Free — Premium (Flash Lining + E6/E7)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'RC-FB-32-ZF-FBOMB-G',
    name: 'Long John Rip Curl Flashbomb 3/2mm Zip Free Black G',
    productFamily: 'long-john-rip-curl-flashbomb-3-2-zip-free',
    size: 'G',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 3699.99,
    gtin: '7908938358206', // Bling: 17GMFS00900090G
    weight: 1150,
    supplierProductCode: '17GMFS00900090G',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Flashbomb',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John Rip Curl Flashbomb 3/2mm Zip Free — colorway Black, tamanho G.',
      '',
      'A linha Flashbomb foi eleita 4 VEZES o melhor wetsuit do mundo pela SIMA (Surfing Industry Manufactures Association). É o wetsuit ideal para o surfista que treina mais de uma vez por dia — graças ao revolucionário forro Flash Lining, sua roupa seca em até 15 minutos, evitando ter que voltar a vestir um neoprene encharcado.',
      '',
      'Por que escolher o Flashbomb?',
      '- Forro Flash Lining → seca em até 15 minutos',
      '- Painéis externos Mesh Skin → absorvem calor solar, reduzem peso molhado',
      '- Sistema Zip Free → máxima vedação e mobilidade',
      '- Construção sem costuras críticas',
      '- 4x melhor wetsuit do mundo pela SIMA',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.flashLining,
      '',
      DESC_BLOCKS.meshSkin,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp32Cold,
      '',
      'Tamanho G (Large) — recomendado para altura entre 1,78m e 1,83m e peso entre 80-88kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // FLASHBOMB 3/2 BACK ZIP (variante da família Flashbomb)
  {
    sku: 'RC-FB-32-BZ-FBOMB-M',
    name: 'Long John Rip Curl Flashbomb 3/2mm Back Zip Black M',
    productFamily: 'long-john-rip-curl-flashbomb-3-2-back-zip',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 2999.99,
    gtin: '7908938358787', // Bling: 17SMFS00900090M
    weight: 1180,
    supplierProductCode: '17SMFS00900090M',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Flashbomb',
    zipperType: 'back-zip',
    origin: '1',
    description: [
      'Long John Rip Curl Flashbomb 3/2mm Back Zip — colorway Black, tamanho M.',
      '',
      'A versão Back Zip do lendário Flashbomb — para quem prefere a praticidade de vestir e tirar com facilidade, sem abrir mão da tecnologia Flash Lining e da reputação de 4x melhor wetsuit do mundo (SIMA). O zíper nas costas torna esta versão mais econômica que a Zip Free, ideal para quem está começando no inverno ou prefere conveniência.',
      '',
      'Por que escolher a versão Back Zip?',
      '- Mais fácil de vestir e tirar — ideal para iniciantes ou frio extremo',
      '- Mantém todo o Flash Lining → seca em até 15 minutos',
      '- Mesh Skin externo nas áreas do peito e costas',
      '- Flap interno no zíper para impedir entrada de água',
      '- Preço mais acessível que a versão Zip Free',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.flashLining,
      '',
      DESC_BLOCKS.meshSkin,
      '',
      DESC_BLOCKS.backZip,
      '',
      DESC_BLOCKS.temp32Cold,
      '',
      'Tamanho M (Medium) — recomendado para altura entre 1,73m e 1,78m e peso entre 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // FLASHBOMB 3/2 ZF VARIANTE 281 (segundo SKU Flashbomb ZF)
  {
    sku: 'RC-FB-32-ZF-281-M',
    name: 'Long John Rip Curl Flashbomb 3/2mm Zip Free Black M',
    productFamily: 'long-john-rip-curl-flashbomb-3-2-zip-free',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: false, // família já tem main no SKU acima (G)
    isFeatured: false,
    price: 2999.99,
    gtin: '', // Bling sem EAN
    weight: 1100,
    supplierProductCode: '',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Flashbomb',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John Rip Curl Flashbomb 3/2mm Zip Free — colorway Black, tamanho M.',
      '',
      'Variante tamanho M da família Flashbomb 3/2mm Zip Free. Mesma tecnologia premium da versão Large: Flash Lining que seca em 15 minutos, Mesh Skin externo, sistema Zip Free para máxima vedação. Eleita 4x o melhor wetsuit do mundo pela SIMA.',
      '',
      'Tamanho M (Medium) — recomendado para altura entre 1,73m e 1,78m e peso entre 73-80kg.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.flashLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp32Cold,
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // FLASHBOMB 2/2mm Zip Free
  {
    sku: 'RC-FB-22-ZF-MG',
    name: 'Long John Rip Curl Flashbomb 2/2mm Zip Free Black MG',
    productFamily: 'long-john-rip-curl-flashbomb-2-2-zip-free',
    size: 'MG',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 2999.99,
    gtin: '7908680990570', // Bling: 14PMFS90MG
    weight: 950,
    supplierProductCode: '14PMFS90MG',
    wetsuitType: 'long-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'Flashbomb',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John Rip Curl Flashbomb 2/2mm Zip Free — colorway Black, tamanho MG.',
      '',
      'A versão 2/2mm do Flashbomb é a roupa premium para meia-estação. Toda a tecnologia da família Flashbomb (Flash Lining, Mesh Skin, Zip Free) em uma espessura mais leve, perfeita para temperaturas amenas onde o 3/2mm seria demais e a Lycra seria pouca.',
      '',
      'Por que escolher o Flashbomb 2/2?',
      '- Mesma performance Flash Lining (seca em 15 minutos)',
      '- Mais leve e flexível que o 3/2mm',
      '- Ideal para meia-estação SP/RJ ou inverno do Nordeste',
      '- Mantém vedação Zip Free premium',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.flashLining,
      '',
      DESC_BLOCKS.meshSkin,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho MG (Medium-Grande) — recomendado para altura entre 1,76m e 1,80m e peso entre 76-82kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // FAMÍLIA: E-BOMB E7 3/2mm Zip Free — Performance Importada
  // ════════════════════════════════════════════════════════════
  {
    sku: 'RC-EBOMB-E7-32-ZF-ICED-PP',
    name: 'Long John Rip Curl E-Bomb E7 3/2mm Zip Free Iced Grey PP',
    productFamily: 'long-john-rip-curl-e-bomb-e7-3-2-zip-free-iced-grey',
    size: 'PP',
    color: 'Iced Grey',
    colorCode: '#9CA3AF',
    colorCode2: '#1F2937',
    isMainVariant: true,
    isFeatured: true,
    price: 2799.99,
    gtin: '7908782964837', // Bling: 14VMFS142142PP
    weight: 1050,
    supplierProductCode: '14VMFS142142PP',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb E7',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John Rip Curl E-Bomb E7 3/2mm Zip Free — colorway Iced Grey (peito cinza claro / corpo preto), tamanho PP.',
      '',
      'O E-Bomb E7 é o resultado de TRÊS ANOS de desenvolvimento conjunto entre a equipe de wetsuits da Rip Curl e os surfistas campeões mundiais Mick Fanning, Gabriel Medina e Tyler Wright. Foi nesse projeto que nasceu o exclusivo Neoprene E7. Esta é a roupa testada e aprovada nas competições do Circuito Mundial WSL.',
      '',
      'Por que o E-Bomb E7 é especial?',
      '- 3 anos de desenvolvimento com campeões mundiais',
      '- Painel superior em UMA ÚNICA PEÇA de Neoprene E7 (sem costuras nos ombros)',
      '- Cintura e pernas em E6 com Thermo Lining',
      '- Sistema Zip Free para máxima liberdade',
      '- Construção 100% importada',
      '- Colorway Iced Grey exclusivo (peito cinza claro)',
      '',
      DESC_BLOCKS.neopreneE7,
      '',
      'Construção Híbrida E7 + E6',
      'O painel superior (peito, costas, ombros) é feito de uma única peça contínua de Neoprene E7 — sem costuras nos ombros, oferecendo elasticidade sem precedentes para remada e manobras. A cintura e as pernas são em Neoprene E6 com Thermo Lining, garantindo o equilíbrio perfeito entre desempenho e proteção térmica.',
      '',
      DESC_BLOCKS.thermoLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp32,
      '',
      'Tamanho PP (Petite Petite) — recomendado para altura entre 1,60m e 1,65m e peso entre 58-65kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // E-Bomb E7 3/2mm (não-Iced — outra variante da família E7)
  {
    sku: 'RC-EBOMB-E7-32-ZF-BLK-P',
    name: 'Long John Rip Curl E-Bomb E7 3/2mm Zip Free Black P',
    productFamily: 'long-john-rip-curl-e-bomb-e7-3-2-zip-free-black',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 2899.99,
    gtin: '7908782978605', // Bling: 150MFS9090P
    weight: 1050,
    supplierProductCode: '150MFS9090P',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb E7',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John Rip Curl E-Bomb E7 3/2mm Zip Free — colorway Black, tamanho P.',
      '',
      'A versão Black clássica do E-Bomb E7 — o long john mais usado por atletas profissionais nas competições do Circuito Mundial WSL. Desenvolvido em parceria de 3 anos com Mick Fanning, Gabriel Medina e Tyler Wright. Painel superior em peça única de Neoprene E7 sem costuras nos ombros, oferecendo elasticidade sem precedentes.',
      '',
      DESC_BLOCKS.neopreneE7,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp32,
      '',
      'Tamanho P (Petite) — recomendado para altura entre 1,65m e 1,70m e peso entre 65-72kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // FAMÍLIA: FUSION BOMB 3/2mm — Inverno extremo
  // ════════════════════════════════════════════════════════════
  {
    sku: 'RC-FUSION-BOMB-32-M',
    name: 'Long John Rip Curl Fusion Bomb 3/2mm Zip Free Black M',
    productFamily: 'long-john-rip-curl-fusion-bomb-3-2',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: true,
    price: 3999.99,
    gtin: '7908782979022', // Bling: 15QMFS9090M
    weight: 1200,
    supplierProductCode: '15QMFS9090M',
    wetsuitType: 'long-john',
    thickness: '3/2',
    gender: 'masculino',
    wetsuitLine: 'Flashbomb Fusion',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John Rip Curl Flashbomb Fusion 3/2mm Zip Free — colorway Black, tamanho M.',
      '',
      'A combinação suprema da Rip Curl: tecnologia Fusion Dry Seam (96% sem costuras) + Neoprene 100% E7 + Flash Lining. É a roupa premium absoluta para quem quer o melhor que o mercado oferece em flexibilidade, vedação e secagem rápida. Wetsuit usado em situações extremas — desde inverno de Santa Catarina até picos internacionais como Califórnia e Europa em meia-estação.',
      '',
      DESC_BLOCKS.fusionDrySeam,
      '',
      DESC_BLOCKS.neopreneE7,
      '',
      DESC_BLOCKS.flashLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp32Cold,
      '',
      'Tamanho M (Medium) — recomendado para altura entre 1,73m e 1,78m e peso entre 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // FAMÍLIA: E-BOMB 22GB Zip Free Black — 5 tamanhos (variantes)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'RC-EBOMB-22-ZF-BLK-P',
    name: 'Long John Rip Curl E-Bomb 2/2mm Zip Free Black P',
    productFamily: 'long-john-rip-curl-e-bomb-2-2-zip-free-black',
    size: 'P',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: false,
    isFeatured: false,
    price: 2699.99,
    gtin: '7908680934321', // Bling: 14XMFS90P
    weight: 950,
    supplierProductCode: '14XMFS90P',
    wetsuitType: 'long-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'zip-free',
    origin: '0',
    description: [
      'Long John Rip Curl E-Bomb 2/2mm Zip Free — colorway Black, tamanho P.',
      '',
      'Versão 2/2mm da linha E-Bomb — a roupa mais usada por atletas profissionais nas competições do Circuito Mundial. Construída com Neoprene E6 super stretch com forro Thermo Lining interno. Sistema Zip Free para máxima liberdade de movimento. Espessura ideal para meia-estação no Sul/Sudeste ou inverno do Nordeste.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho P (Petite) — recomendado para altura entre 1,65m e 1,70m e peso entre 65-72kg.',
      '',
      DESC_BLOCKS.cuidados,
      '',
      DESC_BLOCKS.garantia,
    ].join('\n'),
  },

  {
    sku: 'RC-EBOMB-22-ZF-BLK-MP',
    name: 'Long John Rip Curl E-Bomb 2/2mm Zip Free Black MP',
    productFamily: 'long-john-rip-curl-e-bomb-2-2-zip-free-black',
    size: 'MP',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true, // main da família 22 Black
    isFeatured: false,
    price: 2699.99,
    gtin: '7908680934338', // Bling: 14XMFS90MP
    weight: 1000,
    supplierProductCode: '14XMFS90MP',
    wetsuitType: 'long-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'zip-free',
    origin: '0',
    description: [
      'Long John Rip Curl E-Bomb 2/2mm Zip Free — colorway Black, tamanho MP.',
      '',
      'Versão 2/2mm da linha E-Bomb em tamanho MP (Medium Petite). A roupa mais usada por atletas profissionais nas competições do Circuito Mundial WSL. Neoprene E6 super stretch com forro Thermo Lining interno. Sistema Zip Free para máxima liberdade.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho MP (Medium Petite) — recomendado para altura entre 1,68m e 1,73m e peso entre 70-78kg, com tronco menos alongado.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  {
    sku: 'RC-EBOMB-22-ZF-BLK-M',
    name: 'Long John Rip Curl E-Bomb 2/2mm Zip Free Black M',
    productFamily: 'long-john-rip-curl-e-bomb-2-2-zip-free-black',
    size: 'M',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: false,
    isFeatured: false,
    price: 2699.99,
    gtin: '7908680934345', // Bling: 14XMFS90M
    weight: 1050,
    supplierProductCode: '14XMFS90M',
    wetsuitType: 'long-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'zip-free',
    origin: '0',
    description: [
      'Long John Rip Curl E-Bomb 2/2mm Zip Free — colorway Black, tamanho M.',
      '',
      'Versão 2/2mm da linha E-Bomb em tamanho M. A roupa mais usada por atletas profissionais nas competições do Circuito Mundial WSL. Neoprene E6 super stretch com forro Thermo Lining interno. Sistema Zip Free.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho M (Medium) — recomendado para altura entre 1,73m e 1,78m e peso entre 73-80kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  {
    sku: 'RC-EBOMB-22-ZF-BLK-G',
    name: 'Long John Rip Curl E-Bomb 2/2mm Zip Free Black G',
    productFamily: 'long-john-rip-curl-e-bomb-2-2-zip-free-black',
    size: 'G',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: false,
    isFeatured: false,
    price: 2699.99,
    gtin: '7908680934369', // Bling: 14XMFS90G
    weight: 1100,
    supplierProductCode: '14XMFS90G',
    wetsuitType: 'long-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'zip-free',
    origin: '0',
    description: [
      'Long John Rip Curl E-Bomb 2/2mm Zip Free — colorway Black, tamanho G.',
      '',
      'Versão 2/2mm da linha E-Bomb em tamanho G. A roupa mais usada por atletas profissionais nas competições do Circuito Mundial WSL. Neoprene E6 super stretch com forro Thermo Lining interno. Sistema Zip Free.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho G (Large) — recomendado para altura entre 1,78m e 1,83m e peso entre 80-88kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  {
    sku: 'RC-EBOMB-22-ZF-BLK-GG',
    name: 'Long John Rip Curl E-Bomb 2/2mm Zip Free Black GG',
    productFamily: 'long-john-rip-curl-e-bomb-2-2-zip-free-black',
    size: 'GG',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: false,
    isFeatured: false,
    price: 2699.99,
    gtin: '7908680934376', // Bling: 14XMFS90GG
    weight: 1200,
    supplierProductCode: '14XMFS90GG',
    wetsuitType: 'long-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'zip-free',
    origin: '0',
    description: [
      'Long John Rip Curl E-Bomb 2/2mm Zip Free — colorway Black, tamanho GG.',
      '',
      'Versão 2/2mm da linha E-Bomb em tamanho GG (Extra Grande). A roupa mais usada por atletas profissionais nas competições do Circuito Mundial WSL. Neoprene E6 super stretch com forro Thermo Lining interno. Sistema Zip Free.',
      '',
      DESC_BLOCKS.neopreneE6,
      '',
      DESC_BLOCKS.thermoLining,
      '',
      DESC_BLOCKS.zipFree,
      '',
      DESC_BLOCKS.temp22,
      '',
      'Tamanho GG (Extra Grande) — recomendado para altura entre 1,83m e 1,88m e peso entre 88-95kg.',
      '',
      DESC_BLOCKS.cuidados,
    ].join('\n'),
  },

  // ════════════════════════════════════════════════════════════
  // E-BOMB Long Sleeve 2/2mm Zip Free PP (variante longa-curta)
  // ════════════════════════════════════════════════════════════
  {
    sku: 'RC-EBOMB-22-ZF-LSL-PP',
    name: 'Long John Rip Curl E-Bomb L/SL 2/2mm Zip Free Black PP',
    productFamily: 'long-john-rip-curl-e-bomb-l-sl-2-2-zip-free',
    size: 'PP',
    color: 'Black',
    colorCode: '#000000',
    isMainVariant: true,
    isFeatured: false,
    price: 2899.9,
    gtin: '7908938358619', // Bling: 17PMFS00900090PP
    weight: 1000,
    supplierProductCode: '17PMFS00900090PP',
    wetsuitType: 'long-john',
    thickness: '2/2',
    gender: 'masculino',
    wetsuitLine: 'E-Bomb',
    zipperType: 'zip-free',
    origin: '1',
    description: [
      'Long John Rip Curl E-Bomb Long Sleeve 2/2mm Zip Free — colorway Black, tamanho PP.',
      '',
      'Versão importada com mangas longas (Long Sleeve) e Neoprene E6 super stretch. Sistema Zip Free para máxima liberdade. Construção importada com acabamento premium — preço posicionado entre a linha nacional 22 Black e o Flashbomb.',
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
  console.log('🔍 Verificando marca Rip Curl...');
  let brand = await Brand.findOne({ name: 'Rip Curl' });
  if (!brand) {
    brand = await Brand.create({
      name: 'Rip Curl',
      slug: 'rip-curl',
      description:
        'A marca australiana líder mundial em wetsuits, fundada em 1969 em Torquay, Austrália. Patrocinadora de surfistas campeões mundiais como Mick Fanning, Gabriel Medina e Tyler Wright.',
      isActive: true,
    });
    console.log(`✨ Marca "Rip Curl" criada\n`);
  } else {
    console.log(`✅ Brand: ${brand.name}\n`);
  }

  // ─── Category: Wetsuits (raiz) ─────────────────────────────
  console.log('🔍 Procurando categoria Wetsuits...');
  const category = await Category.findOne({ slug: 'wetsuits', level: 0 });
  if (!category) {
    console.error(
      '❌ Categoria Wetsuits não encontrada. Rode seed-categories.ts primeiro.',
    );
    process.exit(1);
  }
  console.log(`✅ Category: ${category.name}\n`);

  // ─── Subcategory: Long John ────────────────────────────────
  console.log('🔍 Procurando subcategoria Long John...');
  const subcategory = await Category.findOne({
    slug: 'wetsuits-long-john',
    parent: category._id,
  });
  if (!subcategory) {
    console.error('❌ Subcategoria "Long John" não encontrada.');
    console.error('   Rode seed-categories.ts primeiro.');
    process.exit(1);
  }
  console.log(`✅ Subcategory: ${subcategory.name}\n`);

  // ─── WIPE (opcional — DESABILITADO POR DEFAULT) ────────────
  if (WIPE_RIPCURL_BEFORE_SEED) {
    console.log('⚠️  WIPE_RIPCURL_BEFORE_SEED = true');
    console.log(
      `🗑️  Apagando todos produtos Rip Curl da categoria Wetsuits...`,
    );
    const wipeResult = await Product.deleteMany({
      brand: brand._id,
      category: category._id,
    });
    console.log(
      `🗑️  ${wipeResult.deletedCount} produto(s) Rip Curl apagado(s)\n`,
    );
  }

  // ─── Validação: SKUs duplicados internos ───────────────────
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
  const familiesWithMultipleMains: string[] = [];
  familyMainCount.forEach((count, family) => {
    if (count > 1) familiesWithMultipleMains.push(family);
  });
  if (familiesWithMultipleMains.length > 0) {
    console.error('❌ Famílias com múltiplas mainVariant:');
    familiesWithMultipleMains.forEach(f => console.error(`   ${f}`));
    process.exit(1);
  }

  // ─── Inserção via upsert ───────────────────────────────────
  console.log(
    `📦 Inserindo/atualizando ${PRODUCTS.length} wetsuits Rip Curl (pt1 — Long Johns top-tier)...\n`,
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
      'long-john',
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
      subcategory: subcategory._id,
      brand: brand._id,
      supplier: supplier._id,
      supplierProductCode: p.supplierProductCode,
      images: [],
      thumbnail: '',
      stock: 1, // estoque inicial — ajustar no admin
      weight: p.weight,
      dimensions: {
        length: 40,
        width: 30,
        height: 8,
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
      isPublishedOnline: false, // admin habilita após enviar fotos
      gtin: p.gtin || '',
      ncm: '6112.41.00', // vestuário esportivo (maiôs/calções) malha
      origin: p.origin,
      cest: '',
      // Atributos de Wetsuit
      wetsuitType: p.wetsuitType,
      thickness: p.thickness,
      gender: p.gender,
      wetsuitLine: p.wetsuitLine,
      zipperType: p.zipperType,
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
  console.log('📊 RESUMO PARTE 1 — RIP CURL LONG JOHNS TOP-TIER');
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
  console.log('📂 FAMÍLIAS desta parte 1:');
  Array.from(families)
    .sort()
    .forEach(f => console.log(`   ${f}`));

  console.log('');
  console.log('✅ Seed parte 1 finalizado.');
  console.log('');
  console.log('🎯 Próximos passos:');
  console.log('   1. Acessar /admin/produtos para conferir');
  console.log('   2. Subir as fotos de cada produto');
  console.log('   3. Habilitar isPublishedOnline depois das fotos');
  console.log(
    '   4. Rodar seed-wetsuits-rip-curl-pt2.ts (Femininos + Dawn Patrol)',
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
