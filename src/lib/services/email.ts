// 📄 src/lib/services/email.ts
// Envio de e-mails transacionais via Resend.
// Env: RESEND_API_KEY, EMAIL_FROM (ex: "Surfers Paradise <noreply@send.surfersparadise.com.br>")
// Mesmas exports da versão nodemailer — nenhum consumidor precisa mudar.
//
// v2: sendOrderConfirmation enriquecido — busca o pedido pelo orderNumber e
//     inclui itens, totais, forma de pagamento e endereço (assinatura
//     inalterada; webhook/checkout/status não mudam). Se o pedido não for
//     encontrado, cai no e-mail simples (nunca deixa de enviar).
// v2: sendOrderStatusUpdate — e-mail de pedido enviado/entregue/cancelado
//     com código de rastreio (ligar na rota admin de atualização de status).
// v2: EMAIL_FROM ausente em produção agora LOGA ERRO — o fallback
//     onboarding@resend.dev só entrega para o dono da conta Resend, ou seja,
//     clientes não receberiam nada, silenciosamente.

import { Resend } from 'resend';
import { company } from '@/lib/config/company';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM =
  process.env.EMAIL_FROM || `${company.name} <onboarding@resend.dev>`;

if (!process.env.EMAIL_FROM && process.env.NODE_ENV === 'production') {
  console.error(
    '[Email] EMAIL_FROM ausente em PRODUÇÃO — e-mails cairão no fallback onboarding@resend.dev, que NÃO entrega para clientes. Configure na Vercel.',
  );
}

const brl = (v: number) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PAYMENT_LABEL: Record<string, string> = {
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  pix: 'PIX',
  boleto: 'Boleto',
  cash: 'Dinheiro',
};

export async function sendEmail({
  to,
  subject,
  html,
}: EmailParams): Promise<boolean> {
  try {
    if (!resend) {
      console.warn(
        `[Email] RESEND_API_KEY ausente. Email não enviado: "${subject}"`,
      );
      return false;
    }

    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Resend retornou erro:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar:', error);
    return false;
  }
}

// ───────────────────────── Layout compartilhado ─────────────────────────

function shell(content: string, width = 600): string {
  return `
  <div style="background:#f4f4f4;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:${width}px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background:#1A1A1A;padding:24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:1px;">SURFERS PARADISE</h1>
      </div>
      ${content}
      <div style="background:#fafafa;padding:18px 24px;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:11px;">
          ${company.name} · ${company.email} · ${company.whatsapp}
        </p>
      </div>
    </div>
  </div>`;
}

// ───────────────────────── OTP ─────────────────────────

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Código de Verificação - Surfers Paradise',
    html: shell(
      `
      <div style="padding:32px 28px;text-align:center;">
        <p style="margin:0 0 16px;color:#4b5563;font-size:15px;">Seu código de verificação:</p>
        <div style="display:inline-block;background:#FFF7F0;border:2px dashed #FF6600;border-radius:12px;padding:16px 32px;">
          <span style="font-size:32px;font-weight:800;color:#FF6600;letter-spacing:8px;">${code}</span>
        </div>
        <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">
          O código expira em alguns minutos. Se você não solicitou, ignore este e-mail.
        </p>
      </div>`,
      480,
    ),
  });
}

// ───────────────────────── Confirmação de pedido ─────────────────────────

/**
 * E-mail de pedido confirmado (pagamento aprovado).
 * Busca o pedido pelo orderNumber para incluir itens, totais e endereço.
 * Se não encontrar (ou falhar a busca), envia a versão simples — o e-mail
 * NUNCA deixa de sair por causa do enriquecimento.
 */
