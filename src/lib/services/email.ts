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
// v3: NOTIFICAÇÃO DO ADMIN — sendAdminNewOrderNotification avisa a loja
//     (ADMIN_EMAIL ou company.email) de cada pedido pago, com dados do
//     cliente, itens e link direto para o painel.
// v3: sendOrderPaidEmails — consolidador (cliente + admin em paralelo, uma
//     única busca do pedido, nunca lança). É a função que os fluxos de
//     pagamento devem AGUARDAR (await): na Vercel, promises pendentes após
//     a resposta são congeladas — o fire-and-forget original fazia os
//     e-mails morrerem silenciosamente.
// v3: enriquecimento extraído para buildOrderDetailsHtml (reuso).
// v7 (retirada na loja): pedidos com shipping.carrier === 'Retirada na Loja'
//     mostram "Retirada na loja" + endereço da loja + instrução, e a linha
//     de frete vira "Grátis (retirada na loja)".
// v8: FORMULÁRIO DE CONTATO — sendContactMessage (mensagem do site para a
//     loja, com replyTo = e-mail do cliente para responder direto) e
//     sendContactAutoReply (confirmação ao cliente com expectativa de
//     resposta). sendEmail ganhou replyTo opcional (retrocompatível).

import { Resend } from 'resend';
import { company } from '@/lib/config/company';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  /** v8: respostas vão para este endereço (ex.: e-mail do cliente no contato) */
  replyTo?: string;
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
  replyTo,
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
      ...(replyTo ? { replyTo } : {}),
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

/** Pedido lean para composição de e-mails. `any` deliberado: o lean() do
 *  Mongoose com este schema é verboso de tipar e o uso aqui é só leitura. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeanOrder = any;

/** Busca o pedido para enriquecer e-mails. NUNCA lança — devolve null. */
async function fetchOrderLean(orderNumber: string): Promise<LeanOrder | null> {
  try {
    await connectDB();
    return await Order.findOne({ orderNumber }).lean();
  } catch (e) {
    console.error(
      '[Email] falha ao buscar pedido (envia versão simples):',
      orderNumber,
      e,
    );
    return null;
  }
}

