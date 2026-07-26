// 📄 src/app/api/coupons/validate/route.ts
// POST /api/coupons/validate  { code, items: [{ productId, sku, quantity, price }] }
// Endpoint público — usado pelo carrinho. Não incrementa uso (isso ocorre na
// criação do pedido).
//
// v2: validação delegada ao serviço partilhado lib/services/coupon.ts
// (mesma lógica do checkout — fonte única de verdade). Suporta cupons
// restritos por categoria/marca: o desconto é calculado APENAS sobre os
// itens elegíveis, e a resposta traz eligibleCount/totalCount para o
// front exibir "válido para X de Y itens".
//
// Retrocompatibilidade: se o body vier no formato antigo { code, subtotal }
// sem items, valida como cupom de loja inteira sobre esse subtotal — mas
// cupons COM restrição são recusados nesse formato (sem itens não há como
// determinar elegibilidade).

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import {
  resolveCouponForItems,
  type CouponCartItem,
} from '@/lib/services/coupon';

interface RawItem {
  productId?: string;
  sku?: string;
  quantity?: number;
  price?: number;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const code = (body.code || '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ valid: false, message: 'Informe um código' });
    }

    // ── Normaliza itens ─────────────────────────────────────────────
    let items: CouponCartItem[] = [];

    if (Array.isArray(body.items) && body.items.length > 0) {
      items = (body.items as RawItem[])
        .filter(
          i =>
            (i.productId || i.sku) &&
            Number(i.quantity) > 0 &&
            Number(i.price) >= 0,
        )
        .map(i => ({
          productId: i.productId,
          sku: i.sku,
          quantity: Number(i.quantity),
          unitPrice: Number(i.price),
        }));
      if (!items.length) {
        return NextResponse.json({
          valid: false,
          message: 'Itens do carrinho inválidos',
        });
      }
    } else if (Number(body.subtotal) > 0) {
      // Formato legado { code, subtotal }: trata como 1 item sintético.
      // Cupons restritos serão recusados (item sem productId/sku não é
      // elegível), o que é o comportamento seguro.
      items = [{ quantity: 1, unitPrice: Number(body.subtotal) }];
    } else {
      return NextResponse.json({
        valid: false,
        message: 'Carrinho vazio',
      });
    }

    // ── Valida e calcula via serviço partilhado ─────────────────────
    const result = await resolveCouponForItems(code, items);

    if (!result.ok) {
      return NextResponse.json({ valid: false, message: result.message });
    }

    const partial =
      result.isRestricted && result.eligibleCount < result.totalCount;

    return NextResponse.json({
      valid: true,
      code: result.coupon.code,
      type: result.coupon.type,
      value: result.coupon.value,
      minOrderValue: result.coupon.minOrderValue,
      maxDiscount: result.coupon.maxDiscount,
      discount: result.discount,
      eligibleSubtotal: result.eligibleSubtotal,
      eligibleCount: result.eligibleCount,
      totalCount: result.totalCount,
      isRestricted: result.isRestricted,
      message: partial
        ? `Cupom aplicado a ${result.eligibleCount} de ${result.totalCount} itens!`
        : 'Cupom aplicado!',
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json(
      { valid: false, message: 'Erro ao validar cupom' },
      { status: 500 },
    );
  }
}
