'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Truck, X, Save } from 'lucide-react';

interface Supplier {
  _id: string;
  name: string;
  slug: string;
  cnpj: string;
  email: string;
  phone: string;
  contactPerson: string;
  notes: string;
  isActive: boolean;
}

const emptyForm = {
  name: '',
  cnpj: '',
  email: '',
  phone: '',
  contactPerson: '',
  notes: '',
  isActive: true,
};

export default function AdminFornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/suppliers?${params}`);
      const data = await res.json();
      if (data.success) setSuppliers(data.suppliers);
    } catch {
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (supplier: Supplier) => {
    setForm({
      name: supplier.name,
      cnpj: supplier.cnpj || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      contactPerson: supplier.contactPerson || '',
      notes: supplier.notes || '',
      isActive: supplier.isActive,
    });
    setEditingId(supplier._id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nome do fornecedor é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          editingId ? 'Fornecedor atualizado!' : 'Fornecedor criado!',
        );
        setShowModal(false);
        fetchSuppliers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao salvar fornecedor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover o fornecedor "${name}"?`)) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Fornecedor removido!');
        fetchSuppliers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao remover fornecedor');
    }
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Fornecedores</h1>
        <button
          onClick={openCreate}
          className='flex items-center gap-2 px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors'
        >
          <Plus size={18} />
          Novo Fornecedor
        </button>
      </div>

      <div className='mb-6'>
        <div className='relative'>
          <Search
            size={18}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
          />
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Buscar por nome ou CNPJ...'
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
          />
        </div>
      </div>

      <div className='bg-white rounded-lg shadow-sm'>
        {loading ? (
          <div className='p-12 flex items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
          </div>
        ) : suppliers.length === 0 ? (
          <div className='p-12 text-center text-gray-500'>
            <Truck size={48} className='mx-auto mb-3 opacity-50' />
            <p>Nenhum fornecedor cadastrado</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 border-b'>
                <tr>
                  <th className='text-left p-4 font-medium text-gray-600'>
                    Nome
                  </th>
                  <th className='text-left p-4 font-medium text-gray-600'>
                    CNPJ
                  </th>
                  <th className='text-left p-4 font-medium text-gray-600'>
                    Contato
                  </th>
                  <th className='text-left p-4 font-medium text-gray-600'>
                    Telefone / E-mail
                  </th>
                  <th className='text-left p-4 font-medium text-gray-600'>
                    Status
                  </th>
                  <th className='text-right p-4 font-medium text-gray-600'>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {suppliers.map(s => (
                  <tr key={s._id} className='hover:bg-gray-50'>
                    <td className='p-4 font-medium text-gray-900'>{s.name}</td>
                    <td className='p-4 text-gray-600 font-mono text-xs'>
                      {s.cnpj || '—'}
                    </td>
                    <td className='p-4 text-gray-600'>
                      {s.contactPerson || '—'}
                    </td>
                    <td className='p-4 text-gray-600 text-xs'>
                      {s.phone && <div>{s.phone}</div>}
                      {s.email && <div>{s.email}</div>}
                      {!s.phone && !s.email && '—'}
                    </td>
                    <td className='p-4'>
                      {s.isActive ? (
                        <span className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded'>
                          Ativo
                        </span>
                      ) : (
                        <span className='text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded'>
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className='p-4 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <button
                          onClick={() => openEdit(s)}
                          className='p-2 text-gray-400 hover:text-[#FF6600] transition-colors'
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id, s.name)}
                          className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between p-6 border-b'>
              <h2 className='text-lg font-bold'>
                {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nome *
                </label>
                <input
                  type='text'
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    CNPJ
                  </label>
                  <input
                    type='text'
                    value={form.cnpj}
                    onChange={e => setForm({ ...form, cnpj: e.target.value })}
                    placeholder='00.000.000/0000-00'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Pessoa de Contato
                  </label>
                  <input
                    type='text'
                    value={form.contactPerson}
                    onChange={e =>
                      setForm({ ...form, contactPerson: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Telefone
                  </label>
                  <input
                    type='text'
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder='(11) 99999-9999'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    E-mail
                  </label>
                  <input
                    type='email'
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Observações
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={form.isActive}
                  onChange={e =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <span className='text-sm'>Ativo</span>
              </label>
              <div className='flex gap-3 pt-4 border-t'>
                <button
                  type='submit'
                  disabled={saving}
                  className='flex items-center gap-2 px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] disabled:opacity-50 transition-colors'
                >
                  <Save size={16} />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors'
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