/** Tabela de itens + totais + pagamento + endereço/retirada de um pedido. */
function buildOrderDetailsHtml(order: LeanOrder): string {
  const rows = (order.items || [])
    .map(
      (i: {
        name: string;
        variant?: string;
        quantity: number;
        price: number;
      }) => `
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
  // v7: pedido de RETIRADA NA LOJA — shippingAddress contém o endereço
  // da loja; o marcador vem do checkout (shipping.carrier).
  const isPickup = order.shipping?.carrier === 'Retirada na Loja';
  const addressHtml = addr?.street
    ? `
    <p style="margin:16px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
      <strong style="color:#374151;">${isPickup ? 'Retirada na loja' : 'Entrega'}:</strong><br/>
      ${isPickup ? '' : `${addr.name || ''}<br/>`}
      ${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}<br/>
      ${addr.neighborhood} · ${addr.city} - ${addr.state} · CEP ${addr.cep}
      ${isPickup ? '<br/>Retire após a confirmação do pagamento, apresentando documento com foto e o número do pedido.' : ''}
    </p>`
    : '';

  return `
  <table style="width:100%;border-collapse:collapse;margin:8px 0 4px;">
    ${rows}
    <tr>
      <td style="padding:8px 0 2px;color:#6b7280;font-size:13px;">Frete</td>
      <td style="padding:8px 0 2px;color:#6b7280;font-size:13px;text-align:right;">${isPickup ? 'Grátis (retirada na loja)' : brl(order.shippingCost)}</td>
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

/** Monta o e-mail de confirmação do CLIENTE (assunto + html). */
function customerConfirmationEmail(
  orderNumber: string,
  detailsHtml: string,
): Omit<EmailParams, 'to'> {
  const orderUrl = `${company.url}/meus-pedidos`;
  return {
    subject: `Pedido Confirmado #${orderNumber} - Surfers Paradise`,
    html: shell(`
      <div style="padding:32px 28px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Pedido confirmado! 🤙</h2>
        <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
          Recebemos o pagamento do seu pedido <strong>#${orderNumber}</strong>.
          Vamos preparar tudo e te avisamos quando for despachado.
        </p>
        ${detailsHtml}
        <div style="text-align:center;margin:28px 0 0;">
          <a href="${orderUrl}" style="display:inline-block;background:#FF6600;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;">
            Acompanhar pedido
          </a>
        </div>
      </div>`),
  };
}

/** Monta o e-mail de novo pedido para o ADMIN (assunto + html). */
function adminNewOrderEmail(
  orderNumber: string,
  order: LeanOrder | null,
  detailsHtml: string,
): Omit<EmailParams, 'to'> {
  const c = order?.customerSnapshot;
  const isPickup = order?.shipping?.carrier === 'Retirada na Loja';
  const adminUrl = order?._id
    ? `${company.url}/admin/pedidos/${String(order._id)}`
    : `${company.url}/admin/pedidos`;

  const customerHtml = c
    ? `
    <p style="margin:0 0 16px;color:#4b5563;font-size:13px;line-height:1.7;">
      <strong style="color:#374151;">Cliente:</strong> ${c.name || '-'}<br/>
      <strong style="color:#374151;">E-mail:</strong> ${c.email || order?.guestEmail || '-'}<br/>
      <strong style="color:#374151;">WhatsApp:</strong> ${c.phone || '-'}<br/>
      <strong style="color:#374151;">CPF:</strong> ${c.cpf || '-'}
    </p>`
    : '';

  const pickupBanner = isPickup
    ? `
    <p style="margin:0 0 16px;padding:10px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;color:#92400e;font-size:13px;">
      🏬 <strong>Retirada na loja</strong> — não gerar etiqueta de envio.
    </p>`
    : '';

  return {
    subject: `💰 Novo pedido pago #${orderNumber}${order?.total != null ? ` · ${brl(order.total)}` : ''} - Surfers Paradise`,
    html: shell(`
      <div style="padding:32px 28px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Venda confirmada! 💰</h2>
        <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
          O pedido <strong>#${orderNumber}</strong> foi pago e está pronto para ser preparado.
        </p>
        ${pickupBanner}
        ${customerHtml}
        ${detailsHtml}
        <div style="text-align:center;margin:28px 0 0;">
          <a href="${adminUrl}" style="display:inline-block;background:#1A1A1A;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;">
            Abrir no painel
          </a>
        </div>
      </div>`),
  };
}

/** Destinatário das notificações da loja (env ADMIN_EMAIL > company.email). */
const ADMIN_TO = process.env.ADMIN_EMAIL || company.email;

/**
 * E-mail de pedido confirmado (pagamento aprovado) — CLIENTE.
 * Busca o pedido pelo orderNumber para incluir itens, totais e endereço.
 * Se não encontrar (ou falhar a busca), envia a versão simples — o e-mail
 * NUNCA deixa de sair por causa do enriquecimento.
 */
export async function sendOrderConfirmation(
  to: string,
  orderId: string, // orderNumber (ex: WEB260707-1234)
): Promise<boolean> {
  const order = await fetchOrderLean(orderId);
  const detailsHtml = order ? buildOrderDetailsHtml(order) : '';
  return sendEmail({ to, ...customerConfirmationEmail(orderId, detailsHtml) });
}

/**
 * E-mail de novo pedido pago — ADMIN (loja).
 * Destinatário: ADMIN_EMAIL (env) ou company.email.
 */
export async function sendAdminNewOrderNotification(
  orderNumber: string,
): Promise<boolean> {
  const order = await fetchOrderLean(orderNumber);
  const detailsHtml = order ? buildOrderDetailsHtml(order) : '';
  return sendEmail({
    to: ADMIN_TO,
    ...adminNewOrderEmail(orderNumber, order, detailsHtml),
  });
}

/**
 * CONSOLIDADOR: cliente + admin notificados de um pedido PAGO, com UMA
 * busca no banco e envios em paralelo. NUNCA lança (falha de e-mail não
 * pode derrubar webhook/checkout). DEVE ser chamado com await — na Vercel,
 * promises pendentes após a resposta HTTP são congeladas e nunca executam.
 */
export async function sendOrderPaidEmails(
  customerEmail: string | null | undefined,
  orderNumber: string,
): Promise<{ customer: boolean; admin: boolean }> {
  try {
    const order = await fetchOrderLean(orderNumber);
    const detailsHtml = order ? buildOrderDetailsHtml(order) : '';

    const [customer, admin] = await Promise.all([
      customerEmail
        ? sendEmail({
            to: customerEmail,
            ...customerConfirmationEmail(orderNumber, detailsHtml),
          })
        : Promise.resolve(false),
      sendEmail({
        to: ADMIN_TO,
        ...adminNewOrderEmail(orderNumber, order, detailsHtml),
      }),
    ]);

    if (!customerEmail) {
      console.error('[Email] pedido pago sem e-mail de cliente:', orderNumber);
    }
    if (customerEmail && !customer) {
      console.error('[Email] confirmação ao CLIENTE falhou:', orderNumber);
    }
    if (!admin) {
      console.error('[Email] notificação ao ADMIN falhou:', orderNumber);
    }
    return { customer, admin };
  } catch (e) {
    // Rede de segurança absoluta — nunca propagar para o fluxo de pagamento
    console.error('[Email] sendOrderPaidEmails falhou:', orderNumber, e);
    return { customer: false, admin: false };
  }
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

// ───────────────────────── Formulário de contato ─────────────────────────

export interface ContactMessageInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  orderNumber?: string;
  message: string;
}

const esc = (v: string) =>
  v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Mensagem do formulário de contato → LOJA (ADMIN_EMAIL ou company.email).
 * replyTo = e-mail do cliente: responder no próprio cliente de e-mail já
 * abre a conversa com a pessoa certa.
 */
export async function sendContactMessage(
  input: ContactMessageInput,
): Promise<boolean> {
  const rows = [
    ['Nome', input.name],
    ['E-mail', input.email],
    input.phone ? ['WhatsApp', input.phone] : null,
    input.subject ? ['Assunto', input.subject] : null,
    input.orderNumber ? ['Nº do pedido', input.orderNumber] : null,
  ]
    .filter((r): r is [string, string] => !!r)
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;"><strong style="color:#374151;">${k}</strong></td>
        <td style="padding:6px 0;color:#374151;font-size:13px;">${esc(v)}</td>
      </tr>`,
    )
    .join('');

  return sendEmail({
    to: process.env.ADMIN_EMAIL || company.email,
    replyTo: input.email,
    subject: `📩 Contato pelo site${input.subject ? ` — ${input.subject}` : ''} · ${input.name}`,
    html: shell(`
      <div style="padding:32px 28px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Nova mensagem pelo site</h2>
        <table style="border-collapse:collapse;margin:0 0 16px;">${rows}</table>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
          <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;white-space:pre-wrap;">${esc(input.message)}</p>
        </div>
        <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
          Responda este e-mail para falar diretamente com ${esc(input.name)} (Reply-To configurado).
        </p>
      </div>`),
  });
}

/**
 * Confirmação automática ao CLIENTE que enviou o formulário — define a
 * expectativa de resposta e oferece o WhatsApp para urgências.
 */
export async function sendContactAutoReply(
  to: string,
  name: string,
): Promise<boolean> {
  const firstName = name.trim().split(' ')[0] || '';
  return sendEmail({
    to,
    subject: 'Recebemos sua mensagem! - Surfers Paradise',
    html: shell(`
      <div style="padding:32px 28px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Mensagem recebida${firstName ? `, ${esc(firstName)}` : ''}! 🤙</h2>
        <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
          Sua mensagem chegou na nossa equipe. Respondemos em até
          <strong>1 dia útil</strong>, dentro do nosso horário de atendimento
          (${company.businessHours}).
        </p>
        <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
          Precisa de resposta rápida? Chama a gente no WhatsApp:
        </p>
        <div style="text-align:center;">
          <a href="https://wa.me/${company.whatsapp}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;">
            WhatsApp ${company.phone}
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
