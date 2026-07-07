// 📄 src/components/product/ProductReviews.tsx
// Avaliações na página do produto (substitui o stub).
// - Lista as aprovadas + resumo (média/contagem)
// - Formulário gated pela elegibilidade calculada no SERVIDOR:
//   logado + pedido delivered com o produto + ainda não avaliou
// - Selo "Compra verificada"
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Star, BadgeCheck, Loader2 } from 'lucide-react';

interface ReviewItem {
  _id: string;
  name: string;
  city?: string;
  state?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

interface Eligibility {
  canReview: boolean;
  reason?: 'not_purchased' | 'not_delivered' | 'already_reviewed';
}

interface ProductReviewsProps {
  productId: string;
}

function Stars({
  rating,
  size = 14,
  onSelect,
}: {
  rating: number;
  size?: number;
  onSelect?: (n: number) => void;
}) {
  return (
    <div className='flex gap-0.5'>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          onClick={onSelect ? () => onSelect(i + 1) : undefined}
          className={`${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          } ${onSelect ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        />
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState({ average: 0, count: 0 });
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setSummary(data.summary || { average: 0, count: 0 });
        setEligibility(data.eligibility);
      }
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (rating < 1) {
      toast.error('Escolha uma nota de 1 a 5 estrelas.');
      return;
    }
    if (comment.trim().length < 10) {
      toast.error('Conte um pouco mais — mínimo de 10 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title, comment }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Avaliação enviada!');
        setSubmitted(true);
      } else {
        toast.error(data.error || 'Erro ao enviar avaliação.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin text-gray-300' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Resumo */}
      <div className='flex items-center gap-4'>
        <h3 className='text-lg font-semibold text-gray-900'>Avaliações</h3>
        {summary.count > 0 && (
          <div className='flex items-center gap-2'>
            <Stars rating={Math.round(summary.average)} />
            <span className='text-sm font-semibold text-gray-900'>
              {summary.average.toFixed(1)}
            </span>
            <span className='text-sm text-gray-500'>
              ({summary.count}{' '}
              {summary.count === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
        )}
      </div>

      {/* Formulário / estados de elegibilidade */}
      {submitted ? (
        <div className='rounded-lg bg-green-50 p-4 text-sm text-green-700'>
          Avaliação enviada! Ela aparecerá aqui após a moderação. Obrigado! 🤙
        </div>
      ) : !session?.user ? (
        <div className='rounded-lg bg-gray-50 p-4 text-sm text-gray-600'>
          <Link
            href='/login'
            className='font-medium text-[#FF6600] hover:underline'
          >
            Entre na sua conta
          </Link>{' '}
          para avaliar produtos que você comprou.
        </div>
      ) : eligibility?.canReview ? (
        <form
          onSubmit={handleSubmit}
          className='rounded-lg border border-gray-200 p-4 space-y-3'
        >
          <p className='text-sm font-semibold text-gray-900'>
            Avalie este produto
          </p>
          <div className='flex items-center gap-2'>
            <Stars rating={rating} size={24} onSelect={setRating} />
            {rating > 0 && (
              <span className='text-sm text-gray-500'>{rating}/5</span>
            )}
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            placeholder='Título (opcional)'
            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#FF6600]'
          />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder='Como foi sua experiência com o produto?'
            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#FF6600]'
          />
          <button
            type='submit'
            disabled={submitting}
            className='rounded-lg bg-[#FF6600] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e55b00] disabled:opacity-50 inline-flex items-center gap-2'
          >
            {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </form>
      ) : eligibility?.reason === 'already_reviewed' ? (
        <p className='text-sm text-gray-500'>
          ✓ Você já avaliou este produto. Obrigado!
        </p>
      ) : eligibility?.reason === 'not_delivered' ? (
        <p className='text-sm text-gray-500'>
          Você poderá avaliar assim que o seu pedido for entregue. 📦
        </p>
      ) : null}

      {/* Lista */}
      {reviews.length === 0 ? (
        <p className='text-sm text-gray-500'>
          Nenhuma avaliação ainda. Seja o primeiro a avaliar!
        </p>
      ) : (
        <div className='divide-y divide-gray-100'>
          {reviews.map(r => (
            <div key={r._id} className='py-4 space-y-1.5'>
              <div className='flex items-center gap-2 flex-wrap'>
                <Stars rating={r.rating} />
                {r.title && (
                  <span className='text-sm font-semibold text-gray-900'>
                    {r.title}
                  </span>
                )}
              </div>
              <p className='text-sm text-gray-600 leading-relaxed'>
                {r.comment}
              </p>
              <div className='flex items-center gap-2 text-xs text-gray-400'>
                <span className='font-medium text-gray-500'>{r.name}</span>
                {(r.city || r.state) && (
                  <span>· {[r.city, r.state].filter(Boolean).join('/')}</span>
                )}
                <span>
                  · {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                </span>
                {r.isVerifiedPurchase && (
                  <span className='inline-flex items-center gap-0.5 text-green-600 font-medium'>
                    <BadgeCheck size={12} /> Compra verificada
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
