'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import NewsletterModal from './NewsletterModal';

// Ajustáveis
const DELAY_MS = 12000; // abre após 12s no site
const SCROLL_THRESHOLD = 0.45; // ou após 45% de scroll
const DISMISS_DAYS = 7; // se fechar, não reaparece por 7 dias

const KEY_SUBSCRIBED = 'sp_newsletter_subscribed';
const KEY_DISMISSED = 'sp_newsletter_dismissed_at';

// Rotas onde NÃO mostramos (não interromper conversão/login; evita interstitial na entrada)
const SUPPRESSED_PREFIXES = [
  '/admin',
  '/pos',
  '/checkout',
  '/pagamento',
  '/carrinho',
  '/login',
  '/cadastro',
  '/admin-login',
  '/verificar-email',
];

function shouldSuppress(pathname: string): boolean {
  return SUPPRESSED_PREFIXES.some(
    p => pathname === p || pathname.startsWith(p + '/'),
  );
}

function alreadyHandled(): boolean {
  try {
    if (localStorage.getItem(KEY_SUBSCRIBED) === '1') return true;
    const dismissedAt = localStorage.getItem(KEY_DISMISSED);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return true;
    }
  } catch {
    // localStorage indisponível — não força o modal
    return true;
  }
  return false;
}

export default function NewsletterModalTrigger() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [armed, setArmed] = useState(false);

  // Decide se o gatilho deve "armar" nesta rota
  useEffect(() => {
    if (shouldSuppress(pathname) || alreadyHandled()) {
      setArmed(false);
      return;
    }
    setArmed(true);
  }, [pathname]);

  // Gatilhos: delay, scroll e exit-intent
  useEffect(() => {
    if (!armed || isOpen) return;

    let done = false;
    const open = () => {
      if (done) return;
      done = true;
      setIsOpen(true);
    };

    const timer = setTimeout(open, DELAY_MS);

    const onScroll = () => {
      const scrolled =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight || 1);
      if (scrolled >= SCROLL_THRESHOLD) open();
    };

    const onMouseLeave = (e: MouseEvent) => {
      // exit-intent (desktop): mouse sai pelo topo da janela
      if (e.clientY <= 0) open();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [armed, isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setArmed(false);
    try {
      localStorage.setItem(KEY_DISMISSED, String(Date.now()));
    } catch {}
  };

  const handleSuccess = () => {
    try {
      localStorage.setItem(KEY_SUBSCRIBED, '1');
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <NewsletterModal
      isOpen={isOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
}
