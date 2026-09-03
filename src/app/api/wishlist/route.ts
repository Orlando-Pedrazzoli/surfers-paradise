// 📄 src/app/api/wishlist/route.ts
// Persistência server-side da lista de desejos (usuário LOGADO).
// Guests usam apenas localStorage no client — sem conta exigida para
// começar a lista (best practice); o servidor entra como sync multi-device.
//
//   GET    → ids dos produtos na lista do usuário
//   POST   {productId}      → adiciona (idempotente via $addToSet)
//   DELETE ?productId=...   → remove
//   PUT    {productIds: []} → MERGE (união) — chamado uma vez no login para
//                             absorver a lista de guest do localStorage
//
// upsert:true no POST/PUT cria o documento na primeira interação.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Wishlist from '@/lib/models/Wishlist';
import { auth } from '@/lib/auth/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id || null;
}

const UNAUTHORIZED = NextResponse.json(
  { success: false, error: 'Não autenticado.' },
  { status: 401 },
);

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return UNAUTHORIZED;

    await connectDB();
    const doc = await Wishlist.findOne({ user: userId }).lean<{
      items?: { product: mongoose.Types.ObjectId; addedAt: Date }[];
    }>();

    const productIds = (doc?.items || [])
      .sort((a, b) => +new Date(b.addedAt) - +new Date(a.addedAt))
      .map(i => String(i.product));

    return NextResponse.json({ success: true, productIds });
  } catch (error) {
    console.error('[Wishlist GET] erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar lista de desejos.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return UNAUTHORIZED;

    const { productId } = await request.json().catch(() => ({}));
    if (typeof productId !== 'string' || !mongoose.isValidObjectId(productId)) {
      return NextResponse.json(
        { success: false, error: 'productId inválido.' },
        { status: 400 },
      );
    }

    await connectDB();
    // Idempotente: remove se já existir e re-insere com addedAt novo —
    // re-adicionar um item sobe ele para o topo da lista.
    await Wishlist.updateOne(
      { user: userId },
      { $pull: { items: { product: productId } } },
      { upsert: true },
    );
    await Wishlist.updateOne(
      { user: userId },
      { $push: { items: { product: productId, addedAt: new Date() } } },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Wishlist POST] erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao adicionar à lista de desejos.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return UNAUTHORIZED;

    const productId = request.nextUrl.searchParams.get('productId') || '';
    if (!mongoose.isValidObjectId(productId)) {
      return NextResponse.json(
        { success: false, error: 'productId inválido.' },
        { status: 400 },
      );
    }

    await connectDB();
    await Wishlist.updateOne(
      { user: userId },
      { $pull: { items: { product: productId } } },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Wishlist DELETE] erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover da lista de desejos.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return UNAUTHORIZED;

    const { productIds } = await request.json().catch(() => ({}));
    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { success: false, error: 'productIds deve ser um array.' },
        { status: 400 },
      );
    }
    const validIds = productIds
      .filter((id): id is string => typeof id === 'string')
      .filter(id => mongoose.isValidObjectId(id))
      .slice(0, 200); // teto sanitário

    await connectDB();
    const doc = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { items: [] } },
      { upsert: true, new: true },
    );

    const existing = new Set(
      doc.items.map((i: { product: mongoose.Types.ObjectId }) =>
        String(i.product),
      ),
    );
    const toAdd = validIds.filter(id => !existing.has(id));
    if (toAdd.length > 0) {
      await Wishlist.updateOne(
        { user: userId },
        {
          $push: {
            items: {
              $each: toAdd.map(id => ({ product: id, addedAt: new Date() })),
            },
          },
        },
      );
    }

    // Devolve a lista final (união) para o client sincronizar
    const merged = await Wishlist.findOne({ user: userId }).lean<{
      items?: { product: mongoose.Types.ObjectId; addedAt: Date }[];
    }>();
    const finalIds = (merged?.items || [])
      .sort((a, b) => +new Date(b.addedAt) - +new Date(a.addedAt))
      .map(i => String(i.product));

    return NextResponse.json({ success: true, productIds: finalIds });
  } catch (error) {
    console.error('[Wishlist PUT] erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao sincronizar lista de desejos.' },
      { status: 500 },
    );
  }
}
