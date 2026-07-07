// 📄 src/app/api/reviews/[id]/route.ts
// Moderação de avaliações (substitui o stub) — ADMIN ONLY.
// PATCH { isApproved: boolean } → aprova/reprova e recalcula o rating do
// produto (averageRating/reviewCount refletem só as aprovadas).
// DELETE → remove e recalcula.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Review from '@/lib/models/Review';
import { requireAdminGuard } from '@/lib/auth/guards';
import { recalcProductRating } from '@/lib/services/reviews';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdminGuard();
    if (guard.response) return guard.response;

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido.' },
        { status: 400 },
      );
    }

    await connectDB();
    const body = await request.json();

    if (typeof body.isApproved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isApproved (boolean) é obrigatório.' },
        { status: 400 },
      );
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: { isApproved: body.isApproved } },
      { new: true },
    );

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Avaliação não encontrada.' },
        { status: 404 },
      );
    }

    // Rating do produto reflete só aprovadas (loja não afeta produto)
    if (!review.isStoreReview && review.product) {
      await recalcProductRating(review.product);
    }

    return NextResponse.json({ success: true, review: review.toObject() });
  } catch (error) {
    console.error('PATCH /api/reviews/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao moderar avaliação' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdminGuard();
    if (guard.response) return guard.response;

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido.' },
        { status: 400 },
      );
    }

    await connectDB();
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Avaliação não encontrada.' },
        { status: 404 },
      );
    }

    if (!review.isStoreReview && review.product) {
      await recalcProductRating(review.product);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/reviews/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover avaliação' },
      { status: 500 },
    );
  }
}
