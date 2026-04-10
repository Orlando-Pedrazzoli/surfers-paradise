import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Banner from '@/lib/models/Banner';

// GET — list banners (optional filter by position)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const activeOnly = searchParams.get('active');

    const filter: Record<string, unknown> = {};
    if (position) filter.position = position;
    if (activeOnly === 'true') {
      filter.isActive = true;
      const now = new Date();
      filter.$or = [
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
      ];
    }

    const banners = await Banner.find(filter)
      .sort({ position: 1, order: 1 })
      .lean();

    return NextResponse.json({ success: true, banners });
  } catch (error) {
    console.error('GET banners error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar banners' },
      { status: 500 },
    );
  }
}

// POST — create banner
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const banner = await Banner.create(body);
    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    console.error('POST banner error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar banner' },
      { status: 500 },
    );
  }
}
