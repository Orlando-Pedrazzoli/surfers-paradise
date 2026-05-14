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
  // Remove espaços duplos
  name = name.replace(/\s+/g, ' ').trim();

  // Siglas que mantêm uppercase
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
    'PU',
    'EPS',
  ]);

  // Palavras pequenas em minúsculas
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
      // Tem número ou símbolo? Mantém uppercase se for letra
      if (/\d/.test(word) || /[+/-]/.test(word)) {
        return word.toUpperCase().match(/^[A-Z\d+/-]+$/)
          ? word.toUpperCase()
          : word;
      }
      // Sigla conhecida
      if (keepUpper.has(word.toUpperCase())) {
        return word.toUpperCase();
      }
      // Palavra pequena (mas nunca a primeira)
      if (i > 0 && keepLower.has(word.toLowerCase())) {
        return word.toLowerCase();
      }
      // Capitalize normal
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// ═══════════════════════════════════════════════════════════════
// DADOS DOS PRODUTOS (extraídos do CSV Bling — MAGIC SURF LTDA)
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
  supplierProductCode: string;
}

const PRODUCTS: SeedProduct[] = [
  {
    sku: '2096',
    name: 'Quilha Futures Termotech FT1 - Branco | 1008-304-00',
    price: 449.0,
    costPrice: 230.65,
    stock: 5,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    supplierProductCode: 'FT1 Termotech',
  },
  {
    sku: '2095',
    name: 'Quilha Futures Termotech FAM2 Thruster - Branco | 1160-304-00',
    price: 449.0,
    costPrice: 230.65,
    stock: 20,
    ncm: '9506.29.00',
    origin: '0',
    cest: '',
    supplierProductCode: 'FAM2 Termotech',
  },
  {
    sku: '2094',
    name: 'Quilha Futures Termotech FAM1 Thruster - Branco | 1110-304-00',
    price: 449.0,
    costPrice: 230.65,
    stock: 20,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    supplierProductCode: 'FAM1 Termotech',
  },
  {
    sku: '2011',
    name: 'Quilha Futures T2 FG Twin',
    price: 1790.0,
    costPrice: 869.48,
    stock: 3,
    ncm: '9506.29.00',
    origin: '0',
    cest: '',
    supplierProductCode: 'T2 FG TWIN',
  },
  {
    sku: '1996',
    name: 'Quilha Futures Mayhem 3,0 M HC Honeycomb',
    price: 2100.0,
    costPrice: 1023.95,
    stock: 7,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    supplierProductCode: 'MAYHEM 3.0 MEDIUM HC',
  },
  {
    sku: '1995',
    name: 'Quilha Futures JJF Big Wave',
    price: 2790.0,
    costPrice: 1351.97,
    stock: 1,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    supplierProductCode: 'JJF G-10 WAVE QUAD',
  },
  {
    sku: '1994',
    name: 'Quilha Futures Mayhem Ywin +1',
    price: 2090.0,
    costPrice: 1020.55,
    stock: 5,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    supplierProductCode: 'MAYHEM G EVIL TWIN+1',
  },
  {
    sku: '1993',
    name: 'Quilha Futures Mayhem Evil Quad',
    price: 2490.0,
    costPrice: 1238.36,
    stock: 1,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    supplierProductCode: 'MAYHEM EVIL QUAD',
  },
  {
    sku: '1992',
    name: 'Quilha Futures Sharp Eye M Honey',
    price: 1850.0,
    costPrice: 907.75,
    stock: 1,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    supplierProductCode: 'SHARP EYE MEDIUM HC',
  },
  {
    sku: '1991',
    name: 'Quilha Futures AM1/2 Honeycomb',
    price: 1890.0,
    costPrice: 910.05,
    stock: 8,
    ncm: '9506.29.00',
    origin: '0',
    cest: '28.064.00',
    supplierProductCode: 'AM1 HC',
  },
  {
    sku: '1950',
    name: 'Quilha Futures 3/2 Alpha M Carbono Ouro (Conjunto de 5 Quilhas)',
    price: 1990.0,
    costPrice: 971.8,
    stock: 7,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    supplierProductCode: 'M 3/2 AlphaC/5',
  },
  {
    sku: '1949',
    name: 'Quilha Futures 3/2 Alpha Reverse Twin +1 Carbono Vermelho',
    price: 1359.0,
    costPrice: 683.75,
    stock: 5,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    supplierProductCode: '3/2 Alpha Reverse',
  },
  {
    sku: '1948',
    name: 'Quilha Futures Vapor Core M Azul',
    price: 2290.0,
    costPrice: 1127.59,
    stock: 11,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    supplierProductCode: 'Vapor Core M - Azul',
  },
  {
    sku: '1947',
    name: 'Quilha Futures 3/2 Alpha M Carbono Ouro',
    price: 1359.0,
    costPrice: 665.57,
    stock: 4,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    supplierProductCode: 'M 3/2 Alpha',
  },
  {
    sku: '1946',
    name: 'Quilha Futures Alpha M Carbono Verde',
    price: 1499.0,
    costPrice: 740.34,
    stock: 3,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    supplierProductCode: 'M Alpha',
  },
  {
    sku: '1945',
    name: 'Quilha Futures AMB Alpha Carbono Azul Petroleo',
    price: 1449.0,
    costPrice: 700.6,
    stock: 2,
    ncm: '9506.29.00',
    origin: '1',
    cest: '',
    supplierProductCode: 'AMB Alpha',
  },
];

