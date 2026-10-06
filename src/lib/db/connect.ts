import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI não definida. Adicione ao .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // 🔧 06/10/2026 — limites do pool para Vercel + MongoDB Atlas.
    // Sem estas opções o driver usa maxPoolSize 100 e nunca fecha ligações
    // ociosas: num pico de tráfego (ex.: crawler a abrir muitas páginas ao
    // mesmo tempo) cada instância da Vercel podia abrir até 100 ligações e
    // deixá-las abertas. O limite do Atlas é por cluster, partilhado por
    // todas as instâncias.
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // por instância; as queries são curtas
      minPoolSize: 0, // serverless: nada de ligações paradas
      maxIdleTimeMS: 10000, // fecha ligações sem uso há 10 s
      serverSelectionTimeoutMS: 5000, // falha rápido se o Atlas não responder
      appName: process.env.VERCEL
        ? 'surfersparadise-web'
        : 'surfersparadise-local',
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then(m => {
      console.log('✅ MongoDB connected');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
