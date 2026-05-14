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
    'AM',
    'HC',
    'II',
    'III',
    'IV',
    'KI',
    'JJF',
    'EA',
    'F6',
    'F8',
    'R4',
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
  {
    sku: '1813',
    name: 'Quilha FCS II AM Large PC Tri-Quad',
    price: 2200.0,
    costPrice: 1100.0,
    stock: 3,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    gtin: '7890789061346',
    supplierProductCode: '1346',
  },
  {
    sku: '1285',
    name: 'Quilha FCS Eco Blend 3856',
    price: 639.9,
    costPrice: 319.9,
    stock: 6,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    gtin: '7890789060202',
    supplierProductCode: '0202',
  },
  {
    sku: '1284',
    name: 'Quilha FCS Quad 7245',
    price: 799.9,
    costPrice: 399.9,
    stock: 3,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    gtin: '7890007922541',
    supplierProductCode: '2541',
  },
  {
    sku: '1281',
    name: 'Quilha FCS 3910',
    price: 1100.0,
    costPrice: 550.0,
    stock: 14,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    gtin: '7890007910470',
    supplierProductCode: '0470',
  },
  {
    sku: '1278',
    name: 'Quilha FCS 937',
    price: 1699.0,
    costPrice: 850.0,
    stock: 15,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    gtin: '7890789060851',
    supplierProductCode: '0851',
  },
  {
    sku: '1276',
    name: 'Quilha FCS Felipe 4073',
    price: 1399.9,
    costPrice: 700.0,
    stock: 2,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    gtin: '7890007910388',
    supplierProductCode: '0388',
  },
];

async function seed() {
  console.log('🔌 Conectando ao MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Conectado\n');

  console.log('🔍 Procurando fornecedor BRAZIL TRADE EIRELI...');
  const supplier = await Supplier.findOne({ name: 'BRAZIL TRADE EIRELI' });
  if (!supplier) {
    console.error('❌ Fornecedor BRAZIL TRADE EIRELI não encontrado.');
    console.error('   Cadastre primeiro em /admin/fornecedores');
    process.exit(1);
  }
  console.log(`✅ Supplier: ${supplier.name}\n`);

  console.log('🔍 Verificando marca FCS...');
  let brand = await Brand.findOne({ name: 'FCS' });
  if (!brand) {
    brand = await Brand.create({
      name: 'FCS',
      slug: 'fcs',
      isActive: true,
    });
    console.log(`✨ Marca "FCS" criada\n`);
  } else {
    console.log(`✅ Brand: ${brand.name}\n`);
  }

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
        tags: ['quilha', 'fcs', 'surf'],
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
