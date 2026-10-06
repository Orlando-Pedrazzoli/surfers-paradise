// 📄 src/components/ui/HoverPrefetchLink.tsx
// ═══════════════════════════════════════════════════════════════════════
// Link que só faz prefetch quando o visitante mostra intenção
// (hover, toque ou foco) — substitui o next/link na loja.
// ═══════════════════════════════════════════════════════════════════════
// 🔧 06/10/2026 — FIX consumo Vercel
//
// O next/link faz prefetch de TODOS os links assim que entram no ecrã.
// As métricas mostraram que, num só dia (03/10), 28 511 dos 38 867 pedidos
// do site eram prefetches disparados por um crawler que executa JavaScript
// (meta-externalagent): cada página aberta gerava ~20 pedidos extra para
// produtos, categorias, rodapé e área de conta, e milhares de invocações
// de função por dia.
//
// Este componente é o padrão recomendado na documentação do Next.js
// ("Hover-triggered prefetch"): começa com prefetch desligado e volta ao
// comportamento normal do Next quando o rato passa por cima, o dedo toca
// ou o link recebe foco. Para o cliente a navegação continua rápida.
//
// Uso: é um substituto direto — basta trocar o import:
//   import Link from '@/components/ui/HoverPrefetchLink';
// Aceita exatamente as mesmas props do next/link. `prefetch={false}`
// continua a desligar o prefetch por completo.
// ═══════════════════════════════════════════════════════════════════════
'use client';

import NextLink from 'next/link';
import { useState, type ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof NextLink>;

export default function HoverPrefetchLink({
  prefetch,
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...rest
}: LinkProps) {
  const [intent, setIntent] = useState(false);

  return (
    <NextLink
      {...rest}
      prefetch={prefetch === false ? false : intent ? (prefetch ?? null) : false}
      onMouseEnter={event => {
        setIntent(true);
        onMouseEnter?.(event);
      }}
      onTouchStart={event => {
        setIntent(true);
        onTouchStart?.(event);
      }}
      onFocus={event => {
        setIntent(true);
        onFocus?.(event);
      }}
    />
  );
}
