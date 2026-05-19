// scripts/revert-quilhas-filters.ts
//
// REVERSÃO: Remove os campos setup, construction e template
// de todos os produtos da categoria "Quilhas".
//
// Use APENAS se quiser desfazer a migração feita por
// migrate-quilhas-filters.ts.
//
// IMPORTANTE: este script NÃO restaura o campo `size` ao seu valor
// original (M/L vs M-L), porque não há registo do valor anterior.
// Se precisar reverter o `size`, faça manualmente.
//
// Rodar com: npx tsx scripts/revert-quilhas-filters.ts

import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import readline from 'readline';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrada no .env.local');
  process.exit(1);
}

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

async function main() {
  console.log('\n⏪ Surfers Paradise — REVERSÃO: Filtros de Quilhas');
  console.log(
    '═══════════════════════════════════════════════════════════════\n',
  );

  await mongoose.connect(MONGODB_URI!);
  console.log('📡 Conectado ao MongoDB\n');

  const quilhasCat = await Category.findOne({ slug: 'quilhas' }).lean();
  if (!quilhasCat) {
    console.error('❌ Categoria "quilhas" não encontrada. Abortando.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const subCats = await Category.find({ parent: quilhasCat._id }).lean();
  const allCatIds = [quilhasCat._id, ...subCats.map(s => s._id)];

  const count = await Product.countDocuments({
    $or: [
      { category: { $in: allCatIds } },
      { subcategory: { $in: allCatIds } },
    ],
  });

  console.log(`📦 Produtos afetados: ${count}\n`);

  console.log(
    '⚠️  Este script vai REMOVER os seguintes campos de todos os produtos:',
  );
  console.log('   ❌ setup');
  console.log('   ❌ construction');
  console.log('   ❌ template\n');
  console.log('⚠️  O campo "size" NÃO será revertido (M-L permanece M-L).\n');

  console.log('🔐 Confirmação:');
  const confirm = await askConfirmation(
    '   Digite SIM para reverter a migração:',
  );
  if (!confirm) {
    console.log('\n❌ Operação cancelada.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('\n🔄 Revertendo...\n');

  const result = await Product.updateMany(
    {
      $or: [
        { category: { $in: allCatIds } },
        { subcategory: { $in: allCatIds } },
      ],
    },
    {
      $unset: {
        setup: '',
        construction: '',
        template: '',
      },
    },
  );

  console.log(`✅ ${result.modifiedCount} produtos revertidos.\n`);

  await mongoose.disconnect();
  console.log('👋 Desconectado. Reversão concluída.\n');
  process.exit(0);
}

main().catch(async err => {
  console.error('\n❌ Erro durante a reversão:');
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