export async function sendOrderConfirmation(
  to: string,
  orderId: string, // orderNumber (ex: WEB260707-1234)
): Promise<boolean> {
  const orderUrl = `${company.url}/meus-pedidos`;

  let detailsHtml = '';
  try {
    await connectDB();
    const order = await Order.findOne({ orderNumber: orderId }).lean();
    if (order) {
      const rows = (order.items || [])
        .map(
          i => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#374151;font-size:13px;">
              ${i.name}${i.variant ? ` <span style="color:#9ca3af;">(${i.variant})</span>` : ''}
              <span style="color:#9ca3af;"> × ${i.quantity}</span>
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#374151;font-size:13px;text-align:right;white-space:nowrap;">
              ${brl(i.price * i.quantity)}
            </td>
          </tr>`,
        )
        .join('');

      const addr = order.shippingAddress;
      const addressHtml = addr?.street
        ? `
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          <strong style="color:#374151;">Entrega:</strong><br/>
          ${addr.name || ''}<br/>
          ${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}<br/>
          ${addr.neighborhood} · ${addr.city} - ${addr.state} · CEP ${addr.cep}
        </p>`
        : '';

      detailsHtml = `
      <table style="width:100%;border-collapse:collapse;margin:8px 0 4px;">
        ${rows}
        <tr>
          <td style="padding:8px 0 2px;color:#6b7280;font-size:13px;">Frete</td>
          <td style="padding:8px 0 2px;color:#6b7280;font-size:13px;text-align:right;">${brl(order.shippingCost)}</td>
        </tr>
        ${
          order.discount > 0
            ? `<tr>
          <td style="padding:2px 0;color:#16a34a;font-size:13px;">Desconto${order.coupon ? ` (${order.coupon})` : ''}</td>
          <td style="padding:2px 0;color:#16a34a;font-size:13px;text-align:right;">- ${brl(order.discount)}</td>
        </tr>`
            : ''
        }
        <tr>
          <td style="padding:10px 0 0;color:#111827;font-size:15px;font-weight:700;">Total</td>
          <td style="padding:10px 0 0;color:#111827;font-size:15px;font-weight:700;text-align:right;">${brl(order.total)}</td>
        </tr>
      </table>
      <p style="margin:8px 0 0;color:#6b7280;font-size:12px;">
        Pagamento: ${PAYMENT_LABEL[order.payment?.method || ''] || order.payment?.method || '-'}
        ${order.payment?.installments && order.payment.installments > 1 ? ` em ${order.payment.installments}x` : ''}
      </p>
      ${addressHtml}`;
    }
  } catch (e) {
    console.error(
      '[Email] falha ao enriquecer confirmação (envia versão simples):',
      e,
    );
  }

  return sendEmail({
    to,
    subject: `Pedido Confirmado #${orderId} - Surfers Paradise`,
    html: shell(`
      <div style="padding:32px 28px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Pedido confirmado! 🤙</h2>
        <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
          Recebemos o pagamento do seu pedido <strong>#${orderId}</strong>.
          Vamos preparar tudo e te avisamos quando for despachado.
        </p>
        ${detailsHtml}
        <div style="text-align:center;margin:28px 0 0;">
          <a href="${orderUrl}" style="display:inline-block;background:#FF6600;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;">
            Acompanhar pedido
          </a>
        </div>
      </div>`),
  });
}

// ───────────────────────── Atualização de status ─────────────────────────

type NotifiableStatus = 'shipped' | 'delivered' | 'cancelled';

const STATUS_COPY: Record<
  NotifiableStatus,
  { subject: string; title: string; body: string }
> = {
  shipped: {
    subject: 'Seu pedido foi enviado! 📦',
    title: 'Pedido a caminho! 📦',
    body: 'Seu pedido <strong>#{{order}}</strong> foi despachado e está a caminho.',
  },
  delivered: {
    subject: 'Pedido entregue! 🤙',
    title: 'Pedido entregue!',
    body: 'Seu pedido <strong>#{{order}}</strong> foi entregue. Aproveite! Que tal avaliar os produtos na sua conta?',
  },
  cancelled: {
    subject: 'Pedido cancelado',
    title: 'Pedido cancelado',
    body: 'Seu pedido <strong>#{{order}}</strong> foi cancelado. Se você não solicitou o cancelamento ou tem dúvidas, fale com a gente.',
  },
};

/**
 * E-mail de mudança de status do pedido — ligar na rota admin que atualiza
 * o status (shipped inclui o código de rastreio quando disponível).
 */
export async function sendOrderStatusUpdate(
  to: string,
  orderNumber: string,
  status: NotifiableStatus,
  trackingCode?: string,
): Promise<boolean> {
  const copy = STATUS_COPY[status];
  if (!copy) return false;

  const trackingHtml =
    status === 'shipped' && trackingCode
      ? `
      <div style="text-align:center;margin:20px 0;">
        <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">Código de rastreio:</p>
        <div style="display:inline-block;background:#FFF7F0;border:2px dashed #FF6600;border-radius:10px;padding:12px 24px;">
          <span style="font-size:18px;font-weight:800;color:#FF6600;letter-spacing:2px;">${trackingCode}</span>
        </div>
      </div>`
      : '';

  return sendEmail({
    to,
    subject: `${copy.subject} Pedido #${orderNumber} - Surfers Paradise`,
    html: shell(`
      <div style="padding:32px 28px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">${copy.title}</h2>
        <p style="margin:0 0 8px;color:#4b5563;font-size:15px;line-height:1.6;">
          ${copy.body.replace('{{order}}', orderNumber)}
        </p>
        ${trackingHtml}
        <div style="text-align:center;margin:24px 0 0;">
          <a href="${company.url}/meus-pedidos" style="display:inline-block;background:#FF6600;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;">
            Ver meu pedido
          </a>
        </div>
      </div>`),
  });
}

// ═══════════════════════════════════════════════════════════════
// Newsletter — email de boas-vindas com cupom de desconto
// ═══════════════════════════════════════════════════════════════
export async function sendNewsletterWelcome(
  to: string,
  name: string,
  couponCode: string,
  discountPercent: number,
  validUntil: Date,
): Promise<boolean> {
  const greeting = name ? `Olá ${name},` : 'Olá,';
  const validUntilStr = validUntil.toLocaleDateString('pt-BR');
  const shopUrl = `${company.url}/produtos`;

  return sendEmail({
    to,
    subject: `🎁 Seu cupom de ${discountPercent}% OFF chegou! - Surfers Paradise`,
    html: shell(`
      <div style="padding:32px 28px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">${greeting} bem-vindo(a)!</h2>
        <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
          Obrigado por assinar nossa newsletter. Como combinado, aqui está o seu cupom de
          <strong>${discountPercent}% de desconto</strong> na primeira compra:
        </p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;border:2px dashed #FF6600;border-radius:12px;padding:18px 32px;background:#FFF7F0;">
            <span style="font-size:28px;font-weight:800;color:#FF6600;letter-spacing:3px;">${couponCode}</span>
          </div>
        </div>
        <p style="margin:0 0 24px;color:#6b7280;font-size:13px;text-align:center;">
          Válido até <strong>${validUntilStr}</strong> · uso único · aplique no carrinho
        </p>
        <div style="text-align:center;">
          <a href="${shopUrl}" style="display:inline-block;background:#FF6600;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;">
            Comprar agora
          </a>
        </div>
      </div>`),
  });
}
