// scripts/analyze-quilhas.ts
//
// DRY-RUN v2: Analisa todos os produtos da categoria "Quilhas" e mostra
// o que o detector vai extrair (setup, construction, template),
// SEM gravar nada no banco.
//
// v2 corrige bugs do v1:
//   - Setup agora confia no NOME (não na descrição, que tinha menções
//     comparativas como "twin-tab" que confundiam o detector)
//   - Construction idem (descrições têm comparações com outras
//     construções que davam falsos positivos)
//   - Template continua a usar descrição (é onde está escrito
//     literalmente "Template Performer", etc.)
//
// Rodar com: npx tsx scripts/analyze-quilhas.ts

import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrada no .env.local');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
// SCHEMAS MÍNIMOS (sem strict para ler campos legados)
// ═══════════════════════════════════════════════════════════════

const CategorySchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    parent: mongoose.Schema.Types.ObjectId,
    level: Number,
  },
  { strict: false, timestamps: true },
);

const ProductSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true },
);

const Category =
  mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Product =
  mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ═══════════════════════════════════════════════════════════════
// DETECTORES (v2)
// ═══════════════════════════════════════════════════════════════

type Setup =
  | 'thruster'
  | 'twin'
  | 'twin-1'
  | 'quad'
  | 'quad-rear'
  | '5-fin'
  | 'single';

/**
 * Detect setup — CONFIA APENAS NO NOME.
 * Ordem importa: mais específico primeiro.
 *
 * 'Tri' e 'Thruster' = ambos thruster (3 fins).
 */
function detectSetup(name: string): Setup | null {
  // Normalizar: remover múltiplos espaços e baixar pra comparar
  const n = name.toLowerCase().replace(/\s+/g, ' ');

  // 1. Twin+1 PRIMEIRO (mais específico que twin)
  if (/twin\s*\+\s*1|twin\+1/.test(n)) return 'twin-1';

  // 2. 5-Fin / Tri-Quad (set completo)
  if (/\b5[\s-]?fin\b|tri[\s-]?quad/.test(n)) return '5-fin';

  // 3. Quad Rear (par de traseiras) — ANTES de "quad" simples
  if (/quad\s*rear/.test(n)) return 'quad-rear';

  // 4. Quad (set completo de 4) — só se não for "quad rear"
  if (/\bquad\b/.test(n)) return 'quad';

  // 5. Twin (puro, sem +1)
  if (/\btwin\b/.test(n)) return 'twin';

  // 6. Thruster / Tri (ambos = 3 fins, normalizar pra "thruster")
  if (/\bthruster\b|\btri\b/.test(n)) return 'thruster';

  // 7. Single (caso raro)
  if (/\bsingle\b/.test(n)) return 'single';

  // 8. FALLBACK: se o produto é uma quilha (começa com "Quilha") e
  // não bateu em nenhum setup acima, assume "thruster" (87% dos casos).
  // Cobre nomes FCS Athlete Series tipo "Quilha FCS II MB Matt Biolos
  // PCC Medium" onde "Tri" é implícito e não escrito.
  if (/^quilha\b/i.test(name)) return 'thruster';

  return null;
}

/**
 * Detect construction — CONFIA APENAS NO NOME.
 * Ordem importa: mais específico/longo primeiro para evitar
 * matches parciais (ex: "PCC AirCore" tem que vir antes de "PCC"
 * que tem que vir antes de "PC").
 */
