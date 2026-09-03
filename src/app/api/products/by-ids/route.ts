// 📄 src/app/api/products/by-ids/route.ts
// Retorna produtos por lista de ids — usado pela página da lista de desejos
// (funciona para GUESTS, que guardam só ids no localStorage, e para logados).
// Pública e read-only; devolve o mesmo shape que o ProductCard consome.
// Preserva a ordem dos ids recebidos (ordem da lista do usuário) e omite
// silenciosamente ids inexistentes/inativos (produto removido do catálogo).

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IDS = 100;

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('ids') || '';
    const ids = raw
      .split(',')
      .map(s => s.trim())
      .filter(id => mongoose.isValidObjectId(id))
      .slice(0, MAX_IDS);

    if (ids.length === 0) {
      return NextResponse.json({ success: true, products: [] });
    }

    await connectDB();
    const products = await Product.find({ _id: { $in: ids }, isActive: true })
      .select(
        '_id name slug price compareAtPrice images thumbnail isOnSale isNewArrival isFeatured salePercentage productFamily variantType color colorCode colorCode2 size isMainVariant sku weight stock',
      )
      .lean();

    // Preserva a ordem da lista do usuário
    const byId = new Map(products.map(p => [String(p._id), p]));
    const ordered = ids.map(id => byId.get(id)).filter(Boolean);

    return NextResponse.json({ success: true, products: ordered });
  } catch (error) {
    console.error('[Products by-ids] erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar produtos.' },
      { status: 500 },
    );
  }
}
