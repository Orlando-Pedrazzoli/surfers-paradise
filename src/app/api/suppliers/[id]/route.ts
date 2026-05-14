import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Supplier from '@/lib/models/Supplier';
import Product from '@/lib/models/Product';

const _deps = [Product];
void _deps;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const supplier = await Supplier.findById(id).lean();
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor não encontrado' },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error('GET supplier error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar fornecedor';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.slug !== undefined) updateData.slug = body.slug.trim();
    if (body.cnpj !== undefined) updateData.cnpj = body.cnpj.trim();
    if (body.email !== undefined)
      updateData.email = body.email.trim().toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.contactPerson !== undefined)
      updateData.contactPerson = body.contactPerson.trim();
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const supplier = await Supplier.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error('PUT supplier error:', error);
    const message =
      error instanceof Error && error.message.includes('E11000')
        ? 'Já existe um fornecedor com este nome'
        : error instanceof Error
          ? error.message
          : 'Erro ao atualizar fornecedor';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    // Verifica se há produtos vinculados antes de apagar
    const productsCount = await Product.countDocuments({ supplier: id });
    if (productsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Existem ${productsCount} produto(s) vinculado(s) a este fornecedor. Remova ou reatribua antes de excluir.`,
        },
        { status: 400 },
      );
    }

    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor não encontrado' },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, message: 'Fornecedor removido' });
  } catch (error) {
    console.error('DELETE supplier error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao remover fornecedor';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
