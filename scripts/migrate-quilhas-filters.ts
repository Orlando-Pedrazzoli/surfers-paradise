// scripts/migrate-quilhas-filters.ts
//
// MIGRAÇÃO: Aplica setup, construction, template e size normalizado
// em todos os produtos da categoria "Quilhas".
//
// IMPORTANTE: este script GRAVA no banco de dados.
// Use SEMPRE depois de validar com analyze-quilhas.ts primeiro.
//
// Rodar com: npx tsx scripts/migrate-quilhas-filters.ts

import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import readline from 'readline';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrada no .env.local');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
// SCHEMAS MÍNIMOS (sem strict para escrever campos novos)
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
// DETECTORES (mesmos do analyze-quilhas.ts)
// ═══════════════════════════════════════════════════════════════

type Setup =
  | 'thruster'
  | 'twin'
  | 'twin-1'
  | 'quad'
  | 'quad-rear'
  | '5-fin'
  | 'single';

function detectSetup(name: string): Setup | null {
  const n = name.toLowerCase().replace(/\s+/g, ' ');
  if (/twin\s*\+\s*1|twin\+1/.test(n)) return 'twin-1';
  if (/\b5[\s-]?fin\b|tri[\s-]?quad/.test(n)) return '5-fin';
  if (/quad\s*rear/.test(n)) return 'quad-rear';
  if (/\bquad\b/.test(n)) return 'quad';
  if (/\btwin\b/.test(n)) return 'twin';
  if (/\bthruster\b|\btri\b/.test(n)) return 'thruster';
  if (/\bsingle\b/.test(n)) return 'single';
  if (/^quilha\b/i.test(name)) return 'thruster';
  return null;
}

const CONSTRUCTIONS: { match: RegExp; value: string }[] = [
  { match: /h4\s+uni[\s-]*carbon|uni[\s-]*carbon/i, value: 'H4 Uni-Carbon' },
  { match: /\bh4\b/i, value: 'H4 Uni-Carbon' },
  { match: /vapor\s*core/i, value: 'Vapor Core' },
  { match: /neo\s*carbon/i, value: 'Neo Carbon' },
  { match: /blackstix\s*\+|blackstix\+/i, value: 'Blackstix+' },
  { match: /blackstix\s*3\.?0|blackstix/i, value: 'Blackstix' },
  { match: /generation\s*series/i, value: 'Generation Series' },
  { match: /techflex/i, value: 'Techflex' },
  { match: /pcc\s*aircore|pc\s*carbon\s*\+?\s*aircore/i, value: 'PCC AirCore' },
  { match: /pc\s*aircore|pc\s*\+?\s*aircore/i, value: 'PC AirCore' },
  { match: /performance\s*core\s*carbon|\bpcc\b/i, value: 'PCC' },
  {
    match: /performance\s*glass|\bpg\s*pro\b|\bpg\b/i,
    value: 'Performance Glass',
  },
  { match: /performance\s*core|\bpc\b/i, value: 'Performance Core' },
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
  return size.replace(/\//g, '-').trim();
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => {
    rl.question(question + ' ', answer => {
      rl.close();
      resolve(answer.trim().toUpperCase() === 'SIM');
    });
  });
}

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

