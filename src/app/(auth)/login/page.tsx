'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error('Email ou senha incorretos');
      } else {
        toast.success('Login efetuado com sucesso!');
        router.push('/minha-conta');
      }
    } catch {
      toast.error('Erro ao fazer login');
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
            Entrar
          </h1>
          <p className='text-sm text-gray-500 text-center mb-6'>
            Acesse sua conta para acompanhar pedidos
          </p>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Email
              </label>
              <div className='relative'>
                <Mail
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  id='email'
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder='seu@email.com'
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Senha
              </label>
              <div className='relative'>
                <Lock
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder='••••••••'
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

            <button
              type='submit'
              disabled={loading}
              className='w-full py-3 bg-[#FF6600] text-white font-bold text-sm rounded-lg hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-500'>
              Ainda não tem conta?{' '}
              <Link
                href='/cadastro'
                className='text-[#FF6600] font-medium hover:underline'
              >
                Cadastre-se
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