// ═══════════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log('🔌 Conectando ao MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Conectado\n');

  // 1. Encontrar Supplier "MAGIC SURF LTDA"
  console.log('🔍 Procurando fornecedor MAGIC SURF LTDA...');
  const supplier = await Supplier.findOne({ name: 'MAGIC SURF LTDA' });
  if (!supplier) {
    console.error('❌ Fornecedor MAGIC SURF LTDA não encontrado.');
    console.error('   Cadastre primeiro em /admin/fornecedores');
    process.exit(1);
  }
  console.log(`✅ Supplier: ${supplier.name} (${supplier._id})\n`);

  // 2. findOrCreate Brand "Futures"
  console.log('🔍 Verificando marca Futures...');
  let brand = await Brand.findOne({ name: 'Futures' });
  if (!brand) {
    brand = await Brand.create({
      name: 'Futures',
      slug: 'futures',
      isActive: true,
    });
    console.log(`✨ Marca "Futures" criada (${brand._id})\n`);
  } else {
    console.log(`✅ Brand: ${brand.name} (${brand._id})\n`);
  }

  // 3. findOrCreate Category "Quilhas"
  console.log('🔍 Verificando categoria Quilhas...');
  let category = await Category.findOne({ slug: 'quilhas' });
  if (!category) {
    category = await Category.create({
      name: 'Quilhas',
      slug: 'quilhas',
      level: 0,
      isActive: true,
    });
    console.log(`✨ Categoria "Quilhas" criada (${category._id})\n`);
  } else {
    console.log(`✅ Category: ${category.name} (${category._id})\n`);
  }

  // 4. Inserir produtos
  console.log(`📦 Inserindo ${PRODUCTS.length} produtos...\n`);

  let created = 0;
  let skipped = 0;
  const errors: { sku: string; error: string }[] = [];

  for (const p of PRODUCTS) {
    try {
      // Verifica se já existe (por SKU)
      const existing = await Product.findOne({ sku: p.sku });
      if (existing) {
        console.log(`⏭️  ${p.sku} já existe — pulando`);
        skipped++;
        continue;
      }

      const normalizedName = normalizeName(p.name);
      const slug = generateSlug(normalizedName) + '-' + p.sku;

      const product = await Product.create({
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

  // 5. Relatório
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