const CONSTRUCTIONS: { match: RegExp; value: string }[] = [
  // === Top-tier / específicas (mais longas primeiro) ===
  { match: /h4\s+uni[\s-]*carbon|uni[\s-]*carbon/i, value: 'H4 Uni-Carbon' },
  { match: /\bh4\b/i, value: 'H4 Uni-Carbon' },
  { match: /vapor\s*core/i, value: 'Vapor Core' },
  { match: /neo\s*carbon/i, value: 'Neo Carbon' },
  { match: /blackstix\s*\+|blackstix\+/i, value: 'Blackstix+' },
  { match: /blackstix\s*3\.?0|blackstix/i, value: 'Blackstix' },
  { match: /generation\s*series/i, value: 'Generation Series' },
  { match: /techflex/i, value: 'Techflex' },
  // === PC variations (longas primeiro) ===
  { match: /pcc\s*aircore|pc\s*carbon\s*\+?\s*aircore/i, value: 'PCC AirCore' },
  { match: /pc\s*aircore|pc\s*\+?\s*aircore/i, value: 'PC AirCore' },
  { match: /performance\s*core\s*carbon|\bpcc\b/i, value: 'PCC' },
  {
    match: /performance\s*glass|\bpg\s*pro\b|\bpg\b/i,
    value: 'Performance Glass',
  },
  { match: /performance\s*core|\bpc\b/i, value: 'Performance Core' },
  // === Outros materiais ===
  { match: /neo\s*glass/i, value: 'Neo Glass' },
  { match: /glass\s*flex|\bgf\b/i, value: 'Glass Flex' },
  { match: /control\s*series/i, value: 'Control Series' },
  { match: /legacy\s*series/i, value: 'Legacy Series' },
  { match: /rtm\s*hex/i, value: 'RTM Hex' },
  { match: /honeycomb/i, value: 'Honeycomb' },
  { match: /alpha/i, value: 'Alpha' },
  { match: /\bg-?10\b/i, value: 'G-10' },
  { match: /fiberglass/i, value: 'Fiberglass' },
];

function detectConstruction(name: string): string | null {
  for (const c of CONSTRUCTIONS) {
    if (c.match.test(name)) return c.value;
  }
  return null;
}

/**
 * Detect template — usa a DESCRIÇÃO porque é onde está escrito
 * literalmente "Template Performer", "Família Carver", etc.
 */
const TEMPLATES: { match: RegExp; value: string }[] = [
  { match: /template\s+performer|fam[íi]lia\s+performer/i, value: 'Performer' },
  { match: /template\s+carver|fam[íi]lia\s+carver/i, value: 'Carver' },
  { match: /template\s+reactor|fam[íi]lia\s+reactor/i, value: 'Reactor' },
  {
    match: /template\s+accelerator|fam[íi]lia\s+accelerator/i,
    value: 'Accelerator',
  },
  { match: /template\s+rake/i, value: 'Rake' },
  { match: /template\s+neutral/i, value: 'Neutral' },
  { match: /template\s+pivot/i, value: 'Pivot' },
  { match: /template\s+mayhem/i, value: 'Mayhem' },
];

function detectTemplate(description: string): string | null {
  for (const t of TEMPLATES) {
    if (t.match.test(description)) return t.value;
  }
  return null;
}

function normalizeSize(size: string | undefined): string {
  if (!size) return '';
  // M/L → M-L, M/G → M-G, etc.
  return size.replace(/\//g, '-').trim();
}

// ═══════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════

interface ProductDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  size?: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  setup?: string;
  construction?: string;
  template?: string;
}

