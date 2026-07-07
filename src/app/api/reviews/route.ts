// 📄 src/app/api/reviews/route.ts
// Avaliações de produtos e da loja (substitui o stub).
//
// GET (público) — só APROVADAS:
//   ?productId=X          → avaliações do produto (+ summary + eligibility
//                           do usuário logado, se houver sessão)
//   ?scope=home           → melhores avaliações p/ o carousel da home
//                           (loja + produtos, ordenado por rating/recência)
// GET (admin) — ?status=pending|approved|all → moderação (exige admin)
//
// POST (autenticado) — cria avaliação PENDENTE de moderação:
//   Regra: só quem tem pedido DELIVERED contendo o produto; uma por
//   produto por cliente. isVerifiedPurchase setado pelo SERVIDOR.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Review from '@/lib/models/Review';
import User from '@/lib/models/User';
import { requireAuthGuard, requireAdminGuard } from '@/lib/auth/guards';
import { auth } from '@/lib/auth/config';
import { checkReviewEligibility } from '@/lib/services/reviews';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const scope = searchParams.get('scope');
    const status = searchParams.get('status');

    // ─── Moderação (admin) ───
    if (status) {
      const guard = await requireAdminGuard();
      if (guard.response) return guard.response;

      const filter: Record<string, unknown> = {};
      if (status === 'pending') filter.isApproved = false;
      if (status === 'approved') filter.isApproved = true;

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const [reviews, total] = await Promise.all([
        Review.find(filter)
          .populate('product', 'name slug thumbnail images')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Review.countDocuments(filter),
      ]);

      return NextResponse.json({
        success: true,
        reviews,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    // ─── Carousel da home ───
    if (scope === 'home') {
      const reviews = await Review.find({
        isApproved: true,
        rating: { $gte: 4 },
      })
        .sort({ isStoreReview: -1, rating: -1, createdAt: -1 })
        .limit(12)
        .select('name city state rating comment createdAt isStoreReview')
        .lean();
      return NextResponse.json({ success: true, reviews });
    }

    // ─── Avaliações de um produto (público) ───
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return NextResponse.json(
        { success: false, error: 'productId inválido.' },
        { status: 400 },
      );
    }

    const reviews = await Review.find({
      product: productId,
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .select(
        'name city state rating title comment isVerifiedPurchase createdAt',
      )
      .lean();

    const count = reviews.length;
    const average =
      count > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) /
          10
        : 0;

    // Elegibilidade do usuário logado (se houver sessão) — evita segundo
    // round-trip no ProductReviews.
    let eligibility: Record<string, unknown> | null = null;
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      eligibility = await checkReviewEligibility(userId, productId);
    }

    return NextResponse.json({
      success: true,
      reviews,
      summary: { average, count },
      eligibility,
    });
  } catch (error) {
    console.error('GET /api/reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar avaliações' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuthGuard();
    if (guard.response) return guard.response;

    await connectDB();
    const body = await request.json();
    const productId = String(body.productId || '');
    const rating = Number(body.rating);
    const comment = String(body.comment || '').trim();
    const title = String(body.title || '').trim();

    if (!mongoose.isValidObjectId(productId)) {
      return NextResponse.json(
        { success: false, error: 'Produto inválido.' },
        { status: 400 },
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Nota deve ser de 1 a 5.' },
        { status: 400 },
      );
    }
    if (comment.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conte um pouco mais — mínimo de 10 caracteres.',
        },
        { status: 400 },
      );
    }
    if (comment.length > 2000 || title.length > 120) {
      return NextResponse.json(
        { success: false, error: 'Texto muito longo.' },
        { status: 400 },
      );
    }

    // Regra central: só quem comprou E recebeu — uma vez por produto
    const eligibility = await checkReviewEligibility(guard.userId, productId);
    if (!eligibility.canReview) {
      const messages: Record<string, string> = {
        already_reviewed: 'Você já avaliou este produto.',
        not_delivered: 'Você poderá avaliar assim que o pedido for entregue.',
        not_purchased:
          'Apenas clientes que compraram este produto podem avaliá-lo.',
      };
      return NextResponse.json(
        { success: false, error: messages[eligibility.reason] },
        { status: 403 },
      );
    }

    const user = await User.findById(guard.userId).select('name email').lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado.' },
        { status: 404 },
      );
    }

    const review = await Review.create({
      product: productId,
      user: guard.userId,
      name: user.name,
      email: user.email,
      city: String(body.city || ''),
      state: String(body.state || ''),
      rating,
      title,
      comment,
      isApproved: false, // pendente de moderação
      isStoreReview: false,
      isVerifiedPurchase: true, // provado pela regra acima — nunca do client
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Avaliação enviada! Ela será publicada após a moderação. Obrigado! 🤙',
        reviewId: review._id.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    // Corrida no índice único (duplo clique) → mesma mensagem de duplicada
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Você já avaliou este produto.' },
        { status: 403 },
      );
    }
    console.error('POST /api/reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar avaliação' },
      { status: 500 },
    );
  }
}
