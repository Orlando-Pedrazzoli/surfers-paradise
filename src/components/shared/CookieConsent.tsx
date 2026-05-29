'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import Modal from '@/components/ui/Modal';

const CONSENT_KEY = 'cookie-consent';
const CONSENT_VERSION = 1;

export interface CookieCategories {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

interface StoredConsent {
  v: number;
  t: string; // ISO timestamp do consentimento
  c: CookieCategories;
}

// Helper para outros componentes/scripts lerem o consentimento atual.
export function getCookieConsent(): CookieCategories | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.v !== CONSENT_VERSION) return null; // versão antiga → reconsentir
    return parsed.c;
  } catch {
    return null;
  }
}

function persist(c: CookieCategories) {
  const data: StoredConsent = {
    v: CONSENT_VERSION,
    t: new Date().toISOString(),
    c,
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
  } catch {}
  // Scripts de analytics/marketing podem ouvir esse evento para ligar/desligar.
  window.dispatchEvent(
    new CustomEvent('cookie-consent-updated', { detail: c }),
  );
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Mostra o banner se ainda não há consentimento válido
  useEffect(() => {
    if (!getCookieConsent()) setShowBanner(true);
  }, []);

  const loadCurrentIntoToggles = useCallback(() => {
    const current = getCookieConsent();
    setAnalytics(current?.analytics ?? false);
    setFunctional(current?.functional ?? false);
    setMarketing(current?.marketing ?? false);
  }, []);

  // Reabertura: link no rodapé (data-cookie-preferences) ou evento global
  useEffect(() => {
    const openPrefs = () => {
      loadCurrentIntoToggles();
      setShowPrefs(true);
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest(
        '[data-cookie-preferences]',
      );
      if (el) {
        e.preventDefault();
        openPrefs();
      }
    };
    window.addEventListener('open-cookie-preferences', openPrefs);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('open-cookie-preferences', openPrefs);
      document.removeEventListener('click', onClick);
    };
  }, [loadCurrentIntoToggles]);

  const acceptAll = useCallback(() => {
    persist({
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
    });
    setShowBanner(false);
    setShowPrefs(false);
  }, []);

  const rejectAll = useCallback(() => {
    persist({
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
    });
    setShowBanner(false);
    setShowPrefs(false);
  }, []);

  const savePrefs = useCallback(() => {
    persist({ necessary: true, analytics, functional, marketing });
    setShowBanner(false);
    setShowPrefs(false);
  }, [analytics, functional, marketing]);

  const openPrefsFromBanner = () => {
    loadCurrentIntoToggles();
    setShowPrefs(true);
  };

  return (
    <>
      {/* ───── Banner 1º nível ───── */}
      {showBanner && !showPrefs && (
        <div className='fixed bottom-0 left-0 right-0 z-[90] p-3 sm:p-4'>
          <div className='mx-auto max-w-5xl rounded-xl bg-[#1A1A1A] text-white shadow-2xl ring-1 ring-white/10'>
            <div className='flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between'>
              <div className='flex items-start gap-3'>
                <Cookie
                  className='mt-0.5 flex-shrink-0 text-[#FF6600]'
                  size={22}
                />
                <p className='text-sm leading-relaxed text-gray-200'>
                  Usamos cookies para melhorar sua experiência, analisar o
                  tráfego e personalizar conteúdo. Você pode aceitar todos,
                  rejeitar os não essenciais ou escolher suas preferências.
                  Saiba mais na nossa{' '}
                  <Link
                    href='/politica-privacidade'
                    className='text-[#FF6600] underline'
                  >
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </div>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-3 md:flex md:flex-shrink-0'>
                <button
                  onClick={rejectAll}
                  className='whitespace-nowrap rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10'
                >
                  Rejeitar não essenciais
                </button>
                <button
                  onClick={openPrefsFromBanner}
                  className='whitespace-nowrap rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10'
                >
                  Personalizar
                </button>
                <button
                  onClick={acceptAll}
                  className='whitespace-nowrap rounded-lg bg-[#FF6600] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e55b00]'
                >
                  Aceitar todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── Banner 2º nível — preferências ───── */}
      <Modal
        isOpen={showPrefs}
        onClose={() => setShowPrefs(false)}
        title='Preferências de cookies'
      >
        <div className='space-y-4'>
          <p className='text-sm text-gray-600'>
            Gerencie suas preferências por categoria. Os cookies necessários são
            sempre ativos pois garantem o funcionamento básico do site.
          </p>

          <CategoryRow
            title='Necessários'
            description='Essenciais para login, carrinho e segurança. Não podem ser desativados.'
            checked
            disabled
          />
          <CategoryRow
            title='Desempenho / Analíticos'
            description='Ajudam a entender como você usa o site para melhorá-lo (ex.: métricas de audiência).'
            checked={analytics}
            onChange={setAnalytics}
          />
          <CategoryRow
            title='Funcionais'
            description='Lembram suas escolhas (ex.: região, preferências) para uma experiência personalizada.'
            checked={functional}
            onChange={setFunctional}
          />
          <CategoryRow
            title='Marketing'
            description='Usados para exibir anúncios mais relevantes e medir campanhas.'
            checked={marketing}
            onChange={setMarketing}
          />

          <div className='grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3'>
            <button
              onClick={rejectAll}
              className='rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50'
            >
              Rejeitar todos
            </button>
            <button
              onClick={savePrefs}
              className='rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50'
            >
              Salvar preferências
            </button>
            <button
              onClick={acceptAll}
              className='rounded-lg bg-[#FF6600] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e55b00]'
            >
              Aceitar todos
            </button>
          </div>

          <p className='text-center text-xs text-gray-400'>
            Veja também os{' '}
            <Link href='/termos' className='underline hover:text-[#FF6600]'>
              Termos de Uso
            </Link>
            .
          </p>
        </div>
      </Modal>
    </>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className='flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-3'>
      <div>
        <p className='text-sm font-semibold text-gray-900'>{title}</p>
        <p className='mt-0.5 text-xs text-gray-500'>{description}</p>
      </div>
      <label className='relative inline-flex flex-shrink-0 cursor-pointer items-center'>
        <input
          type='checkbox'
          className='peer sr-only'
          checked={checked}
          disabled={disabled}
          onChange={e => onChange?.(e.target.checked)}
        />
        <div
          className={`h-6 w-11 rounded-full transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5 ${
            disabled
              ? 'bg-[#FF6600]/40'
              : 'bg-gray-300 peer-checked:bg-[#FF6600]'
          }`}
        />
      </label>
    </div>
  );
}
