// 📄 src/app/api/shipping/label/route.ts
// Gera etiqueta de envio no Melhor Envio para um pedido pago (admin).
// Body: { orderId: string, serviceId?: number, package?: { weight, height, width, length } }
// Retorna: { labelUrl, shipmentId, protocol }
// v3: populate corrigido para o schema real do Product — dimensões são
// ANINHADAS (dimensions.length/width/height) e o peso está em GRAMAS
// (normalizado por item via normalizeWeightKg).

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import {
  createShippingLabel,
  calculateShipping,
  trackShipment,
  normalizeWeightKg,
} from '@/lib/services/melhorEnvio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PACKAGE = { weight: 0.5, height: 10, width: 20, length: 30 };

interface PackageOverride {
  weight: number;
  height: number;
  width: number;
  length: number;
}

interface PopulatedProductDims {
  weight?: number; // gramas (catálogo)
  dimensions?: { length?: number; width?: number; height?: number }; // cm
}

export async function POST(request: Request) {
  // 1. Auth — apenas admin
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let body: {
    orderId?: string;
    serviceId?: number;
    package?: PackageOverride;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.orderId) {
    return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 });
  }

  try {
    await connectDB();

    // 2. Carrega e valida o pedido (dimensions é objeto aninhado no Product)
    const order = await Order.findById(body.orderId).populate(
      'items.product',
      'weight dimensions',
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 },
      );
    }
    if (order.channel !== 'online') {
      return NextResponse.json(
        { error: 'Pedido de balcão não gera etiqueta de envio' },
        { status: 422 },
      );
    }
    if (order.payment.status !== 'paid') {
      return NextResponse.json(
        { error: 'Pedido ainda não foi pago' },
        { status: 422 },
      );
    }
    if (order.shipping?.melhorEnvioId) {
      return NextResponse.json(
        {
          error: 'Etiqueta já gerada para este pedido',
          shipmentId: order.shipping.melhorEnvioId,
        },
        { status: 409 },
      );
    }

    const addr = order.shippingAddress;
    if (!addr?.cep || !addr?.street || !addr?.city || !addr?.state) {
      return NextResponse.json(
        { error: 'Pedido sem endereço de entrega completo' },
        { status: 422 },
      );
    }

    // 3. E-mail e CPF do destinatário (ordem de fallback)
    const email = order.customerSnapshot?.email || order.guestEmail || '';
    const document = addr.cpf || order.customerSnapshot?.cpf || '';
    if (!document) {
      return NextResponse.json(
        { error: 'CPF do destinatário ausente no pedido' },
        { status: 422 },
      );
    }

    // 4. Monta o volume: override do admin > dimensões dos produtos > padrão
    let pkg: PackageOverride;
    if (body.package) {
      pkg = {
        ...body.package,
        weight: normalizeWeightKg(body.package.weight),
      };
    } else {
      let weight = 0;
      let height = 0;
      let width = 0;
      let length = 0;
      for (const item of order.items) {
        const p = item.product as unknown as PopulatedProductDims | null;
        const qty = item.quantity;
        const itemWeightKg = p?.weight
          ? normalizeWeightKg(p.weight)
          : DEFAULT_PACKAGE.weight;
        weight += itemWeightKg * qty;
        height += (p?.dimensions?.height || DEFAULT_PACKAGE.height) * qty;
        width = Math.max(width, p?.dimensions?.width || DEFAULT_PACKAGE.width);
        length = Math.max(
          length,
          p?.dimensions?.length || DEFAULT_PACKAGE.length,
        );
      }
      pkg = {
        weight: Math.max(weight, 0.05),
        height: Math.min(Math.max(height, 2), 100),
        width: Math.max(width, 11),
        length: Math.max(length, 16),
      };
    }

    // 5. Resolve o serviceId: usa o do body, ou re-cota e casa com a
    //    transportadora escolhida no checkout (fallback: mais barato)
    let serviceId = body.serviceId;
    if (!serviceId) {
      const quotes = await calculateShipping({
        cepDestino: addr.cep,
        ...pkg,
        insuranceValue: order.subtotal,
      });
      if (quotes.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma transportadora disponível para o CEP do pedido' },
          { status: 422 },
        );
      }
      const match = quotes.find(
        q =>
          q.name === order.shipping?.method ||
          q.company === order.shipping?.carrier,
      );
      serviceId = (match || quotes[0]).id;
    }

    // 6. Cria a etiqueta (carrinho → checkout → generate → print)
    const label = await createShippingLabel({
      serviceId,
      recipient: {
        name: addr.name || order.customerSnapshot?.name || 'Cliente',
        phone: addr.phone || order.customerSnapshot?.phone || '',
        email,
        document,
        address: addr.street,
        number: addr.number || 'S/N',
        complement: addr.complement,
        district: addr.neighborhood || '',
        city: addr.city,
        state_abbr: addr.state,
        postal_code: addr.cep,
      },
      packageData: pkg,
      insuranceValue: order.subtotal,
      orderNumber: order.orderNumber,
    });

    // 7. Atualiza o pedido
    // Variável local com fallback (??) porque o tipo IOrder marca shipping
    // como opcional — o Mongoose sempre cria o subdocumento pelos defaults.
    const shipping = order.shipping ?? {
      method: '',
      carrier: '',
      estimatedDays: 0,
      trackingCode: '',
      melhorEnvioId: '',
    };
    shipping.melhorEnvioId = label.shipmentId;
    if (order.status === 'confirmed') order.status = 'processing';

    // Tenta capturar o código de rastreio (pode ainda não existir —
    // os Correios só geram após a postagem)
    const tracking = await trackShipment(label.shipmentId);
    if (tracking?.trackingCode) {
      shipping.trackingCode = tracking.trackingCode;
    }

    order.shipping = shipping;
    await order.save();

    return NextResponse.json({
      labelUrl: label.labelUrl,
      shipmentId: label.shipmentId,
      protocol: label.protocol,
    });
  } catch (err) {
    console.error('[Shipping Label] erro:', err);
    const message =
      err instanceof Error ? err.message : 'Erro ao gerar etiqueta';
    // Erros do Melhor Envio (saldo insuficiente etc.) chegam detalhados aqui
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
