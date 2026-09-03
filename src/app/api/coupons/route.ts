// 📄 src/app/api/coupons/route.ts
// v2 (cupons restritos por categoria/marca):
// - POST aceita applicableCategories/applicableBrands — arrays de ObjectIds
//   (strings) validados com mongoose.isValidObjectId. Arrays vazios ou
//   ausentes = cupom de loja inteira (retrocompatível).

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
 * Retorna null se o valor for inválido (não-array ou com id malformado).
 * Ausente/undefined → [] (sem restrição).
 */
function parseIdArray(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  const ids: string[] = [];
  for (const v of value) {
    if (typeof v !== 'string' || !mongoose.isValidObjectId(v)) return null;
    ids.push(v);
  }
  // Dedup
  return [...new Set(ids)];
}

// ═══════════════════════════════════════════════════════════════
// GET — Listar cupons (admin) com paginação + busca
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active' | 'inactive'

    const filter: Record<string, unknown> = {};
    if (search) filter.code = { $regex: search, $options: 'i' };
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('applicableCategories', 'name slug')
        .populate('applicableBrands', 'name slug')
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      coupons,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET coupons error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar cupons';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST — Criar cupom (admin)
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 },
      );
    }

    await connectDB();
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

    // Validação
    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Código é obrigatório' },
        { status: 400 },
      );
    }
    if (type !== 'percentage' && type !== 'fixed') {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido' },
        { status: 400 },
      );
    }
    if (typeof value !== 'number' || value <= 0) {
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
    if (!validFrom || !validUntil) {
      return NextResponse.json(
        { success: false, error: 'Datas de validade são obrigatórias' },
        { status: 400 },
      );
    }
    if (new Date(validUntil) <= new Date(validFrom)) {
      return NextResponse.json(
        { success: false, error: 'A data final deve ser após a inicial' },
        { status: 400 },
      );
    }

    // Restrições de categoria/marca
    const categoryIds = parseIdArray(applicableCategories);
    if (categoryIds === null) {
      return NextResponse.json(
        { success: false, error: 'Categorias inválidas' },
        { status: 400 },
      );
    }
    const brandIds = parseIdArray(applicableBrands);
    if (brandIds === null) {
      return NextResponse.json(
        { success: false, error: 'Marcas inválidas' },
        { status: 400 },
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const exists = await Coupon.findOne({ code: normalizedCode }).lean();
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'Já existe um cupom com esse código' },
        { status: 409 },
      );
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      type,
      value,
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || 0,
      usageLimit: usageLimit || 0,
      usedCount: 0,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      isActive: isActive !== false,
      applicableCategories: categoryIds,
      applicableBrands: brandIds,
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error) {
    console.error('POST coupon error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao criar cupom';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
