// 📄 src/app/(auth)/login/page.tsx
// v3 (GAP 3 — Esqueci minha senha): modo recuperação em duas fases, no
//     padrão do Login.jsx do Elite adaptado ao NextAuth:
//     1) e-mail → POST /api/otp { action: 'send' } (respostas neutras,
//        cooldown de 60s com contador de reenvio);
//     2) código + nova senha + confirmar → POST /api/auth/reset-password
//        → auto-login via signIn('credentials') → /minha-conta.
//     Contas Google sem senha podem DEFINIR uma por aqui (conta híbrida) —
//     o toast do code 'use-google' agora também aponta este caminho.
// v2 (Google OAuth):
// - Botão "Continuar com Google" (logo oficial SVG) acima do form + divisor.
// - signIn('google', { redirectTo }) — fluxo OAuth completo com redirect.
'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width='18' height='18' viewBox='0 0 24 24' aria-hidden='true'>
      <path
        fill='#4285F4'
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z'
      />
      <path
        fill='#34A853'
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z'
      />
      <path
        fill='#FBBC05'
        d='M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z'
      />
      <path
        fill='#EA4335'
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
      />
    </svg>
  );
}

type Mode = 'login' | 'forgot-email' | 'forgot-reset';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Recuperação de senha
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Contador do reenvio (60s do cooldown do serviço de OTP)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    // Fluxo OAuth com redirect completo — o NextAuth leva ao Google e
    // volta para /minha-conta após o callback.
    signIn('google', { redirectTo: '/minha-conta' });
  };

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
        // Conta criada via Google, sem senha cadastrada
        if (result.code === 'use-google') {
          toast.error(
            'Esta conta usa login com Google. Clique em "Continuar com Google" — ou use "Esqueci minha senha" para definir uma.',
            { duration: 6000 },
          );
        } else {
          toast.error('Email ou senha incorretos');
        }
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

  // Fase 1: envia o código de 6 dígitos (rota existente, resposta neutra)
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Código enviado! Verifique seu e-mail.');
        setResendCooldown(60);
        setMode('forgot-reset');
      } else {
        toast.error(data.error || 'Não foi possível enviar o código.');
        if (data.retryInSeconds) {
          // Cooldown ativo (ex.: reenvio muito rápido) — segue para a fase
          // do código, que já deve estar na caixa de entrada.
          setResendCooldown(data.retryInSeconds);
          setMode('forgot-reset');
        }
      }
    } catch {
      toast.error('Erro ao enviar o código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Novo código enviado!');
        setResendCooldown(60);
      } else {
        toast.error(data.error || 'Não foi possível reenviar.');
        if (data.retryInSeconds) setResendCooldown(data.retryInSeconds);
      }
    } catch {
      toast.error('Erro ao reenviar o código.');
    } finally {
      setLoading(false);
    }
  };

  // Fase 2: código + nova senha → reset → auto-login
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Não foi possível redefinir a senha.');
        return;
      }

      // Auto-login com a senha recém-definida
      const result = await signIn('credentials', {
        email,
        password: newPassword,
        redirect: false,
      });
      if (result?.error) {
        // Senha trocada mas o login falhou por outro motivo — volta ao form
        toast.success('Senha redefinida! Entre com a nova senha.');
        setMode('login');
        setPassword('');
      } else {
        toast.success('Senha redefinida — você já está logado!');
        router.push('/minha-conta');
      }
    } catch {
      toast.error('Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setMode('login');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent';

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
          {/* ═══ MODO LOGIN ═══ */}
          {mode === 'login' && (
            <>
              <h1 className='text-2xl font-bold text-gray-900 text-center mb-1'>
                Entrar
              </h1>
              <p className='text-sm text-gray-500 text-center mb-6'>
                Acesse sua conta para acompanhar pedidos
              </p>

              {/* ═══ GOOGLE OAUTH ═══ */}
              <button
                type='button'
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className='w-full flex items-center justify-center gap-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                <GoogleIcon />
                {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
              </button>

              {/* Divisor */}
              <div className='flex items-center gap-3 my-6'>
                <div className='flex-1 h-px bg-gray-200' />
                <span className='text-xs text-gray-400 uppercase'>ou</span>
                <div className='flex-1 h-px bg-gray-200' />
              </div>

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
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <label
                      htmlFor='password'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Senha
                    </label>
                    <button
                      type='button'
                      onClick={() => setMode('forgot-email')}
                      className='text-xs text-[#FF6600] font-medium hover:underline'
                    >
                      Esqueci minha senha
                    </button>
                  </div>
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
            </>
          )}

          {/* ═══ RECUPERAÇÃO — FASE 1: E-MAIL ═══ */}
          {mode === 'forgot-email' && (
            <>
              <h1 className='text-2xl font-bold text-gray-900 text-center mb-1'>
                Recuperar senha
              </h1>
              <p className='text-sm text-gray-500 text-center mb-6'>
                Enviaremos um código de 6 dígitos para o seu e-mail. Contas
                criadas com Google também podem definir uma senha por aqui.
              </p>

              <form onSubmit={handleSendCode} className='space-y-4'>
                <div>
                  <label
                    htmlFor='forgot-email'
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
                      id='forgot-email'
                      type='email'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder='seu@email.com'
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type='submit'
                  disabled={loading}
                  className='w-full py-3 bg-[#FF6600] text-white font-bold text-sm rounded-lg hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  {loading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>

              <button
                type='button'
                onClick={backToLogin}
                className='mt-6 mx-auto flex items-center gap-1 text-sm text-gray-500 hover:text-[#FF6600] transition-colors'
              >
                <ArrowLeft size={14} /> Voltar ao login
              </button>
            </>
          )}

          {/* ═══ RECUPERAÇÃO — FASE 2: CÓDIGO + NOVA SENHA ═══ */}
          {mode === 'forgot-reset' && (
            <>
              <h1 className='text-2xl font-bold text-gray-900 text-center mb-1'>
                Defina a nova senha
              </h1>
              <p className='text-sm text-gray-500 text-center mb-6'>
                Digite o código enviado para{' '}
                <span className='font-medium text-gray-700'>{email}</span> e
                escolha a nova senha.
              </p>

              <form onSubmit={handleResetPassword} className='space-y-4'>
                <div>
                  <label
                    htmlFor='otp'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Código de verificação
                  </label>
                  <div className='relative'>
                    <KeyRound
                      size={16}
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                    />
                    <input
                      id='otp'
                      type='text'
                      inputMode='numeric'
                      autoComplete='one-time-code'
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                      placeholder='000000'
                      className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={handleResend}
                    disabled={loading || resendCooldown > 0}
                    className='mt-1.5 text-xs text-[#FF6600] font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed'
                  >
                    {resendCooldown > 0
                      ? `Reenviar código em ${resendCooldown}s`
                      : 'Reenviar código'}
                  </button>
                </div>

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
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder='Mínimo 6 caracteres'
                      className='w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                    />
                    <button
                      type='button'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='confirm-password'
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
                      id='confirm-password'
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder='Repita a nova senha'
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type='submit'
                  disabled={loading || otp.length !== 6}
                  className='w-full py-3 bg-[#FF6600] text-white font-bold text-sm rounded-lg hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  {loading ? 'Salvando...' : 'Redefinir senha e entrar'}
                </button>
              </form>

              <button
                type='button'
                onClick={backToLogin}
                className='mt-6 mx-auto flex items-center gap-1 text-sm text-gray-500 hover:text-[#FF6600] transition-colors'
              >
                <ArrowLeft size={14} /> Voltar ao login
              </button>
            </>
          )}
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
