/**
 * Migration: Add isMainVariant field to existing products
 *
 * Run with: npx tsx scripts/migrate-family-system.ts
 *
 * This sets isMainVariant=true and productFamily='' for all existing
 * products that don't have these fields yet, so they remain visible
 * in public listings after the family system is deployed.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }

  const collection = db.collection('products');

  // 1. Add isMainVariant=true to products missing the field
  const result1 = await collection.updateMany(
    { isMainVariant: { $exists: false } },
    { $set: { isMainVariant: true } },
  );
  console.log(`✅ isMainVariant: ${result1.modifiedCount} products updated`);

  // 2. Add empty productFamily to products missing the field
  const result2 = await collection.updateMany(
    { productFamily: { $exists: false } },
    { $set: { productFamily: '' } },
  );
  console.log(`✅ productFamily: ${result2.modifiedCount} products updated`);

  // 3. Add empty variantType to products missing the field
  const result3 = await collection.updateMany(
    { variantType: { $exists: false } },
    { $set: { variantType: '' } },
  );
  console.log(`✅ variantType: ${result3.modifiedCount} products updated`);

  // 4. Add empty color fields to products missing them
  const result4 = await collection.updateMany(
    { color: { $exists: false } },
    { $set: { color: '', colorCode: '', colorCode2: '', size: '' } },
  );
  console.log(
    `✅ color/size fields: ${result4.modifiedCount} products updated`,
  );

  // Summary
  const total = await collection.countDocuments();
  const withFamily = await collection.countDocuments({
    productFamily: { $ne: '' },
  });
  const mainVariants = await collection.countDocuments({ isMainVariant: true });

  console.log('');
  console.log('📊 Summary:');
  console.log(`   Total products: ${total}`);
  console.log(`   With family: ${withFamily}`);
  console.log(`   Main variants: ${mainVariants}`);
  console.log(`   Non-main variants: ${total - mainVariants}`);

  await mongoose.disconnect();
  console.log('');
  console.log('✅ Migration complete!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
