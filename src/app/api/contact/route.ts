// 📄 src/app/api/contact/route.ts
// Recebe o formulário de contato do site e encaminha para o e-mail da loja
// (ADMIN_EMAIL ou company.email) via Resend, com Reply-To no e-mail do
// cliente. Envia também confirmação automática ao cliente.
//
// Anti-spam em camadas:
//   • honeypot ("website"): campo invisível — preenchido = bot → responde
//     sucesso FALSO (não ensina o bot a contornar) e não envia nada;
//   • rate limit best-effort em memória por IP (3 envios / 10 min) —
//     em serverless vale por instância, mas corta rajadas do mesmo pod;
//   • limites de tamanho por campo + e-mail descartável bloqueado.
//
// Envio AGUARDADO (await): na Vercel, promises pendentes após a resposta
// são congeladas — fire-and-forget faria a mensagem morrer silenciosamente
// (mesma classe de bug corrigida nos e-mails de pedido). A auto-resposta ao
// cliente roda em paralelo e a falha dela não falha a requisição.

import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/utils/validators';
import { isDisposableEmail } from '@/lib/utils/disposableEmails';
import { sendContactMessage, sendContactAutoReply } from '@/lib/services/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const LIMITS = {
  name: 100,
  email: 200,
  phone: 30,
  subject: 60,
  orderNumber: 40,
  message: 3000,
} as const;

// Rate limit best-effort por IP (por instância serverless)
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_MAX) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  // Limpeza ocasional para não crescer indefinidamente
  if (hits.size > 1000) {
    for (const [k, v] of hits) {
      if (v.every(t => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Honeypot: humanos nunca veem este campo; preenchido = bot.
    // Sucesso falso de propósito — não dar feedback ao spammer.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json({ success: true });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Muitas mensagens em pouco tempo. Aguarde alguns minutos ou fale conosco pelo WhatsApp.',
        },
        { status: 429 },
      );
    }

    const name = clean(body.name, LIMITS.name);
    const email = clean(body.email, LIMITS.email).toLowerCase();
    const phone = clean(body.phone, LIMITS.phone);
    const subject = clean(body.subject, LIMITS.subject);
    const orderNumber = clean(body.orderNumber, LIMITS.orderNumber);
    const message = clean(body.message, LIMITS.message);

    if (name.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Informe seu nome completo.' },
        { status: 400 },
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'E-mail inválido.' },
        { status: 400 },
      );
    }
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'E-mail descartável não é permitido.' },
        { status: 400 },
      );
    }
    if (message.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Escreva sua mensagem (mínimo 10 caracteres).',
        },
        { status: 400 },
      );
    }

    // AGUARDADO: e-mail à loja é o que importa; auto-resposta em paralelo
    // e a falha dela não falha o pedido do cliente.
    const [storeOk] = await Promise.all([
      sendContactMessage({ name, email, phone, subject, orderNumber, message }),
      sendContactAutoReply(email, name).catch(() => false),
    ]);

    if (!storeOk) {
      console.error('[Contact] falha ao encaminhar mensagem à loja:', email);
      return NextResponse.json(
        {
          success: false,
          error:
            'Não foi possível enviar sua mensagem agora. Tente novamente ou fale conosco pelo WhatsApp.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact] erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar mensagem.' },
      { status: 500 },
    );
  }
}
