// scripts/seed-categories.ts
//
// RESET COMPLETO + SEED de categorias do Surfers Paradise.
//
// IMPORTANTE: este script APAGA:
//   - TODOS os produtos
//   - TODAS as categorias
// E depois cria a estrutura nova com 6 raízes + 20 subcategorias.
//
// Rodar com: npx tsx scripts/seed-categories.ts
//
// Estrutura final:
//   - Pranchas (Shortboard, Funboard, Longboard, Fish, Gun, Softboard)
//   - Quilhas (Sistema FCS II, Sistema Futures, Longboard/SUP) — sem FCS I
//   - Wetsuits (Long John, Short John, Jaqueta, Lycra, Acessórios)
//   - Decks (sem subs — filtro por marca)
//   - Leashes (sem subs — filtro por marca)
//   - Capas (Refletiva, Toalha, Térmica, Dupla, Sarcófago)

import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import readline from 'readline';

// ═══════════════════════════════════════════════════════════════
// CONEXÃO
// ═══════════════════════════════════════════════════════════════

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrada no .env');
  process.exit(1);
}

// Schemas mínimos
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    level: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    sku: String,
  },
  { strict: false, timestamps: true },
);

const Category =
  mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Product =
  mongoose.models.Product || mongoose.model('Product', ProductSchema);

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

// ═══════════════════════════════════════════════════════════════
// ESTRUTURA DAS CATEGORIAS
// ═══════════════════════════════════════════════════════════════

interface CategorySeed {
  name: string;
  order: number;
  isFeatured?: boolean;
  description?: string;
  children?: CategorySeed[];
}

