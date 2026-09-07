// 📄 src/app/api/shipping/label/route.ts
// Etiquetas Melhor Envio para pedidos online pagos (exclusivo admin).
//
// GET    ?orderId=xxx[&weight=&height=&width=&length=]
//        Sem etiqueta → { hasLabel: false, suggestedPackage, quotes }
//        Com etiqueta → { hasLabel: true, shipmentId, tracking, printUrl }
//        (printUrl é sempre re-solicitada ao ME — as URLs de /print expiram)
// POST   { orderId, serviceId?, package? } → cria a etiqueta
//        (carrinho → checkout c/ saldo → generate → print)
// DELETE ?orderId=xxx → cancela a etiqueta (recupera o saldo) e limpa
//        melhorEnvioId/trackingCode do pedido para permitir nova emissão
//
// v3: populate corrigido para o schema real do Product — dimensões são
// ANINHADAS (dimensions.length/width/height) e o peso está em GRAMAS
// (normalizado por item via normalizeWeightKg).
// v4: GET (cotação p/ o admin escolher serviço + status/reimpressão) e
// DELETE (cancelamento com verificação prévia via /cancellable). O GET
// também sincroniza o trackingCode no pedido assim que os Correios o geram.
// v5: envia `products` (nome/qtd/valor unitário dos itens do pedido) para a
// declaração de conteúdo do envio não-comercial.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import {
  createShippingLabel,
  calculateShipping,
  trackShipment,
  normalizeWeightKg,
  getLabelPrintUrl,
  checkCancellable,
  cancelShipment,
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

interface OrderItemLean {
  product: PopulatedProductDims | null;
  quantity: number;
}

/** Soma peso (kg) e empilha alturas; largura/comprimento = maior item. */
function buildPackageFromItems(items: OrderItemLean[]): PackageOverride {
  let weight = 0;
  let height = 0;
  let width = 0;
  let length = 0;
  for (const item of items) {
    const p = item.product;
    const qty = item.quantity;
    const itemWeightKg = p?.weight
      ? normalizeWeightKg(p.weight)
      : DEFAULT_PACKAGE.weight;
    weight += itemWeightKg * qty;
    height += (p?.dimensions?.height || DEFAULT_PACKAGE.height) * qty;
    width = Math.max(width, p?.dimensions?.width || DEFAULT_PACKAGE.width);
    length = Math.max(length, p?.dimensions?.length || DEFAULT_PACKAGE.length);
  }
  // Mínimos dos Correios: 16x11x2 cm / 50g
  return {
    weight: Math.round(Math.max(weight, 0.05) * 1000) / 1000,
    height: Math.min(Math.max(height, 2), 100),
    width: Math.max(width, 11),
    length: Math.max(length, 16),
  };
}

/** Guard compartilhado: sessão admin + pedido online válido. */
async function loadAdminOrder(orderId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    };
  }
  await connectDB();
  const order = await Order.findById(orderId).populate(
    'items.product',
    'weight dimensions',
  );
  if (!order) {
    return {
      error: NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 },
      ),
    };
  }
  if (order.channel !== 'online') {
    return {
      error: NextResponse.json(
        { error: 'Pedido de balcão não gera etiqueta de envio' },
        { status: 422 },
      ),
    };
  }
  return { order };
}

