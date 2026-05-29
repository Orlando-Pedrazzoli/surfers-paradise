import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Coupon from '@/lib/models/Coupon';
import { auth } from '@/lib/auth/config';

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === 'admin';
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
    const coupon = await Coupon.findById(id).lean();
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
