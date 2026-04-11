import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!;
  const products = await db
    .collection('products')
    .find(
      {},
      {
        projection: {
          name: 1,
          productFamily: 1,
          variantType: 1,
          color: 1,
          colorCode: 1,
          colorCode2: 1,
          size: 1,
          isMainVariant: 1,
        },
      },
    )
    .toArray();

  products.forEach(p => console.log(JSON.stringify(p)));
  await mongoose.disconnect();
}

main();
