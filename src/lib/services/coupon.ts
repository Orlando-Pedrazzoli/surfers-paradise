// 📄 src/lib/services/coupon.ts
// Fonte única de verdade para validação e cálculo de cupons.
// Usado por /api/coupons/validate (carrinho) e services/checkout.ts (pedido).
//
// Suporta restrição por categoria e marca (applicableCategories /
// applicableBrands no model Coupon):
// - Arrays vazios ou ausentes → cupom vale para a loja inteira (retrocompatível).
// - Categoria: produto é elegível se product.category OU product.subcategory
//   estiver na lista (selecionar a categoria-raiz cobre as subcategorias,
//   já que o Product guarda a raiz em `category`).
// - Marca: product.brand precisa estar na lista.
// - Se categoria E marca forem definidas, o produto precisa satisfazer AMBAS.
// - O desconto incide APENAS sobre o subtotal dos itens elegíveis.
// - minOrderValue incide sobre o subtotal ELEGÍVEL (não o carrinho todo).

import Coupon from '@/lib/models/Coupon';
import Product from '@/lib/models/Product';

const round2 = (v: number) => Math.round(v * 100) / 100;

export interface CouponCartItem {
  productId?: string;
  sku?: string;
  quantity: number;
  unitPrice: number; // preço unitário em reais (preço-verdade do banco no checkout)
}

export interface CouponResolution {
  ok: true;
  discount: number;
  eligibleSubtotal: number;
  eligibleCount: number; // nº de itens (linhas) elegíveis
  totalCount: number; // nº total de itens (linhas) no carrinho
  isRestricted: boolean; // cupom tem restrição de categoria/marca?
  coupon: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderValue: number;
    maxDiscount: number;
  };
}

export interface CouponRejection {
  ok: false;
  message: string;
}

export type CouponResult = CouponResolution | CouponRejection;

/**
 * Valida o cupom e calcula o desconto server-side sobre os itens elegíveis.
 * NÃO incrementa usedCount — isso é responsabilidade do fluxo de pedido.
 */
export async function resolveCouponForItems(
  rawCode: string,
  items: CouponCartItem[],
): Promise<CouponResult> {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false, message: 'Informe um código' };

  const coupon = await Coupon.findOne({ code }).lean();
  if (!coupon) return { ok: false, message: 'Cupom inválido' };
  if (!coupon.isActive) return { ok: false, message: 'Cupom inativo' };

  const now = new Date();
  if (now < coupon.validFrom) {
    return { ok: false, message: 'Cupom ainda não está válido' };
  }
  if (now > coupon.validUntil) {
    return { ok: false, message: 'Cupom expirado' };
  }

  const usageLimit = coupon.usageLimit ?? 0;
  if (usageLimit > 0 && coupon.usedCount >= usageLimit) {
    return { ok: false, message: 'Cupom esgotado' };
  }

  if (!items.length) {
    return { ok: false, message: 'Carrinho vazio' };
  }

  const categoryIds = (coupon.applicableCategories ?? []).map(String);
  const brandIds = (coupon.applicableBrands ?? []).map(String);
  const hasCategoryRule = categoryIds.length > 0;
  const hasBrandRule = brandIds.length > 0;
  const isRestricted = hasCategoryRule || hasBrandRule;

  // ── Determina elegibilidade por item ─────────────────────────────
  let eligibleFlags: boolean[];

  if (!isRestricted) {
    // Sem restrição: todos os itens são elegíveis (comportamento antigo)
    eligibleFlags = items.map(() => true);
  } else {
    // Lookup da categorização dos produtos do carrinho (por _id ou SKU)
    const ids = items.map(i => i.productId).filter(Boolean) as string[];
    const skus = items.filter(i => !i.productId && i.sku).map(i => i.sku!);

    const or: Record<string, unknown>[] = [];
    if (ids.length) or.push({ _id: { $in: ids } });
    if (skus.length) or.push({ sku: { $in: skus } });
    if (!or.length) {
      return { ok: false, message: 'Itens do carrinho sem identificação' };
    }

    let products: {
      _id: unknown;
      sku?: string;
      category?: unknown;
      subcategory?: unknown;
      brand?: unknown;
    }[];
    try {
      products = await Product.find({ $or: or })
        .select('_id sku category subcategory brand')
        .lean();
    } catch {
      return { ok: false, message: 'Produto inválido no carrinho' };
    }

    const byId = new Map(products.map(p => [String(p._id), p]));
    const bySku = new Map(products.map(p => [p.sku ?? '', p]));

    const catSet = new Set(categoryIds);
    const brandSet = new Set(brandIds);

    eligibleFlags = items.map(item => {
      const product =
        (item.productId && byId.get(item.productId)) ||
        (item.sku && bySku.get(item.sku)) ||
        null;
      if (!product) return false; // produto não encontrado → não elegível

      const categoryOk =
        !hasCategoryRule ||
        (product.category != null && catSet.has(String(product.category))) ||
        (product.subcategory != null &&
          catSet.has(String(product.subcategory)));

      const brandOk =
        !hasBrandRule ||
        (product.brand != null && brandSet.has(String(product.brand)));

      return categoryOk && brandOk;
    });
  }

  const eligibleItems = items.filter((_, idx) => eligibleFlags[idx]);
  const eligibleSubtotal = round2(
    eligibleItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  );

  if (eligibleItems.length === 0 || eligibleSubtotal <= 0) {
    return {
      ok: false,
      message: 'Este cupom não é válido para os produtos do seu carrinho',
    };
  }

  // minOrderValue incide sobre o subtotal ELEGÍVEL
  if (coupon.minOrderValue && eligibleSubtotal < coupon.minOrderValue) {
    return {
      ok: false,
      message: `Mínimo de R$ ${coupon.minOrderValue.toFixed(2)} em produtos elegíveis para usar este cupom`,
    };
  }

  // ── Cálculo do desconto sobre o subtotal elegível ────────────────
  let discount =
    coupon.type === 'percentage'
      ? (eligibleSubtotal * coupon.value) / 100
      : coupon.value;
  if (coupon.maxDiscount && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, eligibleSubtotal);
  discount = round2(discount);

  return {
    ok: true,
    discount,
    eligibleSubtotal,
    eligibleCount: eligibleItems.length,
    totalCount: items.length,
    isRestricted,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue ?? 0,
      maxDiscount: coupon.maxDiscount ?? 0,
    },
  };
}
