import { config } from 'dotenv';
config({ path: '.env.local' });

import mongoose from 'mongoose';
import Product from '../src/lib/models/Product';
import Brand from '../src/lib/models/Brand';
import Category from '../src/lib/models/Category';
import Supplier from '../src/lib/models/Supplier';

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
    'FT1',
    'FAM1',
    'FAM2',
    'JJF',
    'AM1',
    'AM2',
    'AMB',
    'HC',
    'FG',
    'EA',
    'F6',
    'F8',
    'R4',
    'KI',
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
      if (/\d/.test(word) || /[+/-]/.test(word)) {
        return word.toUpperCase().match(/^[A-Z\d+/-]+$/)
          ? word.toUpperCase()
          : word;
      }
      if (keepUpper.has(word.toUpperCase())) {
        return word.toUpperCase();
      }
      if (i > 0 && keepLower.has(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// ═══════════════════════════════════════════════════════════════
// DADOS — Quilhas Futures dos 2 fornecedores originais
// Todos serão importados com fornecedor MAGIC SURF LTDA
// ═══════════════════════════════════════════════════════════════

interface SeedProduct {
  sku: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  ncm: string;
  origin: string;
  cest: string;
  gtin: string;
  supplierProductCode: string;
}

const PRODUCTS: SeedProduct[] = [
  // BRAZIL TRADE EIRELI (1 produto)
  {
    sku: '1672',
    name: 'Quilha Futures KI Lojista 4009',
    price: 399.0,
    costPrice: 219.9,
    stock: 8,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    gtin: '7890007910197',
    supplierProductCode: '0197',
  },
  // INTERACTION LOGISTICA E COMERCIO EIRELI (7 produtos)
  {
    sku: '1113',
    name: 'Quilha Futures Fins AM1 Techflex Thruster - Black/Blue',
    price: 1650.0,
    costPrice: 824.46,
    stock: 0,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    gtin: '',
    supplierProductCode: '551044300',
  },
  {
    sku: '1112',
    name: 'Quilha Futures Fins F8 HC 5-Fin - Green',
    price: 1950.0,
    costPrice: 995.04,
    stock: 1,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    gtin: '',
    supplierProductCode: '117518250',
  },
  {
    sku: '1111',
    name: 'Quilha Futures Fins F6 HC 5-Fin - Green',
    price: 1950.0,
    costPrice: 995.04,
    stock: 1,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    gtin: '',
    supplierProductCode: '116518250',
  },
  {
    sku: '1110',
    name: 'Quilha Futures Fins AM1 Techflex 5-Fin - Black/Blue',
    price: 2490.0,
    costPrice: 1250.91,
    stock: 2,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    gtin: '',
    supplierProductCode: '551044350',
  },
  {
    sku: '1109',
    name: 'Quilha Futures Fins Blackstix Twin +1 - Frost',
    price: 1590.0,
    costPrice: 796.04,
    stock: 0,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    gtin: '',
    supplierProductCode: '458047100',
  },
  {
    sku: '1108',
    name: 'Quilha Futures Fins EA Techflex Thruster - Grey',
    price: 1590.0,
    costPrice: 796.04,
    stock: 1,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    gtin: '',
    supplierProductCode: '557041100',
  },
  {
    sku: '1107',
    name: 'Quilha Futures Fins R4 HC Thruster - Blue',
    price: 1290.0,
    costPrice: 625.46,
    stock: 0,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    gtin: '',
    supplierProductCode: '113618300',
  },
];

// ═══════════════════════════════════════════════════════════════
// SEED FUNCTION
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

  console.log('🔍 Procurando marca Futures...');
  const brand = await Brand.findOne({ name: 'Futures' });
  if (!brand) {
    console.error(
      '❌ Marca Futures não encontrada. Rode seed-magic-surf.ts primeiro.',
    );
    process.exit(1);
  }
  console.log(`✅ Brand: ${brand.name}\n`);

  console.log('🔍 Procurando categoria Quilhas...');
  const category = await Category.findOne({ slug: 'quilhas' });
  if (!category) {
    console.error(
      '❌ Categoria Quilhas não encontrada. Rode seed-magic-surf.ts primeiro.',
    );
    process.exit(1);
  }
  console.log(`✅ Category: ${category.name}\n`);

  console.log(`📦 Inserindo ${PRODUCTS.length} produtos...\n`);

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
      const slug = generateSlug(normalizedName) + '-' + p.sku;

      await Product.create({
        name: normalizedName,
        slug,
        sku: p.sku,
        description: '',
        price: p.price,
        costPrice: p.costPrice,
        compareAtPrice: 0,
        category: category._id,
        brand: brand._id,
        supplier: supplier._id,
        supplierProductCode: p.supplierProductCode,
        stock: p.stock,
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        images: [],
        thumbnail: '',
        tags: ['quilha', 'futures', 'surf'],
        gtin: p.gtin,
        ncm: p.ncm,
        origin: p.origin,
        cest: p.cest,
        isActive: true,
        isAvailableInStore: true,
        isPublishedOnline: false,
        isMainVariant: true,
      });

      console.log(`✅ ${p.sku} — ${normalizedName}`);
      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${p.sku} — ${msg}`);
      errors.push({ sku: p.sku, error: msg });
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Criados:  ${created}`);
  console.log(`⏭️  Pulados:  ${skipped}`);
  console.log(`❌ Erros:    ${errors.length}`);
  if (errors.length) {
    console.log('\nDetalhes dos erros:');
    errors.forEach(e => console.log(`  ${e.sku}: ${e.error}`));
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
