'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { MapPin, Plus, Trash2, Edit2, Star, X } from 'lucide-react';

interface Address {
  _id: string;
  name: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  isDefault: boolean;
}

const STATES = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
];

const emptyForm = {
  name: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  cep: '',
  phone: '',
};

export default function EnderecosPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses');
      const data = await res.json();
      if (data.success) setAddresses(data.addresses);
    } catch {
      /* empty */
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user) fetchAddresses();
  }, [session]);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      /* ignore */
    }
  };

  const handleNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (addr: Address) => {
    setForm({
      name: addr.name,
      street: addr.street,
      number: addr.number,
      complement: addr.complement,
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      cep: addr.cep,
      phone: addr.phone,
    });
    setEditingId(addr._id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.street ||
      !form.number ||
      !form.neighborhood ||
      !form.city ||
      !form.state ||
      !form.cep
    ) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setSaving(true);

    const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          editingId ? 'Endereço atualizado!' : 'Endereço adicionado!',
        );
        handleCancel();
        fetchAddresses();
      } else toast.error(data.error || 'Erro ao salvar');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este endereço?')) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Endereço removido!');
        fetchAddresses();
      } else toast.error('Erro ao remover');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}/default`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Endereço padrão atualizado!');
        fetchAddresses();
      }
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  if (loading)
    return (
      <div className='flex justify-center py-12'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
      </div>
    );

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Meus Endereços</h1>
        {!showForm && (
          <button
            onClick={handleNew}
            className='px-4 py-2 bg-[#FF6600] text-white font-medium text-sm rounded-lg hover:bg-[#e55b00] transition-colors inline-flex items-center gap-2'
          >
            <Plus size={16} /> Novo Endereço
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold'>
              {editingId ? 'Editar Endereço' : 'Novo Endereço'}
            </h2>
            <button
              onClick={handleCancel}
              className='text-gray-400 hover:text-gray-600'
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nome do endereço *
                </label>
                <input
                  type='text'
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder='Ex: Casa, Trabalho'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  CEP *
                </label>
                <input
                  type='text'
                  value={form.cep}
                  onChange={e => {
                    const v = formatCep(e.target.value);
                    setForm({ ...form, cep: v });
                    if (v.replace(/\D/g, '').length === 8) lookupCep(v);
                  }}
                  required
                  placeholder='00000-000'
                  maxLength={9}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Telefone
                </label>
                <input
                  type='tel'
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder='(11) 99999-9999'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Rua *
                </label>
                <input
                  type='text'
                  value={form.street}
                  onChange={e => setForm({ ...form, street: e.target.value })}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Número *
                </label>
                <input
                  type='text'
                  value={form.number}
                  onChange={e => setForm({ ...form, number: e.target.value })}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Complemento
                </label>
                <input
                  type='text'
                  value={form.complement}
                  onChange={e =>
                    setForm({ ...form, complement: e.target.value })
                  }
                  placeholder='Apto, Bloco'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Bairro *
                </label>
                <input
                  type='text'
                  value={form.neighborhood}
                  onChange={e =>
                    setForm({ ...form, neighborhood: e.target.value })
                  }
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Cidade *
                </label>
                <input
                  type='text'
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Estado *
                </label>
                <select
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                >
                  <option value=''>Selecionar</option>
                  {STATES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='flex gap-3'>
              <button
                type='submit'
                disabled={saving}
                className='px-6 py-2.5 bg-[#FF6600] text-white font-medium text-sm rounded-lg hover:bg-[#e55b00] disabled:opacity-50 transition-colors'
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type='button'
                onClick={handleCancel}
                className='px-6 py-2.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors'
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
          <MapPin size={48} className='mx-auto mb-4 text-gray-200' />
          <h2 className='text-lg font-medium text-gray-900 mb-2'>
            Nenhum endereço cadastrado
          </h2>
          <p className='text-sm text-gray-500 mb-6'>
            Adicione um endereço para facilitar suas compras.
          </p>
          <button
            onClick={handleNew}
            className='px-6 py-2.5 bg-[#FF6600] text-white font-medium text-sm rounded-lg hover:bg-[#e55b00] transition-colors inline-flex items-center gap-2'
          >
            <Plus size={16} /> Adicionar Endereço
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          {addresses.map(addr => (
            <div
              key={addr._id}
              className={`bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row gap-4 ${addr.isDefault ? 'ring-2 ring-[#FF6600]' : ''}`}
            >
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <p className='text-sm font-semibold text-gray-900'>
                    {addr.name}
                  </p>
                  {addr.isDefault && (
                    <span className='text-[10px] bg-[#FF6600] text-white px-2 py-0.5 rounded-full font-medium'>
                      Padrão
                    </span>
                  )}
                </div>
                <p className='text-sm text-gray-600'>
                  {addr.street}, {addr.number}
                  {addr.complement ? ` - ${addr.complement}` : ''}
                </p>
                <p className='text-sm text-gray-600'>
                  {addr.neighborhood} — {addr.city}/{addr.state}
                </p>
                <p className='text-sm text-gray-500'>CEP: {addr.cep}</p>
                {addr.phone && (
                  <p className='text-sm text-gray-500'>Tel: {addr.phone}</p>
                )}
              </div>
              <div className='flex sm:flex-col items-center gap-2'>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    className='p-2 text-gray-400 hover:text-[#FF6600] transition-colors'
                    title='Definir como padrão'
                  >
                    <Star size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(addr)}
                  className='p-2 text-gray-400 hover:text-blue-500 transition-colors'
                  title='Editar'
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(addr._id)}
                  className='p-2 text-gray-400 hover:text-red-500 transition-colors'
                  title='Remover'
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