// ─────────────────────────────────────────────
// GET — status da etiqueta OU cotação para emissão
// ─────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 });
  }

  try {
    const { order, error } = await loadAdminOrder(orderId);
    if (error) return error;

    // ── Etiqueta já existe: status + rastreio + URL fresca de impressão ──
    if (order.shipping?.melhorEnvioId) {
      const shipmentId = order.shipping.melhorEnvioId;
      const [tracking, printUrl] = await Promise.all([
        trackShipment(shipmentId),
        getLabelPrintUrl(shipmentId),
      ]);

      // Sincroniza o rastreio no pedido assim que os Correios o gerarem
      if (
        tracking?.trackingCode &&
        tracking.trackingCode !== order.shipping.trackingCode
      ) {
        order.shipping.trackingCode = tracking.trackingCode;
        await order.save();
      }

      return NextResponse.json({
        hasLabel: true,
        shipmentId,
        printUrl,
        tracking,
        trackingCode: order.shipping.trackingCode || null,
      });
    }

    // ── Sem etiqueta: monta o volume e cota para o admin escolher ──
    const addr = order.shippingAddress;
    if (!addr?.cep) {
      return NextResponse.json(
        { error: 'Pedido sem CEP de entrega' },
        { status: 422 },
      );
    }

    // Volume: query do admin (edição manual) > dimensões dos produtos
    const qs = {
      weight: parseFloat(searchParams.get('weight') || ''),
      height: parseFloat(searchParams.get('height') || ''),
      width: parseFloat(searchParams.get('width') || ''),
      length: parseFloat(searchParams.get('length') || ''),
    };
    const hasOverride = Object.values(qs).every(v => !isNaN(v) && v > 0);
    const pkg: PackageOverride = hasOverride
      ? { ...qs, weight: normalizeWeightKg(qs.weight) }
      : buildPackageFromItems(order.items as unknown as OrderItemLean[]);

    const quotes = await calculateShipping({
      cepDestino: addr.cep,
      ...pkg,
      insuranceValue: order.subtotal,
    });

    // Marca o serviço escolhido pelo cliente no checkout (pré-seleção na UI)
    const selectedAtCheckout =
      quotes.find(
        q =>
          q.name === order.shipping?.method ||
          q.company === order.shipping?.carrier,
      )?.id ?? null;

    return NextResponse.json({
      hasLabel: false,
      paid: order.payment.status === 'paid',
      suggestedPackage: pkg,
      insuranceValue: order.subtotal,
      quotes,
      selectedAtCheckout,
      checkoutMethod: order.shipping?.method || null,
    });
  } catch (err) {
    console.error('[Shipping Label][GET] erro:', err);
    const message = err instanceof Error ? err.message : 'Erro na consulta';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  // 1. Body (auth + load do pedido ficam no loadAdminOrder, passo 2)
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
    // 2. Carrega e valida o pedido (dimensions é objeto aninhado no Product)
    const { order, error } = await loadAdminOrder(body.orderId);
    if (error) return error;

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
      pkg = buildPackageFromItems(order.items as unknown as OrderItemLean[]);
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
      // Declaração de conteúdo do envio não-comercial
      products: order.items.map(
        (item: { name: string; quantity: number; price: number }) => ({
          name: item.name,
          quantity: item.quantity,
          unitary_value: item.price,
        }),
      ),
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

// ─────────────────────────────────────────────
// DELETE — cancelar etiqueta (recupera saldo) e liberar nova emissão
// ─────────────────────────────────────────────

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 });
  }

  try {
    const { order, error } = await loadAdminOrder(orderId);
    if (error) return error;

    const shipmentId = order.shipping?.melhorEnvioId;
    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Pedido não possui etiqueta para cancelar' },
        { status: 422 },
      );
    }

    const cancellable = await checkCancellable(shipmentId);
    if (!cancellable) {
      return NextResponse.json(
        {
          error:
            'Etiqueta não pode mais ser cancelada (provavelmente já postada)',
        },
        { status: 422 },
      );
    }

    const ok = await cancelShipment(
      shipmentId,
      `Cancelamento via painel — pedido ${order.orderNumber}`,
    );
    if (!ok) {
      return NextResponse.json(
        { error: 'Melhor Envio recusou o cancelamento' },
        { status: 502 },
      );
    }

    // Limpa a referência para permitir emitir uma nova etiqueta
    if (order.shipping) {
      order.shipping.melhorEnvioId = '';
      order.shipping.trackingCode = '';
    }
    await order.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Shipping Label][DELETE] erro:', err);
    const message = err instanceof Error ? err.message : 'Erro ao cancelar';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
