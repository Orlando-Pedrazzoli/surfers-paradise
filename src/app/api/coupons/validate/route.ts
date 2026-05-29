import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Coupon from '@/lib/models/Coupon';

// POST /api/coupons/validate  { code, subtotal }
// Endpoint público — usado pelo carrinho. Não incrementa uso (isso ocorre na
// criação do pedido em /api/orders).
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const code = (body.code || '').trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    if (!code) {
      return NextResponse.json({ valid: false, message: 'Informe um código' });
    }

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'Cupom inválido' });
    }
    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, message: 'Cupom inativo' });
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      return NextResponse.json({
        valid: false,
        message: 'Cupom ainda não está válido',
      });
    }
    if (now > coupon.validUntil) {
      return NextResponse.json({ valid: false, message: 'Cupom expirado' });
    }
    const usageLimit = coupon.usageLimit ?? 0;
    if (usageLimit > 0 && coupon.usedCount >= usageLimit) {
      return NextResponse.json({ valid: false, message: 'Cupom esgotado' });
    }
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return NextResponse.json({
        valid: false,
        message: `Pedido mínimo de R$ ${coupon.minOrderValue.toFixed(2)} para usar este cupom`,
      });
    }

    // Calcula desconto
    let discount =
      coupon.type === 'percentage'
        ? (subtotal * coupon.value) / 100
        : coupon.value;
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || 0,
      discount,
      message: 'Cupom aplicado!',
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json(
      { valid: false, message: 'Erro ao validar cupom' },
      { status: 500 },
    );
  }
}
