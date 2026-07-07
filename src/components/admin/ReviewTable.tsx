// 📄 src/components/admin/ReviewTable.tsx
// Moderação de avaliações (substitui o stub) — autossuficiente:
// abas Pendentes/Aprovadas, aprovar/reprovar (recalcula o rating do
// produto no servidor) e excluir.
'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, X, Trash2, Star, BadgeCheck, Loader2 } from 'lucide-react';

interface ReviewRow {
  _id: string;
  name: string;
  email: string;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  isStoreReview: boolean;
  isVerifiedPurchase?: boolean;
  createdAt: string;
  product?: { name: string; slug: string; thumbnail?: string } | null;
}

type Tab = 'pending' | 'approved';

export default function ReviewTable() {
  const [tab, setTab] = useState<Tab>('pending');
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?status=${tab}&limit=50`);
      const data = await res.json();
      if (data.success) setReviews(data.reviews);
      else toast.error(data.error || 'Erro ao carregar');
    } catch {
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function moderate(id: string, isApproved: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          isApproved ? 'Avaliação aprovada!' : 'Avaliação reprovada.',
        );
        setReviews(prev => prev.filter(r => r._id !== id));
      } else toast.error(data.error || 'Erro ao moderar');
    } catch {
      toast.error('Erro ao moderar');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta avaliação permanentemente?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Avaliação excluída.');
        setReviews(prev => prev.filter(r => r._id !== id));
      } else toast.error(data.error || 'Erro ao excluir');
    } catch {
      toast.error('Erro ao excluir');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {/* Abas */}
      <div className='flex gap-2 mb-4'>
        {(
          [
            { id: 'pending', label: 'Pendentes' },
            { id: 'approved', label: 'Aprovadas' },
          ] as { id: Tab; label: string }[]
        ).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className='flex justify-center py-12'>
          <Loader2 className='h-6 w-6 animate-spin text-gray-300' />
        </div>
      ) : reviews.length === 0 ? (
        <div className='bg-white rounded-lg p-12 text-center text-sm text-gray-500'>
          {tab === 'pending'
            ? 'Nenhuma avaliação aguardando moderação. 🤙'
            : 'Nenhuma avaliação aprovada ainda.'}
        </div>
      ) : (
        <div className='space-y-3'>
          {reviews.map(r => (
            <div key={r._id} className='bg-white rounded-lg shadow-sm p-4'>
              <div className='flex flex-col sm:flex-row sm:items-start gap-3'>
                <div className='flex-1 min-w-0 space-y-1.5'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <div className='flex gap-0.5'>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < r.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    {r.title && (
                      <span className='text-sm font-semibold text-gray-900'>
                        {r.title}
                      </span>
                    )}
                    {r.isVerifiedPurchase && (
                      <span className='inline-flex items-center gap-0.5 text-xs text-green-600 font-medium'>
                        <BadgeCheck size={12} /> Compra verificada
                      </span>
                    )}
                    {r.isStoreReview && (
                      <span className='text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium'>
                        Loja
                      </span>
                    )}
                  </div>
                  <p className='text-sm text-gray-700'>{r.comment}</p>
                  <p className='text-xs text-gray-400'>
                    <span className='font-medium text-gray-500'>{r.name}</span>{' '}
                    · {r.email} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                    {r.product && (
                      <>
                        {' '}
                        · Produto:{' '}
                        <span className='text-gray-600'>{r.product.name}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className='flex items-center gap-1.5 shrink-0'>
                  {tab === 'pending' ? (
                    <button
                      onClick={() => moderate(r._id, true)}
                      disabled={busyId === r._id}
                      className='inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50'
                    >
                      <Check size={14} /> Aprovar
                    </button>
                  ) : (
                    <button
                      onClick={() => moderate(r._id, false)}
                      disabled={busyId === r._id}
                      className='inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50'
                    >
                      <X size={14} /> Reprovar
                    </button>
                  )}
                  <button
                    onClick={() => remove(r._id)}
                    disabled={busyId === r._id}
                    className='p-2 text-gray-400 hover:text-red-500 disabled:opacity-50'
                    title='Excluir'
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