const CATEGORIES: CategorySeed[] = [
  {
    name: 'Pranchas',
    order: 1,
    isFeatured: true,
    description:
      'Pranchas de surf novas e usadas. Use o filtro para escolher entre Shortboard, Longboard, Fish, Gun, Funboard e Softboard.',
    children: [
      { name: 'Shortboard', order: 1 },
      { name: 'Funboard / Mid-length', order: 2 },
      { name: 'Longboard', order: 3 },
      { name: 'Fish', order: 4 },
      { name: 'Gun', order: 5 },
      { name: 'Softboard / Iniciante', order: 6 },
    ],
  },
  {
    name: 'Quilhas',
    order: 2,
    isFeatured: true,
    description:
      'Quilhas para todos os sistemas. Filtre por marca, tipo e tamanho.',
    children: [
      { name: 'Sistema FCS II', order: 1 },
      { name: 'Sistema Futures', order: 2 },
      { name: 'Longboard / SUP', order: 3 },
    ],
  },
  {
    name: 'Wetsuits',
    order: 3,
    isFeatured: true,
    description:
      'Roupas de borracha (neoprene) para todas as temperaturas. Long John, Short John, Jaquetas, Lycras e acessórios.',
    children: [
      { name: 'Long John', order: 1 },
      { name: 'Short John', order: 2 },
      { name: 'Jaqueta Neoprene', order: 3 },
      { name: 'Lycra / Neolycra', order: 4 },
      { name: 'Acessórios Neoprene', order: 5 },
    ],
  },
  {
    name: 'Decks',
    order: 4,
    isFeatured: true,
    description:
      'Antiderrapantes (decks) para todas as posições. Filtre por marca.',
    children: [],
  },
  {
    name: 'Leashes',
    order: 5,
    isFeatured: true,
    description:
      'Cordinhas (leashes) para todos os tipos de prancha. Filtre por marca, comprimento e espessura.',
    children: [],
  },
  {
    name: 'Capas',
    order: 6,
    isFeatured: true,
    description:
      'Capas e bags para sua prancha. Filtre por tipo (refletiva, toalha, térmica, dupla, sarcófago).',
    children: [
      { name: 'Refletiva', order: 1 },
      { name: 'Toalha / Tecido', order: 2 },
      { name: 'Térmica', order: 3 },
      { name: 'Dupla', order: 4 },
      { name: 'Sarcófago / Viagem', order: 5 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🌊 Surfers Paradise — Reset Completo + Seed de Categorias\n');
  console.log('═════════════════════════════════════════════════════════\n');

  // 1. Conectar
  console.log('📡 Conectando ao MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Conectado\n');

  // 2. Contar o que existe hoje
  const existingProducts = await Product.countDocuments();
  const existingCategories = await Category.countDocuments();

  console.log('📊 Estado atual do banco:');
  console.log(`   Produtos:    ${existingProducts}`);
  console.log(`   Categorias:  ${existingCategories}\n`);

  // 3. AVISO BIG WARNING
  console.log('⚠️  ════════════════════════════════════════════════════ ⚠️');
  console.log('   ATENÇÃO: OPERAÇÃO DESTRUTIVA');
  console.log('⚠️  ════════════════════════════════════════════════════ ⚠️\n');
  console.log('Este script vai APAGAR PERMANENTEMENTE:');
  console.log(`   ❌ Todos os ${existingProducts} produtos`);
  console.log(`   ❌ Todas as ${existingCategories} categorias\n`);
  console.log('E depois vai criar:');
  console.log(
    '   ✅ 6 categorias raiz (Pranchas, Quilhas, Wetsuits, Decks, Leashes, Capas)',
  );
  console.log('   ✅ 20 subcategorias\n');
  console.log(
    'Marcas, fornecedores, banners, pedidos, clientes — NÃO serão afetados.\n',
  );

  // 4. Dupla confirmação
  console.log('🔐 Confirmação 1 de 2:');
  const confirm1 = await askConfirmation(
    '   Digite SIM para confirmar que entende que produtos e categorias serão apagados:',
  );
  if (!confirm1) {
    console.log('\n❌ Operação cancelada pelo usuário.');
    await mongoose.disconnect();
    process.exit(0);
  }
  console.log('');

  console.log('🔐 Confirmação 2 de 2:');
  const confirm2 = await askConfirmation(
    '   Digite SIM novamente para executar o reset:',
  );
  if (!confirm2) {
    console.log('\n❌ Operação cancelada pelo usuário.');
    await mongoose.disconnect();
    process.exit(0);
  }
  console.log('\n');

  // 5. APAGAR
  console.log('🗑️  Iniciando limpeza...\n');

  console.log('   Apagando produtos...');
  const deletedProducts = await Product.deleteMany({});
  console.log(`   ✅ ${deletedProducts.deletedCount} produtos removidos\n`);

  console.log('   Apagando categorias...');
  const deletedCategories = await Category.deleteMany({});
  console.log(`   ✅ ${deletedCategories.deletedCount} categorias removidas\n`);

  // 6. CRIAR estrutura nova
  console.log('🌱 Criando nova estrutura de categorias...\n');
  let totalCreated = 0;

  for (const rootCat of CATEGORIES) {
    const rootDoc = await Category.create({
      name: rootCat.name,
      slug: generateSlug(rootCat.name),
      description: rootCat.description || '',
      parent: null,
      level: 0,
      order: rootCat.order,
      isActive: true,
      isFeatured: rootCat.isFeatured || false,
    });
    totalCreated++;
    console.log(`   📁 ${rootCat.name.padEnd(30)} → /${rootDoc.slug}`);

    if (rootCat.children && rootCat.children.length > 0) {
      for (const childCat of rootCat.children) {
        const childSlug = `${rootDoc.slug}-${generateSlug(childCat.name)}`;
        await Category.create({
          name: childCat.name,
          slug: childSlug,
          description: childCat.description || '',
          parent: rootDoc._id,
          level: 1,
          order: childCat.order,
          isActive: true,
          isFeatured: false,
        });
        totalCreated++;
        console.log(`      └─ ${childCat.name.padEnd(28)}  → /${childSlug}`);
      }
    } else {
      console.log(`      └─ (sem subcategorias — filtros por marca)`);
    }
    console.log('');
  }

  // 7. Resumo final
  console.log('═════════════════════════════════════════════════════════');
  console.log(`✅ RESET CONCLUÍDO!\n`);

  const finalProducts = await Product.countDocuments();
  const finalCategories = await Category.countDocuments();
  const rootCount = await Category.countDocuments({ level: 0 });
  const subCount = await Category.countDocuments({ level: 1 });

  console.log(`📊 Estado final do banco:`);
  console.log(`   Produtos:           ${finalProducts}  (limpo)`);
  console.log(`   Categorias:         ${finalCategories}`);
  console.log(`     ├─ Raízes:        ${rootCount}`);
  console.log(`     └─ Subcategorias: ${subCount}\n`);

  console.log('🎯 Próximos passos:');
  console.log('   1. Acessar /admin/categorias para conferir a estrutura');
  console.log('   2. Cadastrar produtos via /admin/produtos/novo');
  console.log(
    '      (use o botão "+ Nova Marca" se a marca não existir ainda)',
  );
  console.log('   3. Para Pranchas: use tag "novo" ou "usado" no campo Tags\n');

  await mongoose.disconnect();
  console.log('👋 Desconectado do MongoDB. Tudo certo!\n');
  process.exit(0);
}

main().catch(async err => {
  console.error('\n❌ Erro durante a execução:');
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
