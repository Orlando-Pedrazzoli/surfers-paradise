import { config } from 'dotenv';
config({ path: '.env.local' });

import mongoose from 'mongoose';
import Category from '../src/lib/models/Category';
import Brand from '../src/lib/models/Brand';
import Product from '../src/lib/models/Product';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI não encontrado em .env.local');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Conectado ao MongoDB\n');

  // ═══════════════════════════════════════════════════════
  // 1. CATEGORIAS
  // ═══════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  console.log('CATEGORIAS');
  console.log('═'.repeat(60));

  const categories = await Category.find({}).sort({ level: 1, name: 1 }).lean();
  console.log(`Total: ${categories.length}\n`);

  // Mapa de pai → filhos
  const childrenMap: { [parentId: string]: typeof categories } = {};
  const rootCategories: typeof categories = [];

  for (const cat of categories) {
    if (cat.parent) {
      const pid = cat.parent.toString();
      if (!childrenMap[pid]) childrenMap[pid] = [];
      childrenMap[pid].push(cat);
    } else {
      rootCategories.push(cat);
    }
  }

  // Imprime árvore
  console.log('📂 ÁRVORE DE CATEGORIAS:\n');
  for (const root of rootCategories) {
    const childrenCount = childrenMap[root._id.toString()]?.length || 0;
    console.log(
      `📁 ${root.name.padEnd(30)} (level=${root.level}, slug=/${root.slug})${childrenCount > 0 ? ` [${childrenCount} subs]` : ''}`,
    );

    const children = childrenMap[root._id.toString()] || [];
    for (const child of children) {
      const subChildrenCount = childrenMap[child._id.toString()]?.length || 0;
      console.log(
        `   └─ ${child.name.padEnd(27)} (slug=/${child.slug})${subChildrenCount > 0 ? ` [${subChildrenCount} subs]` : ''}`,
      );
    }
    console.log('');
  }

  // ═══════════════════════════════════════════════════════
  // 2. MARCAS
  // ═══════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  console.log('MARCAS');
  console.log('═'.repeat(60));

  const brands = await Brand.find({}).sort({ name: 1 }).lean();
  console.log(`Total: ${brands.length}\n`);

  for (const brand of brands) {
    console.log(`🏷️  ${brand.name.padEnd(30)} (slug=${brand.slug})`);
  }

  // ═══════════════════════════════════════════════════════
  // 3. DETECÇÃO DE CONFLITOS
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('⚠️  DETECÇÃO DE CONFLITOS');
  console.log('═'.repeat(60) + '\n');

  // Nomes que aparecem tanto em Category quanto em Brand
  const categoryNames = new Set(
    categories.map(c => c.name.toLowerCase().trim()),
  );
  const conflicts: { name: string; categoryId: string; brandId: string }[] = [];

  for (const brand of brands) {
    if (categoryNames.has(brand.name.toLowerCase().trim())) {
      const cat = categories.find(
        c => c.name.toLowerCase().trim() === brand.name.toLowerCase().trim(),
      );
      if (cat) {
        conflicts.push({
          name: brand.name,
          categoryId: cat._id.toString(),
          brandId: brand._id.toString(),
        });
      }
    }
  }

  if (conflicts.length === 0) {
    console.log('✅ Nenhum nome duplicado entre Categoria e Marca.\n');
  } else {
    console.log(
      `⚠️  ${conflicts.length} nome(s) aparecem como Categoria E como Marca:\n`,
    );
    for (const c of conflicts) {
      console.log(`  • "${c.name}"`);
      console.log(`    Category ID: ${c.categoryId}`);
      console.log(`    Brand ID:    ${c.brandId}`);
    }
    console.log('');
  }

  // ═══════════════════════════════════════════════════════
  // 4. USO REAL POR PRODUTOS
  // ═══════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  console.log('USO REAL POR PRODUTOS');
  console.log('═'.repeat(60) + '\n');

  // Contagem de produtos por categoria
  const products = await Product.find({}).lean();
  console.log(`Total de produtos: ${products.length}\n`);

  // Categorias com produtos
  const categoryUsage: { [catId: string]: number } = {};
  for (const p of products) {
    if (p.category) {
      const cid = p.category.toString();
      categoryUsage[cid] = (categoryUsage[cid] || 0) + 1;
    }
  }

  console.log('📊 PRODUTOS POR CATEGORIA:\n');
  const usedCategories: typeof categories = [];
  const unusedCategories: typeof categories = [];

  for (const cat of categories) {
    const count = categoryUsage[cat._id.toString()] || 0;
    if (count > 0) {
      usedCategories.push(cat);
      console.log(`  ✅ ${cat.name.padEnd(30)} ${count} produto(s)`);
    } else {
      unusedCategories.push(cat);
    }
  }

  if (unusedCategories.length > 0) {
    console.log(`\n📊 CATEGORIAS SEM PRODUTOS (${unusedCategories.length}):\n`);
    for (const cat of unusedCategories) {
      console.log(
        `  ⚪ ${cat.name.padEnd(30)} (slug=${cat.slug}, level=${cat.level})`,
      );
    }
  }

  // Marcas com produtos
  const brandUsage: { [brandId: string]: number } = {};
  for (const p of products) {
    if (p.brand) {
      const bid = p.brand.toString();
      brandUsage[bid] = (brandUsage[bid] || 0) + 1;
    }
  }

  console.log('\n📊 PRODUTOS POR MARCA:\n');
  const usedBrands: typeof brands = [];
  const unusedBrands: typeof brands = [];

  for (const brand of brands) {
    const count = brandUsage[brand._id.toString()] || 0;
    if (count > 0) {
      usedBrands.push(brand);
      console.log(`  ✅ ${brand.name.padEnd(30)} ${count} produto(s)`);
    } else {
      unusedBrands.push(brand);
    }
  }

  if (unusedBrands.length > 0) {
    console.log(`\n📊 MARCAS SEM PRODUTOS (${unusedBrands.length}):\n`);
    for (const brand of unusedBrands) {
      console.log(`  ⚪ ${brand.name.padEnd(30)} (slug=${brand.slug})`);
    }
  }

  // ═══════════════════════════════════════════════════════
  // 5. RECOMENDAÇÕES
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('💡 RECOMENDAÇÕES AUTOMÁTICAS');
  console.log('═'.repeat(60) + '\n');

  if (conflicts.length > 0) {
    console.log('🔴 Tens nomes duplicados entre Category e Brand:');
    console.log('   → Decisão típica: manter como Brand, eliminar a Category');
    console.log('   → Posso gerar um script para fazer isto se confirmares.\n');
  }

  if (unusedCategories.length > 5) {
    console.log(
      `🟡 Tens ${unusedCategories.length} categorias sem nenhum produto.`,
    );
    console.log('   → Considera apagar as que não vais usar.\n');
  }

  if (unusedBrands.length > 5) {
    console.log(`🟡 Tens ${unusedBrands.length} marcas sem nenhum produto.`);
    console.log('   → Considera apagar as que não vais usar.\n');
  }

  await mongoose.disconnect();
  console.log('✅ Diagnóstico completo.\n');
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