// ═══════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n🌊 Surfers Paradise — MIGRAÇÃO: Filtros de Quilhas');
  console.log(
    '═══════════════════════════════════════════════════════════════\n',
  );

  await mongoose.connect(MONGODB_URI!);
  console.log('📡 Conectado ao MongoDB\n');

  // Achar categoria
  const quilhasCat = await Category.findOne({ slug: 'quilhas' }).lean();
  if (!quilhasCat) {
    console.error('❌ Categoria "quilhas" não encontrada. Abortando.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const subCats = await Category.find({ parent: quilhasCat._id }).lean();
  const allCatIds = [quilhasCat._id, ...subCats.map(s => s._id)];

  const products = (await Product.find({
    $or: [
      { category: { $in: allCatIds } },
      { subcategory: { $in: allCatIds } },
    ],
  }).lean()) as unknown as ProductDoc[];

  console.log(`📦 Total de produtos a atualizar: ${products.length}\n`);

  // ═══ AVISO DESTRUTIVO ═══
  console.log('⚠️  ════════════════════════════════════════════════════ ⚠️');
  console.log('   ATENÇÃO: OPERAÇÃO DE ESCRITA NO BANCO');
  console.log('⚠️  ════════════════════════════════════════════════════ ⚠️\n');
  console.log('Este script vai ATUALIZAR 4 campos em cada produto de Quilhas:');
  console.log('   📝 setup         (novo campo)');
  console.log('   📝 construction  (novo campo)');
  console.log('   📝 template      (novo campo)');
  console.log('   📝 size          (normalizado: M/L → M-L)\n');
  console.log('NÃO serão alterados:');
  console.log('   ✅ nome, slug, sku, descrição');
  console.log('   ✅ preço, custo, estoque');
  console.log('   ✅ imagens, categoria, marca, fornecedor');
  console.log('   ✅ qualquer outro campo\n');
  console.log('💡 Para reverter: execute "scripts/revert-quilhas-filters.ts"');
  console.log('   (que faz $unset dos 3 campos novos).\n');

  // ═══ Confirmação 1 ═══
  console.log('🔐 Confirmação 1 de 2:');
  const confirm1 = await askConfirmation(
    '   Digite SIM para confirmar que entende a operação:',
  );
  if (!confirm1) {
    console.log('\n❌ Operação cancelada pelo usuário.');
    await mongoose.disconnect();
    process.exit(0);
  }
  console.log('');

  // ═══ Confirmação 2 ═══
  console.log('🔐 Confirmação 2 de 2:');
  const confirm2 = await askConfirmation(
    '   Digite SIM novamente para executar a migração:',
  );
  if (!confirm2) {
    console.log('\n❌ Operação cancelada pelo usuário.');
    await mongoose.disconnect();
    process.exit(0);
  }
  console.log('\n');

  // ═══ MIGRAÇÃO ═══
  console.log('🚀 Iniciando migração...\n');

  let updated = 0;
  let setupFail = 0;
  let constructionFail = 0;
  let templateEmpty = 0;
  let sizeNormalized = 0;
  const failures: { sku: string; name: string; missing: string[] }[] = [];

  for (const p of products) {
    const setup = detectSetup(p.name);
    const construction = detectConstruction(p.name);
    const template = detectTemplate(p.description || '');
    const newSize = normalizeSize(p.size);
    const sizeChanged = newSize !== (p.size || '');

    const update: Record<string, string> = {
      setup: setup || '',
      construction: construction || '',
      template: template || '',
    };

    if (sizeChanged) {
      update.size = newSize;
      sizeNormalized++;
    }

    await Product.updateOne({ _id: p._id }, { $set: update });
    updated++;

    if (!setup) setupFail++;
    if (!construction) constructionFail++;
    if (!template) templateEmpty++;

    const missing: string[] = [];
    if (!setup) missing.push('setup');
    if (!construction) missing.push('construction');
    if (missing.length > 0) {
      failures.push({ sku: p.sku, name: p.name, missing });
    }

    // Progress dot every 10
    if (updated % 10 === 0) {
      console.log(
        `   ✅ ${updated}/${products.length} produtos atualizados...`,
      );
    }
  }

  console.log(`\n   ✅ ${updated}/${products.length} produtos atualizados!\n`);

  // ═══ RESUMO ═══
  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log(
    '═══════════════════════════════════════════════════════════════\n',
  );

  console.log(`Total de produtos atualizados:  ${updated}/${products.length}`);
  console.log(`Tamanhos normalizados (M/L→M-L): ${sizeNormalized}`);
  console.log(`Setup não detectado:             ${setupFail}`);
  console.log(`Construction não detectado:      ${constructionFail}`);
  console.log(`Template vazio:                  ${templateEmpty} (esperado)\n`);

  if (failures.length > 0) {
    console.log('⚠️  Produtos com campos críticos faltando:');
    console.log('   (vão precisar de edição manual no admin)\n');
    for (const f of failures) {
      console.log(`   • ${f.sku} — ${f.name}`);
      console.log(`     Faltam: ${f.missing.join(', ')}\n`);
    }
  } else {
    console.log('✅ Todos os produtos têm setup e construction preenchidos!\n');
  }

  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log('🎯 Próximos passos:');
  console.log('   1. Verificar produtos no admin: /admin/produtos');
  console.log('   2. Implementar filtros da sidebar (QuilhasFilters)');
  console.log('   3. Atualizar ProductForm para mostrar campos no admin\n');
  console.log(
    '═══════════════════════════════════════════════════════════════\n',
  );

  await mongoose.disconnect();
  console.log('👋 Desconectado. Migração concluída.\n');
  process.exit(0);
}

main().catch(async err => {
  console.error('\n❌ Erro durante a migração:');
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
