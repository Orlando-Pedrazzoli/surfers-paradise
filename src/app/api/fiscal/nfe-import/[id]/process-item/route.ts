import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import InboundInvoice from '@/lib/models/InboundInvoice';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';

const _deps = [Category, Brand];
void _deps;

interface ProcessItemBody {
  itemIndex: number;
  sku: string;
  price: number; // preço de venda definido pelo operador
  brandId: string;
  categoryId: string;
  subcategoryId?: string;
}

function makeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ═══════════════════════════════════════════════════════════════
// POST — Criar produto a partir de um item pendente da nota
// O item carrega o que veio do XML (descrição, NCM, CEST, GTIN, custo,
// quantidade). O operador completa o que a nota não tem: SKU, preço de
// venda, marca e categoria. Estoque inicial = quantidade da nota.
// ═══════════════════════════════════════════════════════════════
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body: ProcessItemBody = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Nota inválida.' },
        { status: 400 },
      );
    }

    const invoice = await InboundInvoice.findById(id);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Nota não encontrada.' },
        { status: 404 },
      );
    }

    const idx = body.itemIndex;
    const item = invoice.items[idx];
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item não encontrado na nota.' },
        { status: 400 },
      );
    }
    if (item.matchStatus !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Este item já foi processado.' },
        { status: 409 },
      );
    }

    // Validação do que o operador precisa preencher
    const sku = (body.sku || '').trim();
    const price = Number(body.price);
    if (!sku) {
      return NextResponse.json(
        { success: false, error: 'Informe o SKU do produto.' },
        { status: 400 },
      );
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Informe um preço de venda válido.' },
        { status: 400 },
      );
    }
    if (
      !mongoose.Types.ObjectId.isValid(body.brandId) ||
      !mongoose.Types.ObjectId.isValid(body.categoryId)
    ) {
      return NextResponse.json(
        { success: false, error: 'Selecione marca e categoria.' },
        { status: 400 },
      );
    }

    // Slug único a partir da descrição da nota
    const baseSlug = makeSlug(item.xProd) || makeSlug(sku) || 'produto';
    let slug = baseSlug;
    const slugExists = await Product.exists({ slug });
    if (slugExists) {
      slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    const subcategory =
      body.subcategoryId && mongoose.Types.ObjectId.isValid(body.subcategoryId)
        ? body.subcategoryId
        : null;

    const productPayload = {
      name: item.xProd,
      slug,
      sku,
      price,
      costPrice: item.unitCost, // custo real vindo da nota
      category: body.categoryId,
      subcategory,
      brand: body.brandId,
      stock: Math.max(0, Math.round(item.quantity)),
      gtin: item.gtin || '',
      ncm: item.ncm || '',
      cest: item.cest || '',
      supplierProductCode: item.cProd || '',
      supplier: invoice.supplier || null,
      images: [] as string[],
      isActive: true,
      isAvailableInStore: true, // já fica vendável no balcão
      isPublishedOnline: false, // incompleto não publica online
    };

    // Transação: cria o produto e marca o item como processado
    const session = await mongoose.startSession();
    let createdProduct;
    try {
      await session.withTransaction(async () => {
        const created = await Product.create([productPayload], { session });
        createdProduct = created[0];

        invoice.items[idx].matchStatus = 'created';
        invoice.items[idx].product = createdProduct._id;

        const stillPending = invoice.items.some(
          i => i.matchStatus === 'pending',
        );
        invoice.status = stillPending ? 'pending' : 'completed';

        await invoice.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(
      {
        success: true,
        product: createdProduct,
        invoiceStatus: invoice.status,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST process-item error:', error);
    const message =
      error instanceof Error && error.message.includes('E11000')
        ? error.message.includes('sku')
          ? 'Já existe um produto com este SKU.'
          : 'Já existe um produto com este slug.'
        : error instanceof Error
          ? error.message
          : 'Erro ao criar o produto';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
