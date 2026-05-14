import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';
import Supplier from '@/lib/models/Supplier';

const _deps = [Category, Brand, Supplier];
void _deps;

function sanitizeProductBody(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized = { ...body };
  const objectIdFields = ['category', 'subcategory', 'brand', 'supplier'];
  for (const field of objectIdFields) {
    if (sanitized[field] === '' || sanitized[field] === undefined) {
      if (field === 'subcategory' || field === 'supplier') {
        sanitized[field] = null;
      } else {
        delete sanitized[field];
      }
    }
  }
  return sanitized;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate({
        path: 'subcategory',
        select: 'name slug',
        match: { _id: { $exists: true } },
      })
      .populate('brand', 'name slug logo')
      .populate({
        path: 'supplier',
        select: 'name slug',
        match: { _id: { $exists: true } },
      })
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('GET product error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar produto';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

async function updateProduct(
  id: string,
  rawBody: Record<string, unknown>,
): Promise<NextResponse> {
  const body = sanitizeProductBody(rawBody);

  if (body.isPublishedOnline === true) {
    const existing = await Product.findById(id).lean();
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 },
      );
    }

    const merged = { ...existing, ...body };
    const dimensions = merged.dimensions as
      | { length?: number; width?: number; height?: number }
      | undefined;

    const minimumCheck =
      !!merged.name &&
      !!merged.sku &&
      (merged.price as number) > 0 &&
      !!merged.category &&
      !!merged.brand &&
      typeof merged.description === 'string' &&
      merged.description.trim().length >= 20 &&
      Array.isArray(merged.images) &&
      merged.images.length > 0 &&
      (merged.weight as number) > 0 &&
      (dimensions?.length ?? 0) > 0 &&
      (dimensions?.width ?? 0) > 0 &&
      (dimensions?.height ?? 0) > 0;

    if (!minimumCheck) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Produto incompleto não pode ser publicado online. Verifique: descrição (≥20 caracteres), imagens, peso e dimensões.',
        },
        { status: 400 },
      );
    }
  }

  const doc = await Product.findById(id);
  if (!doc) {
    return NextResponse.json(
      { success: false, error: 'Produto não encontrado' },
      { status: 404 },
    );
  }

  Object.assign(doc, body);
  await doc.save();

  return NextResponse.json({ success: true, product: doc.toObject() });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    return await updateProduct(id, body);
  } catch (error) {
    console.error('PUT product error:', error);
    const message =
      error instanceof Error && error.message.includes('E11000')
        ? 'Já existe um produto com este SKU ou slug'
        : error instanceof Error
          ? error.message
          : 'Erro ao atualizar produto';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    return await updateProduct(id, body);
  } catch (error) {
    console.error('PATCH product error:', error);
    const message =
      error instanceof Error && error.message.includes('E11000')
        ? 'Já existe um produto com este SKU ou slug'
        : error instanceof Error
          ? error.message
          : 'Erro ao atualizar produto';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, message: 'Produto removido' });
  } catch (error) {
    console.error('DELETE product error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao remover produto';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
