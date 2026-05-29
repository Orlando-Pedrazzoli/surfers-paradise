import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import Coupon from '@/lib/models/Coupon';
import { OrderChannel, PaymentMethod } from '@/lib/types/order';

const _deps = [Product, User, Coupon];
void _deps;

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderBody {
  channel?: OrderChannel;
  items: OrderItemInput[];
  customerSnapshot?: {
    name?: string;
    cpf?: string;
    phone?: string;
    email?: string;
  };
  userId?: string;
  payment: {
    method: PaymentMethod;
    installments?: number;
    cashReceived?: number;
  };
  discount?: number;
  coupon?: string;
  shippingCost?: number;
  shippingAddress?: Record<string, string>;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════
// GET — Listar pedidos com filtros
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search') || '';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filter: Record<string, unknown> = {};

    if (channel) filter.channel = channel;
    if (status) filter.status = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.cpf': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.email': { $regex: search, $options: 'i' } },
      ];
    }

    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) dateFilter.$lte = new Date(toDate);
      filter.createdAt = dateFilter;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET orders error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar pedidos';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST — Criar pedido (com decremento atômico de estoque + cupom)
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body: CreateOrderBody = await request.json();

    // Validação básica
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido sem produtos' },
        { status: 400 },
      );
    }

    if (!body.payment?.method) {
      return NextResponse.json(
        { success: false, error: 'Método de pagamento obrigatório' },
        { status: 400 },
      );
    }

    const channel: OrderChannel = body.channel || 'online';

    // Validação especifica do canal online
    if (channel === 'online' && !body.shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Endereço obrigatório para vendas online' },
        { status: 400 },
      );
    }

    // Buscar produtos e validar estoque
    const productIds = body.items.map(i => i.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'Um ou mais produtos não encontrados' },
        { status: 400 },
      );
    }

    // Validar estoque disponível
    const orderItems: Array<{
      product: mongoose.Types.ObjectId;
      sku: string;
      name: string;
      slug: string;
      image: string;
      quantity: number;
      price: number;
      costPrice: number;
    }> = [];
    let subtotal = 0;

    for (const item of body.items) {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) continue;

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}, solicitado: ${item.quantity}`,
          },
          { status: 400 },
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        image: product.thumbnail || product.images?.[0] || '',
        quantity: item.quantity,
        price: product.price,
        costPrice: product.costPrice || 0,
      });
    }

    // ─── Cupom: revalidação no servidor (NÃO confia no discount do client) ───
    let discount = 0;
    let couponCode = '';
    let couponDoc: Awaited<ReturnType<typeof Coupon.findOne>> = null;

    if (body.coupon && body.coupon.trim()) {
      couponDoc = await Coupon.findOne({
        code: body.coupon.trim().toUpperCase(),
      });

      if (!couponDoc) {
        return NextResponse.json(
          { success: false, error: 'Cupom inválido' },
          { status: 400 },
        );
      }

      const now = new Date();
      const usable =
        couponDoc.isActive &&
        now >= couponDoc.validFrom &&
        now <= couponDoc.validUntil &&
        !(
          (couponDoc.usageLimit ?? 0) > 0 &&
          couponDoc.usedCount >= (couponDoc.usageLimit ?? 0)
        ) &&
        !(couponDoc.minOrderValue && subtotal < couponDoc.minOrderValue);

      if (!usable) {
        return NextResponse.json(
          { success: false, error: 'Cupom não aplicável a este pedido' },
          { status: 400 },
        );
      }

      discount =
        couponDoc.type === 'percentage'
          ? (subtotal * couponDoc.value) / 100
          : couponDoc.value;
      if (couponDoc.maxDiscount && couponDoc.maxDiscount > 0) {
        discount = Math.min(discount, couponDoc.maxDiscount);
      }
      discount = Math.min(discount, subtotal);
      discount = Math.round(discount * 100) / 100;
      couponCode = couponDoc.code;
    }

    const shippingCost = body.shippingCost || 0;
    const total = subtotal - discount + shippingCost;

    // Validar troco (POS dinheiro)
    let cashChange = 0;
    if (channel === 'pos' && body.payment.method === 'cash') {
      const cashReceived = body.payment.cashReceived || 0;
      if (cashReceived < total) {
        return NextResponse.json(
          {
            success: false,
            error: `Valor recebido (R$ ${cashReceived.toFixed(2)}) é menor que o total (R$ ${total.toFixed(2)})`,
          },
          { status: 400 },
        );
      }
      cashChange = cashReceived - total;
    }

    // Pagamento — POS: pago imediatamente. Online: pendente
    const isPaidImmediately = channel === 'pos';
    const paymentStatus = isPaidImmediately ? 'paid' : 'pending';
    const orderStatus = isPaidImmediately ? 'delivered' : 'pending';

    // Gerar orderNumber (não depender do pre('save') em transação)
    const now = new Date();
    const prefix = channel === 'pos' ? 'POS' : 'WEB';
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000 + 1000);
    const orderNumber = `${prefix}${year}${month}${day}-${random}`;

    // Transação MongoDB para atomicidade (estoque + cupom + pedido)
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        // Decrementar estoque de cada produto
        for (const item of body.items) {
          const updated = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              stock: { $gte: item.quantity },
            },
            { $inc: { stock: -item.quantity, soldCount: item.quantity } },
            { session, new: true },
          );

          if (!updated) {
            throw new Error(
              `Estoque insuficiente para o produto ${item.productId}`,
            );
          }
        }

        // Incrementar uso do cupom (atômico — respeita usageLimit)
        if (couponDoc) {
          const usageLimit = couponDoc.usageLimit ?? 0;
          if (usageLimit > 0) {
            const incremented = await Coupon.findOneAndUpdate(
              {
                _id: couponDoc._id,
                usedCount: { $lt: usageLimit },
              },
              { $inc: { usedCount: 1 } },
              { session, new: true },
            );
            if (!incremented) {
              throw new Error('Cupom esgotado');
            }
          } else {
            await Coupon.updateOne(
              { _id: couponDoc._id },
              { $inc: { usedCount: 1 } },
              { session },
            );
          }
        }

        // Criar pedido
        const created = await Order.create(
          [
            {
              orderNumber,
              channel,
              user: body.userId || null,
              customerSnapshot: {
                name: body.customerSnapshot?.name || 'Consumidor',
                cpf: body.customerSnapshot?.cpf || '',
                phone: body.customerSnapshot?.phone || '',
                email: body.customerSnapshot?.email || '',
              },
              items: orderItems,
              subtotal,
              discount,
              coupon: couponCode,
              shippingCost,
              total,
              shippingAddress: body.shippingAddress || undefined,
              payment: {
                method: body.payment.method,
                status: paymentStatus,
                installments: body.payment.installments || 1,
                cashReceived: body.payment.cashReceived || 0,
                cashChange,
                paidAt: isPaidImmediately ? new Date() : undefined,
              },
              status: orderStatus,
              notes: body.notes || '',
            },
          ],
          { session },
        );

        order = created[0];
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('POST order error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao criar pedido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
