// 📄 src/app/api/coupons/[id]/route.ts
// v2 (cupons restritos por categoria/marca):
// - PUT aceita applicableCategories/applicableBrands — arrays de ObjectIds
//   validados. Enviar [] REMOVE a restrição (cupom volta a valer para a
//   loja inteira); ausente/undefined mantém o valor atual.
// - GET popula as refs (name/slug) para o CouponForm exibir a seleção.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Coupon from '@/lib/models/Coupon';
// Registro dos schemas referenciados pelos .populate() abaixo. Em serverless
// (Vercel) cada rota é um bundle isolado: sem estes imports, o Mongoose
// lança "Schema hasn't been registered for model \"Category\"". A âncora
// _deps impede que o import seja removido como não-usado (mesma convenção
// de products/route.ts).
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';
import { auth } from '@/lib/auth/config';

const _deps = [Category, Brand];
void _deps;

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === 'admin';
}

/**
 * Normaliza e valida um array de ObjectIds vindo do client.
 * Retorna null se inválido. AQUI (PUT), undefined → undefined
 * (campo não enviado = não alterar), diferente do POST.
 */
function parseIdArrayForUpdate(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value)) return null;
  const ids: string[] = [];
  for (const v of value) {
    if (typeof v !== 'string' || !mongoose.isValidObjectId(v)) return null;
    ids.push(v);
  }
  return [...new Set(ids)];
}

// GET — buscar um cupom
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 },
      );
    }
    await connectDB();
    const { id } = await params;
    const coupon = await Coupon.findById(id)
      .populate('applicableCategories', 'name slug')
      .populate('applicableBrands', 'name slug')
      .lean();
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupom não encontrado' },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('GET coupon error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar cupom' },
      { status: 500 },
    );
  }
}

// PUT — atualizar cupom
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 },
      );
    }
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const {
      code,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive,
      applicableCategories,
      applicableBrands,
    } = body;

    if (type && type !== 'percentage' && type !== 'fixed') {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido' },
        { status: 400 },
      );
    }
    if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Valor deve ser maior que zero' },
        { status: 400 },
      );
    }
    if (type === 'percentage' && value > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentual não pode passar de 100%' },
        { status: 400 },
      );
    }
    if (
      validFrom &&
      validUntil &&
      new Date(validUntil) <= new Date(validFrom)
    ) {
      return NextResponse.json(
        { success: false, error: 'A data final deve ser após a inicial' },
        { status: 400 },
      );
    }

    // Restrições de categoria/marca
    const categoryIds = parseIdArrayForUpdate(applicableCategories);
    if (categoryIds === null) {
      return NextResponse.json(
        { success: false, error: 'Categorias inválidas' },
        { status: 400 },
      );
    }
    const brandIds = parseIdArrayForUpdate(applicableBrands);
    if (brandIds === null) {
      return NextResponse.json(
        { success: false, error: 'Marcas inválidas' },
        { status: 400 },
      );
    }

    // Checar duplicidade de código (excluindo o próprio)
    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      const duplicate = await Coupon.findOne({
        code: normalizedCode,
        _id: { $ne: id },
      }).lean();
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Já existe um cupom com esse código' },
          { status: 409 },
        );
      }
    }

    const update: Record<string, unknown> = {};
    if (code) update.code = code.trim().toUpperCase();
    if (type) update.type = type;
    if (value !== undefined) update.value = value;
    if (minOrderValue !== undefined) update.minOrderValue = minOrderValue;
    if (maxDiscount !== undefined) update.maxDiscount = maxDiscount;
    if (usageLimit !== undefined) update.usageLimit = usageLimit;
    if (validFrom) update.validFrom = new Date(validFrom);
    if (validUntil) update.validUntil = new Date(validUntil);
    if (isActive !== undefined) update.isActive = isActive;
    if (categoryIds !== undefined) update.applicableCategories = categoryIds;
    if (brandIds !== undefined) update.applicableBrands = brandIds;

    const coupon = await Coupon.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupom não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('PUT coupon error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao atualizar cupom';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// DELETE — excluir cupom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 },
      );
    }
    await connectDB();
    const { id } = await params;
    const deleted = await Coupon.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Cupom não encontrado' },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE coupon error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir cupom' },
      { status: 500 },
    );
  }
}
