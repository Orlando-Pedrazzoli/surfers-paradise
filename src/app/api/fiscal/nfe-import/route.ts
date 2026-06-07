import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import InboundInvoice from '@/lib/models/InboundInvoice';
import Product from '@/lib/models/Product';
import Supplier from '@/lib/models/Supplier';
import { parseNfeXml } from '@/lib/services/nfeParser';
import { company } from '@/lib/config/company';
import type { IInboundInvoiceItem } from '@/lib/types';

const _deps = [Product, Supplier];
void _deps;

const STORE_CNPJ = company.cnpj.replace(/\D/g, '');

// ═══════════════════════════════════════════════════════════════
// GET — Listar notas de entrada (mais recentes primeiro)
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      InboundInvoice.find()
        .select('-rawXml') // não trafegar o XML cru na listagem
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InboundInvoice.countDocuments(),
    ]);

    return NextResponse.json({
      success: true,
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET nfe-import error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao listar notas';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST — Importar XML da NF-e
// Body JSON: { xml: string }
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const xml: string = body?.xml || '';

    if (!xml.trim()) {
      return NextResponse.json(
        { success: false, error: 'XML não enviado.' },
        { status: 400 },
      );
    }

    // 1) Parse
    let parsed;
    try {
      parsed = parseNfeXml(xml);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: e instanceof Error ? e.message : 'XML inválido.',
        },
        { status: 400 },
      );
    }

    // 2) Validações fiscais básicas
    if (parsed.modelo && parsed.modelo !== '55') {
      return NextResponse.json(
        {
          success: false,
          error: `Documento modelo ${parsed.modelo} não é uma NF-e de entrada (esperado modelo 55).`,
        },
        { status: 400 },
      );
    }
    if (parsed.dest.cnpj && parsed.dest.cnpj !== STORE_CNPJ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Esta nota não está destinada ao CNPJ da loja. Confirme se o XML é o correto.',
        },
        { status: 400 },
      );
    }

    // 3) Idempotência — mesma chave não importa duas vezes (não duplica estoque)
    const existing = await InboundInvoice.findOne({
      chave: parsed.chave,
    }).lean();
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyImported: true,
        invoice: existing,
      });
    }

    // 4) Fornecedor (best-effort pelo CNPJ do emitente)
    const supplier = await Supplier.findOne({ cnpj: parsed.emit.cnpj })
      .select('_id')
      .lean();
    const supplierId = supplier?._id ?? null;

    // 5) Match por GTIN e montagem dos itens
    const items: IInboundInvoiceItem[] = [];
    const stockUpdates: Array<{
      productId: mongoose.Types.ObjectId;
      quantity: number;
      unitCost: number;
    }> = [];

    for (const it of parsed.items) {
      let matchStatus: IInboundInvoiceItem['matchStatus'] = 'pending';
      let productId: mongoose.Types.ObjectId | null = null;

      if (it.gtin) {
        const match = await Product.findOne({ gtin: it.gtin })
          .select('_id')
          .lean();
        if (match) {
          matchStatus = 'matched';
          productId = match._id as mongoose.Types.ObjectId;
          stockUpdates.push({
            productId: match._id as mongoose.Types.ObjectId,
            quantity: Math.max(0, Math.round(it.quantity)),
            unitCost: it.unitCost,
          });
        }
      }

      items.push({
        cProd: it.cProd,
        gtin: it.gtin,
        xProd: it.xProd,
        ncm: it.ncm,
        cest: it.cest,
        cfop: it.cfop,
        unit: it.unit,
        quantity: it.quantity,
        unitCost: it.unitCost,
        totalCost: it.totalCost,
        matchStatus,
        product: productId,
      });
    }

    const hasPending = items.some(i => i.matchStatus === 'pending');
    const status = hasPending ? 'pending' : 'completed';

    const issuedAt = parsed.issuedAt ? new Date(parsed.issuedAt) : undefined;

    // 6) Transação: atualiza estoque dos itens casados + cria a nota
    const session = await mongoose.startSession();
    let invoice;
    try {
      await session.withTransaction(async () => {
        for (const upd of stockUpdates) {
          await Product.findByIdAndUpdate(
            upd.productId,
            {
              $inc: { stock: upd.quantity },
              $set: { costPrice: upd.unitCost },
            },
            { session },
          );
        }

        const created = await InboundInvoice.create(
          [
            {
              chave: parsed.chave,
              modelo: parsed.modelo,
              number: parsed.number,
              series: parsed.series,
              issuedAt,
              issuer: parsed.emit,
              dest: parsed.dest,
              supplier: supplierId,
              totalValue: parsed.totalValue,
              status,
              items,
              rawXml: xml,
            },
          ],
          { session },
        );
        invoice = created[0];
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error) {
    console.error('POST nfe-import error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao importar a nota';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
