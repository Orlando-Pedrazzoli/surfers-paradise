'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, Phone, CreditCard } from 'lucide-react';

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (form.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          cpf: form.cpf,
          phone: form.phone,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Erro ao criar conta');
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const signInResult = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.success('Conta criada! Faça login para continuar.');
        router.push('/login');
      } else {
        toast.success('Conta criada com sucesso! Bem-vindo!');
        router.push('/minha-conta');
      }
    } catch {
      toast.error('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4'>
      <div className='w-full max-w-md'>
        {/* Logo */}
        <div className='text-center mb-8'>
          <Link href='/' className='inline-flex items-center gap-2'>
            <Image
              src='/images/logo-navbar.png'
              alt='Surfers Paradise'
              width={48}
              height={48}
              className='w-12 h-12 object-contain'
            />
            <div className='text-left'>
              <p className='text-lg font-black text-gray-900 leading-tight'>
                SURFERS PARADISE
              </p>
              <p className='text-[9px] text-gray-500 uppercase tracking-widest'>
                Authentic Board Shop
              </p>
            </div>
          </Link>
        </div>

        <div className='bg-white rounded-2xl shadow-lg p-8'>
          <h1 className='text-2xl font-bold text-gray-900 text-center mb-1'>
            Criar Conta
          </h1>
          <p className='text-sm text-gray-500 text-center mb-6'>
            Cadastre-se para comprar e acompanhar seus pedidos
          </p>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Nome completo *
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
                  placeholder='Seu nome completo'
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Email *
              </label>
              <div className='relative'>
                <Mail
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  type='email'
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder='seu@email.com'
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
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
                    className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
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
                    className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                  />
                </div>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Senha *
              </label>
              <div className='relative'>
                <Lock
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder='Mínimo 6 caracteres'
                  className='w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Confirmar senha *
              </label>
              <div className='relative'>
                <Lock
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  required
                  minLength={6}
                  placeholder='Repita a senha'
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full py-3 bg-[#FF6600] text-white font-bold text-sm rounded-lg hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <p className='text-[10px] text-gray-400 text-center mt-4'>
            Ao criar sua conta, você concorda com nossos{' '}
            <Link href='/termos' className='text-[#FF6600] hover:underline'>
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link
              href='/politica-privacidade'
              className='text-[#FF6600] hover:underline'
            >
              Política de Privacidade
            </Link>
            .
          </p>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-500'>
              Já tem conta?{' '}
              <Link
                href='/login'
                className='text-[#FF6600] font-medium hover:underline'
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>

        <div className='text-center mt-6'>
          <Link
            href='/'
            className='text-sm text-gray-500 hover:text-[#FF6600] transition-colors'
          >
            ← Voltar para a loja
          </Link>
        </div>
      </div>
    </div>
  );
}
