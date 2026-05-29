'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CouponForm from '@/components/admin/CouponForm';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/coupons?${params.toString()}`);
      const data = await res.json();
      if (data.success) setCoupons(data.coupons);
      else toast.error(data.error || 'Erro ao carregar cupons');
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditing(null);
    fetchCoupons();
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Excluir o cupom "${coupon.code}"?`)) return;
    try {
      const res = await fetch(`/api/coupons/${coupon._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Erro ao excluir');
        return;
      }
      toast.success('Cupom excluído');
      fetchCoupons();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Ticket className='text-[#FF6600]' size={24} />
          <h1 className='text-2xl font-bold'>Cupons</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} className='mr-1' /> Novo cupom
        </Button>
      </div>

      {/* Busca */}
      <div className='mb-4 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 max-w-sm'>
        <Search size={16} className='text-gray-400' />
        <input
          type='text'
          value={search}
          onChange={e => setSearch(e.target.value.toUpperCase())}
          placeholder='Buscar por código'
          className='w-full text-sm outline-none'
        />
      </div>

      {/* Tabela */}
      <div className='overflow-x-auto rounded-lg border border-gray-200 bg-white'>
        <table className='w-full text-sm'>
          <thead className='border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500'>
            <tr>
              <th className='px-4 py-3'>Código</th>
              <th className='px-4 py-3'>Desconto</th>
              <th className='px-4 py-3'>Pedido mín.</th>
              <th className='px-4 py-3'>Usos</th>
              <th className='px-4 py-3'>Validade</th>
              <th className='px-4 py-3'>Status</th>
              <th className='px-4 py-3 text-right'>Ações</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {loading ? (
              <tr>
                <td colSpan={7} className='px-4 py-8 text-center text-gray-400'>
                  Carregando...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className='px-4 py-8 text-center text-gray-400'>
                  Nenhum cupom encontrado
                </td>
              </tr>
            ) : (
              coupons.map(c => {
                const expired = new Date(c.validUntil) < new Date();
                return (
                  <tr key={c._id} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 font-mono font-bold text-gray-900'>
                      {c.code}
                    </td>
                    <td className='px-4 py-3'>
                      {c.type === 'percentage'
                        ? `${c.value}%`
                        : formatCurrency(c.value)}
                    </td>
                    <td className='px-4 py-3 text-gray-600'>
                      {c.minOrderValue ? formatCurrency(c.minOrderValue) : '—'}
                    </td>
                    <td className='px-4 py-3 text-gray-600'>
                      {c.usedCount}/{c.usageLimit ? c.usageLimit : '∞'}
                    </td>
                    <td className='px-4 py-3 text-gray-600'>
                      {formatDate(c.validUntil)}
                      {expired && (
                        <span className='ml-1 text-xs text-red-500'>
                          (expirado)
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex justify-end gap-2'>
                        <button
                          onClick={() => openEdit(c)}
                          className='p-1.5 text-gray-400 hover:text-[#FF6600]'
                          title='Editar'
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className='p-1.5 text-gray-400 hover:text-red-500'
                          title='Excluir'
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal criar/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar cupom' : 'Novo cupom'}
      >
        <CouponForm
          coupon={editing}
          onSaved={handleSaved}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
