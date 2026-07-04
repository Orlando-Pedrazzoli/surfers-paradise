// 📄 src/app/api/shipping/calculate/route.ts
// Cotação de frete via Melhor Envio.
// Aceita: { cep: string, items?: [{ weight, height, width, length, quantity, price }] }
// Retorna: { quotes: ShippingQuote[], cep }
// v2: pesos dos itens são normalizados por item (catálogo em GRAMAS → kg)
// antes da consolidação do pacote, via normalizeWeightKg.

import { NextResponse } from 'next/server';
import {
  calculateShipping,
  normalizeWeightKg,
} from '@/lib/services/melhorEnvio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CartItemInput {
  weight?: number; // gramas (catálogo) ou kg — normalizado automaticamente
  height?: number; // cm
  width?: number; // cm
  length?: number; // cm
  quantity?: number;
  price?: number; // R$ (para valor declarado/seguro)
}

// Pacote padrão para produtos sem dimensões cadastradas
// (caixa pequena típica de acessórios de surf)
const DEFAULT_PACKAGE = { weight: 0.5, height: 10, width: 20, length: 30 };

/**
 * Consolida os itens do carrinho num único volume:
 * peso soma (normalizado por item para kg), altura empilha,
 * largura/comprimento usam o maior.
 */
function consolidatePackage(items: CartItemInput[]) {
  let weight = 0;
  let height = 0;
  let width = 0;
  let length = 0;
  let insuranceValue = 0;

  for (const item of items) {
    const qty = Math.max(1, item.quantity ?? 1);
    const itemWeightKg = item.weight
      ? normalizeWeightKg(item.weight)
      : DEFAULT_PACKAGE.weight;
    weight += itemWeightKg * qty;
    height += (item.height ?? DEFAULT_PACKAGE.height) * qty;
    width = Math.max(width, item.width ?? DEFAULT_PACKAGE.width);
    length = Math.max(length, item.length ?? DEFAULT_PACKAGE.length);
    insuranceValue += (item.price ?? 0) * qty;
  }

  // Limites mínimos dos Correios (evita rejeição da cotação)
  return {
    weight: Math.max(weight, 0.05),
    height: Math.min(Math.max(height, 2), 100),
    width: Math.max(width, 11),
    length: Math.max(length, 16),
    insuranceValue,
  };
}

export async function POST(request: Request) {
  let body: { cep?: string; items?: CartItemInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const cep = (body.cep || '').replace(/\D/g, '');
  if (cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
  }

  const pkg =
    body.items && body.items.length > 0
      ? consolidatePackage(body.items)
      : { ...DEFAULT_PACKAGE, insuranceValue: 0 };

  try {
    const quotes = await calculateShipping({
      cepDestino: cep,
      weight: pkg.weight,
      height: pkg.height,
      width: pkg.width,
      length: pkg.length,
      insuranceValue: pkg.insuranceValue,
    });

    if (quotes.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma transportadora disponível para este CEP' },
        { status: 422 },
      );
    }

    return NextResponse.json({ quotes, cep });
  } catch (err) {
    console.error('[Shipping Calculate] erro:', err);
    return NextResponse.json(
      { error: 'Erro ao calcular o frete. Tente novamente.' },
      { status: 502 },
    );
  }
}
