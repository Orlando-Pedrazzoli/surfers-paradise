import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Brand from '@/lib/models/Brand';

// GET — list all brands
export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find().sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, brands });
  } catch (error) {
    console.error('GET brands error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar marcas' },
      { status: 500 },
    );
  }
}

// POST — create brand
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const brand = await Brand.create(body);
    return NextResponse.json({ success: true, brand }, { status: 201 });
  } catch (error) {
    console.error('POST brand error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar marca' },
      { status: 500 },
    );
  }
}
