import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não definida no .env.local');
  process.exit(1);
}

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ MongoDB connected');

    const userCollection = mongoose.connection.collection('users');

    const adminEmail =
      process.env.ADMIN_EMAIL || 'admin@surfersparadise.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

    const existingAdmin = await userCollection.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`⚠️  Admin já existe: ${adminEmail}`);
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await userCollection.insertOne({
      name: 'Admin Surfers Paradise',
      email: adminEmail,
      password: hashedPassword,
      cpf: '',
      phone: '',
      role: 'admin',
      isEmailVerified: true,
      addresses: [],
      orderCount: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Admin criado com sucesso!`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  }
}

seedAdmin();
