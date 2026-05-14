import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Supplier from '@/lib/models/Supplier';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cnpj: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive === 'true') filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;

    const suppliers = await Supplier.find(filter).sort({ name: 1 }).lean();

    return NextResponse.json({ success: true, suppliers });
  } catch (error) {
    console.error('GET suppliers error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar fornecedores';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome do fornecedor é obrigatório' },
        { status: 400 },
      );
    }

    const supplierData = {
      name: body.name.trim(),
      slug: body.slug?.trim() || generateSlug(body.name),
      cnpj: body.cnpj?.trim() || '',
      email: body.email?.trim().toLowerCase() || '',
      phone: body.phone?.trim() || '',
      contactPerson: body.contactPerson?.trim() || '',
      notes: body.notes || '',
      isActive: body.isActive ?? true,
    };

    const supplier = await Supplier.create(supplierData);
    return NextResponse.json({ success: true, supplier }, { status: 201 });
  } catch (error) {
    console.error('POST supplier error:', error);
    const message =
      error instanceof Error && error.message.includes('E11000')
        ? 'Já existe um fornecedor com este nome'
        : error instanceof Error
          ? error.message
          : 'Erro ao criar fornecedor';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
