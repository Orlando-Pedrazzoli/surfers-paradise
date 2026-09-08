// 📄 src/app/(account)/minha-conta/page.tsx
// v2 (GAP 4): seção SEGURANÇA — alterar senha (atual + nova + confirmar)
//     ou, para contas Google-only (hasPassword=false no /api/auth/me),
//     DEFINIR a primeira senha sem pedir a atual (conta híbrida, GAP 3).
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Save,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export default function MinhaContaPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', cpf: '', phone: '' });
  const [hasPassword, setHasPassword] = useState(true);
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
          setForm({
            name: data.user.name,
            email: data.user.email,
            cpf: data.user.cpf || '',
            phone: data.user.phone || '',
          });
          setHasPassword(data.hasPassword !== false);
        }
      } catch {
        /* session will populate */
      }
      setLoading(false);
    };
    if (session?.user) fetchUser();
  }, [session]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
      .replace(/(\d{3})(\d{3})/, '$1.$2');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) toast.success('Dados atualizados com sucesso!');
      else toast.error(data.error || 'Erro ao atualizar');
    } catch {
      toast.error('Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  // GAP 4 — alterar/definir senha
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          hasPassword
            ? 'Senha alterada com sucesso!'
            : 'Senha definida! Agora você também pode entrar com e-mail e senha.',
        );
        setHasPassword(true);
        setPwdForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(data.error || 'Erro ao atualizar a senha');
      }
    } catch {
      toast.error('Erro ao atualizar a senha');
    } finally {
      setSavingPwd(false);
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
      <h1 className='text-2xl font-bold text-gray-900 mb-6'>Minha Conta</h1>

      <div className='bg-white rounded-lg shadow-sm p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Dados Pessoais
        </h2>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Nome completo
              </label>
              <div className='relative'>
                <User
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  type='text'
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Email
              </label>
              <div className='relative'>
                <Mail
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  type='email'
                  value={form.email}
                  disabled
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed'
                />
              </div>
              <p className='text-xs text-gray-400 mt-1'>
                O email não pode ser alterado
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                CPF
              </label>
              <div className='relative'>
                <CreditCard
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  type='text'
                  value={form.cpf}
                  onChange={e =>
                    setForm({ ...form, cpf: formatCpf(e.target.value) })
                  }
                  placeholder='000.000.000-00'
                  maxLength={14}
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Telefone
              </label>
              <div className='relative'>
                <Phone
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  type='tel'
                  value={form.phone}
                  onChange={e =>
                    setForm({ ...form, phone: formatPhone(e.target.value) })
                  }
                  placeholder='(11) 99999-9999'
                  maxLength={15}
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
            </div>
          </div>

          <button
            type='submit'
            disabled={saving}
            className='px-6 py-2.5 bg-[#FF6600] text-white font-medium text-sm rounded-lg hover:bg-[#e55b00] disabled:opacity-50 transition-colors inline-flex items-center gap-2'
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      {/* ═══ SEGURANÇA (GAP 4) ═══ */}
      <div className='bg-white rounded-lg shadow-sm p-6 mt-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2'>
          <ShieldCheck size={18} className='text-gray-400' />
          Segurança
        </h2>
        <p className='text-sm text-gray-500 mb-4'>
          {hasPassword
            ? 'Altere a senha de acesso da sua conta.'
            : 'Sua conta usa login com Google. Defina uma senha para também poder entrar com e-mail e senha.'}
        </p>

        <form onSubmit={handlePasswordSubmit} className='space-y-4 max-w-md'>
          {hasPassword && (
            <div>
              <label
                htmlFor='current-password'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Senha atual
              </label>
              <div className='relative'>
                <Lock
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  id='current-password'
                  type='password'
                  value={pwdForm.currentPassword}
                  onChange={e =>
                    setPwdForm({ ...pwdForm, currentPassword: e.target.value })
                  }
                  required
                  autoComplete='current-password'
                  placeholder='••••••••'
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor='new-password'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Nova senha
            </label>
            <div className='relative'>
              <Lock
                size={16}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
              />
              <input
                id='new-password'
                type='password'
                value={pwdForm.newPassword}
                onChange={e =>
                  setPwdForm({ ...pwdForm, newPassword: e.target.value })
                }
                required
                minLength={6}
                autoComplete='new-password'
                placeholder='Mínimo 6 caracteres'
                className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='confirm-new-password'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Confirmar nova senha
            </label>
            <div className='relative'>
              <Lock
                size={16}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
              />
              <input
                id='confirm-new-password'
                type='password'
                value={pwdForm.confirmPassword}
                onChange={e =>
                  setPwdForm({ ...pwdForm, confirmPassword: e.target.value })
                }
                required
                minLength={6}
                autoComplete='new-password'
                placeholder='Repita a nova senha'
                className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={savingPwd}
            className='px-6 py-2.5 bg-[#FF6600] text-white font-medium text-sm rounded-lg hover:bg-[#e55b00] disabled:opacity-50 transition-colors inline-flex items-center gap-2'
          >
            <Save size={16} />
            {savingPwd
              ? 'Salvando...'
              : hasPassword
                ? 'Alterar senha'
                : 'Definir senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
