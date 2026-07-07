// 📄 src/app/(auth)/verificar-email/page.tsx
// Verificação de e-mail por OTP (constrói sobre /api/otp).
// Lê ?email= da URL (vindo do cadastro), input de 6 dígitos, reenvio com
// cooldown (respeita o retryInSeconds do 429), e no sucesso mostra quantos
// pedidos guest foram vinculados à conta antes de redirecionar.
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { MailCheck, CheckCircle2, Loader2 } from 'lucide-react';

function VerificarEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [done, setDone] = useState<{ claimedOrders: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown do cooldown de reenvio
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown(c => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResend() {
    if (!email || sending || cooldown > 0) return;
    setSending(true);
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Código reenviado! Verifique seu e-mail.');
        setCooldown(60);
      } else {
        toast.error(data.error || 'Não foi possível reenviar.');
        if (data.retryInSeconds) setCooldown(data.retryInSeconds);
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (verifying || code.length !== 6) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, code }),
      });
      const data = await res.json();
      if (data.success) {
        setDone({ claimedOrders: data.claimedOrders || 0 });
        setTimeout(() => router.push('/meus-pedidos'), 2500);
      } else {
        toast.error(data.error || 'Código inválido.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setVerifying(false);
    }
  }

  if (done) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
        <div className='max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-3'>
          <CheckCircle2 className='mx-auto h-14 w-14 text-green-500' />
          <h1 className='text-2xl font-bold text-gray-900'>
            E-mail verificado!
          </h1>
          {done.claimedOrders > 0 ? (
            <p className='text-gray-600'>
              Encontramos{' '}
              <strong>
                {done.claimedOrders} pedido{done.claimedOrders > 1 ? 's' : ''}
              </strong>{' '}
              feito{done.claimedOrders > 1 ? 's' : ''} com este e-mail — já{' '}
              {done.claimedOrders > 1 ? 'estão' : 'está'} na sua conta!
            </p>
          ) : (
            <p className='text-gray-600'>Sua conta está confirmada.</p>
          )}
          <p className='text-sm text-gray-400'>
            Redirecionando para seus pedidos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='max-w-md w-full bg-white rounded-2xl shadow-lg p-8'>
        <MailCheck className='mx-auto mb-4 h-12 w-12 text-[#FF6600]' />
        <h1 className='text-2xl font-bold text-gray-900 text-center mb-1'>
          Verifique seu e-mail
        </h1>
        <p className='text-sm text-gray-500 text-center mb-6'>
          Enviamos um código de 6 dígitos para{' '}
          {email ? <strong>{email}</strong> : 'o seu e-mail'}.
        </p>

        <form onSubmit={handleVerify} className='space-y-4'>
          {!searchParams.get('email') && (
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='seu@email.com'
              required
              className='w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
            />
          )}

          <input
            inputMode='numeric'
            autoComplete='one-time-code'
            value={code}
            onChange={e =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder='000000'
            className='w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
          />

          <button
            type='submit'
            disabled={verifying || code.length !== 6 || !email}
            className='w-full py-3 bg-[#FF6600] text-white font-bold text-sm rounded-lg hover:bg-[#e55b00] disabled:opacity-50 transition-colors flex items-center justify-center gap-2'
          >
            {verifying && <Loader2 className='h-4 w-4 animate-spin' />}
            {verifying ? 'Verificando...' : 'Verificar'}
          </button>
        </form>

        <div className='mt-4 text-center'>
          <button
            type='button'
            onClick={handleResend}
            disabled={sending || cooldown > 0 || !email}
            className='text-sm text-[#FF6600] font-medium hover:underline disabled:text-gray-400 disabled:no-underline'
          >
            {cooldown > 0
              ? `Reenviar código em ${cooldown}s`
              : sending
                ? 'Enviando...'
                : 'Reenviar código'}
          </button>
        </div>

        <div className='mt-6 text-center'>
          <Link
            href='/meus-pedidos'
            className='text-xs text-gray-400 hover:text-gray-600'
          >
            Verificar depois →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerificarEmailContent />
    </Suspense>
  );
}
