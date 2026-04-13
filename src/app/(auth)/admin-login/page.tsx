'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
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
        router.push('/admin');
      }
    } catch {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#1A1A1A] relative overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-5'>
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Login Card */}
      <div className='relative w-full max-w-md mx-4'>
        {/* Logo + Title */}
        <div className='text-center mb-8'>
          <Link href='/' className='inline-flex items-center gap-3 mb-4'>
            <Image
              src='/images/logo-navbar.png'
              alt='Surfers Paradise'
              width={56}
              height={56}
              className='w-14 h-14 object-contain'
            />
            <div className='text-left'>
              <p className='text-white font-black text-xl leading-tight'>
                SURFERS PARADISE
              </p>
              <p className='text-[10px] text-gray-400 uppercase tracking-widest'>
                Authentic Board Shop
              </p>
            </div>
          </Link>
        </div>

        <div className='bg-white rounded-2xl shadow-2xl p-8'>
          {/* Header */}
          <div className='text-center mb-6'>
            <div className='w-12 h-12 bg-[#FF6600]/10 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Lock size={22} className='text-[#FF6600]' />
            </div>
            <h1 className='text-xl font-bold text-gray-900'>
              Painel Administrativo
            </h1>
            <p className='text-sm text-gray-500 mt-1'>
              Faça login para acessar o painel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-1.5'
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
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent transition-shadow'
                  placeholder='admin@surfersparadise.com.br'
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-1.5'
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
                  className='w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent transition-shadow'
                  placeholder='••••••••'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
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
        </div>

        {/* Back to store */}
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
