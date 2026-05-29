'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { isValidEmail } from '@/lib/utils/validators';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Imagem opcional do modal (coloque em /public/images/). Sem ela, mostra um degradê. */
  imageSrc?: string;
}

export default function NewsletterModal({
  isOpen,
  onClose,
  onSuccess,
  imageSrc = '/images/news-foto.jpg',
}: NewsletterModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // ESC fecha + trava o scroll do body
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // foco no primeiro campo
    const t = setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setEmailError('');
    if (!isValidEmail(email)) {
      setEmailError('Digite um email válido');
      return;
    }
    if (!consent) {
      toast.error('Aceite receber nossos emails para continuar');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, birthday, consent }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Não foi possível concluir a inscrição');
        return;
      }

      if (data.alreadySubscribed) {
        toast.success(data.message || 'Você já está inscrito!');
        onSuccess?.();
        onClose();
        return;
      }

      setCouponCode(data.couponCode);
      onSuccess?.();
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!couponCode) return;
    try {
      await navigator.clipboard.writeText(couponCode);
      toast.success('Cupom copiado!');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='newsletter-title'
    >
      <div className='relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl'>
        {/* Fechar */}
        <button
          onClick={onClose}
          aria-label='Fechar'
          className='absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow hover:text-gray-900'
        >
          <X size={18} />
        </button>

        <div className='px-6 pt-8 pb-6'>
          {/* Logo / marca */}
          <p className='mb-4 text-center text-lg font-black tracking-wide text-[#1A1A1A]'>
            SURFERS PARADISE
          </p>

          {couponCode ? (
            // ───────── Estado de sucesso ─────────
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100'>
                <Check className='text-green-600' size={28} />
              </div>
              <h2 className='mb-1 text-xl font-bold text-gray-900'>
                Inscrição confirmada! 🎉
              </h2>
              <p className='mb-5 text-sm text-gray-500'>
                Use o cupom abaixo no carrinho e ganhe{' '}
                <strong className='text-[#FF6600]'>10% OFF</strong> na sua
                primeira compra.
              </p>

              <button
                onClick={handleCopy}
                className='mx-auto mb-5 flex items-center gap-3 rounded-xl border-2 border-dashed border-[#FF6600] bg-[#FFF7F0] px-6 py-3 transition-colors hover:bg-[#ffeede]'
              >
                <span className='text-2xl font-black tracking-[0.2em] text-[#FF6600]'>
                  {couponCode}
                </span>
                <Copy size={18} className='text-[#FF6600]' />
              </button>

              <p className='mb-5 text-xs text-gray-400'>
                Enviamos uma cópia para o seu email. Válido por 30 dias · uso
                único.
              </p>

              <Button onClick={onClose} className='w-full' size='lg'>
                Continuar comprando
              </Button>
            </div>
          ) : (
            // ───────── Formulário ─────────
            <>
              <h2
                id='newsletter-title'
                className='mb-1 text-center text-xl font-bold text-gray-900'
              >
                Assine nossa newsletter e ganhe
              </h2>
              <p className='mb-5 text-center text-sm text-gray-600'>
                <strong className='text-[#FF6600]'>10% OFF</strong> na sua
                primeira compra
              </p>

              <div className='space-y-3'>
                <Input
                  ref={firstFieldRef}
                  id='nl-name'
                  label='NOME'
                  placeholder='Seu nome'
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <Input
                  id='nl-email'
                  type='email'
                  label='EMAIL'
                  placeholder='seu@email.com'
                  value={email}
                  error={emailError}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                />
                <Input
                  id='nl-birthday'
                  type='date'
                  label='DATA DE ANIVERSÁRIO'
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                />

                <label className='flex cursor-pointer items-start gap-2 pt-1'>
                  <input
                    type='checkbox'
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className='mt-0.5 h-4 w-4 flex-shrink-0 accent-[#FF6600]'
                  />
                  <span className='text-xs leading-snug text-gray-500'>
                    Aceito receber emails com novidades e promoções e concordo
                    com os{' '}
                    <Link
                      href='/termos'
                      target='_blank'
                      className='text-[#FF6600] underline'
                    >
                      termos
                    </Link>{' '}
                    e a{' '}
                    <Link
                      href='/politica-privacidade'
                      target='_blank'
                      className='text-[#FF6600] underline'
                    >
                      política de privacidade
                    </Link>
                    .
                  </span>
                </label>

                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  size='lg'
                  className='w-full'
                >
                  ENVIAR
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Imagem inferior (com fallback em degradê se o arquivo não existir) */}
        <div className='relative h-40 w-full bg-gradient-to-br from-[#FF6600] to-[#1A1A1A]'>
          <Image
            src={imageSrc}
            alt=''
            fill
            sizes='448px'
            className='object-cover'
          />
        </div>
      </div>
    </div>
  );
}