async function main() {
  console.log(
    '\n🔍 Surfers Paradise — DRY-RUN v2: Análise de Filtros de Quilhas',
  );
  console.log(
    '═══════════════════════════════════════════════════════════════\n',
  );

  await mongoose.connect(MONGODB_URI!);
  console.log('📡 Conectado ao MongoDB\n');

  // Achar a categoria "Quilhas"
  const quilhasCat = await Category.findOne({ slug: 'quilhas' }).lean();
  if (!quilhasCat) {
    console.error('❌ Categoria "quilhas" não encontrada. Abortando.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Pegar subcategorias filhas
  const subCats = await Category.find({ parent: quilhasCat._id }).lean();
  const allCatIds = [quilhasCat._id, ...subCats.map(s => s._id)];

  console.log(`📁 Categoria raiz: ${quilhasCat.name} (${quilhasCat.slug})`);
  console.log(`   Subcategorias: ${subCats.map(s => s.name).join(', ')}\n`);

  // Buscar todos os produtos de Quilhas
  const products = (await Product.find({
    $or: [
      { category: { $in: allCatIds } },
      { subcategory: { $in: allCatIds } },
    ],
  }).lean()) as unknown as ProductDoc[];

  console.log(`📦 Total de produtos encontrados: ${products.length}\n`);
  console.log(
    '═══════════════════════════════════════════════════════════════\n',
  );

  // Stats
  let setupOk = 0;
  let setupFail = 0;
  let constructionOk = 0;
  let constructionFail = 0;
  let templateOk = 0;
  let templateFail = 0;
  let sizeNormalized = 0;

  const setupCounts: Record<string, number> = {};
  const constructionCounts: Record<string, number> = {};
  const templateCounts: Record<string, number> = {};
  const sizeCounts: Record<string, number> = {};
  const failures: { sku: string; name: string; missing: string[] }[] = [];

  for (const p of products) {
    const setup = detectSetup(p.name);
    const construction = detectConstruction(p.name);
    const template = detectTemplate(p.description || '');
    const newSize = normalizeSize(p.size);
    const sizeChanged = newSize !== (p.size || '');

    if (setup) {
      setupOk++;
      setupCounts[setup] = (setupCounts[setup] || 0) + 1;
    } else {
      setupFail++;
    }

    if (construction) {
      constructionOk++;
      constructionCounts[construction] =
        (constructionCounts[construction] || 0) + 1;
    } else {
      constructionFail++;
    }

    if (template) {
      templateOk++;
      templateCounts[template] = (templateCounts[template] || 0) + 1;
    } else {
      templateFail++;
    }

    if (newSize) sizeCounts[newSize] = (sizeCounts[newSize] || 0) + 1;
    if (sizeChanged) sizeNormalized++;

    // Verbose log
    const sizeNote = sizeChanged ? ` → ${newSize} ✓ normalizado` : '';
    console.log(`📦 ${p.name}`);
    console.log(`   SKU: ${p.sku}`);
    console.log(`   ├─ setup         → ${setup || '⚠️  NÃO DETECTADO'}`);
    console.log(`   ├─ construction  → ${construction || '⚠️  NÃO DETECTADO'}`);
    console.log(`   ├─ template      → ${template || '(vazio — ok)'}`);
    console.log(`   └─ size          → ${p.size || '(vazio)'}${sizeNote}`);
    console.log('');

    const missing: string[] = [];
    if (!setup) missing.push('setup');
    if (!construction) missing.push('construction');
    if (missing.length > 0) {
      failures.push({ sku: p.sku, name: p.name, missing });
    }
  }

  // ═══ RESUMO ═══
  console.log(
    '\n═══════════════════════════════════════════════════════════════',
  );
  console.log('📊 RESUMO DA DETECÇÃO');
  console.log(
    '═══════════════════════════════════════════════════════════════\n',
  );

  console.log(`Total de produtos analisados: ${products.length}\n`);

  console.log('🎯 Setup (configuração de fins):');
  console.log(`   ✅ Detectados:  ${setupOk}/${products.length}`);
  console.log(`   ❌ Falharam:    ${setupFail}/${products.length}`);
  for (const [k, v] of Object.entries(setupCounts).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`      • ${k.padEnd(12)} ${v}`);
  }
  console.log('');

  console.log('🔧 Construction (material):');
  console.log(`   ✅ Detectados:  ${constructionOk}/${products.length}`);
  console.log(`   ❌ Falharam:    ${constructionFail}/${products.length}`);
  for (const [k, v] of Object.entries(constructionCounts).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`      • ${k.padEnd(22)} ${v}`);
  }
  console.log('');

  console.log('📐 Template (família do template):');
  console.log(`   ✅ Detectados:  ${templateOk}/${products.length}`);
  console.log(
    `   ⊘ Vazios:       ${templateFail}/${products.length}  (ok, alguns produtos não têm template explícito)`,
  );
  for (const [k, v] of Object.entries(templateCounts).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`      • ${k.padEnd(15)} ${v}`);
  }
  console.log('');

  console.log('📏 Size (após normalização M/L → M-L):');
  console.log(`   🔄 Normalizados: ${sizeNormalized}`);
  for (const [k, v] of Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`      • ${k.padEnd(6)} ${v}`);
  }
  console.log('');

  if (failures.length > 0) {
    console.log('⚠️  PRODUTOS COM CAMPOS NÃO DETECTADOS:');
    console.log(
      '   (precisarão ser editados manualmente no admin após migração)\n',
    );
    for (const f of failures) {
      console.log(`   ❌ ${f.sku} — ${f.name}`);
      console.log(`      Faltam: ${f.missing.join(', ')}\n`);
    }
  } else {
    console.log('✅ Nenhum produto com campos críticos faltando!\n');
  }

  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log('🎯 Próximo passo:');
  console.log('   Se a detecção está correta, rode:');
  console.log('   npx tsx scripts/migrate-quilhas-filters.ts');
  console.log(
    '═══════════════════════════════════════════════════════════════\n',
  );

  await mongoose.disconnect();
  console.log('👋 Desconectado. Nenhum dado foi alterado.\n');
  process.exit(0);
}

main().catch(async err => {
  console.error('\n❌ Erro durante a análise:');
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
