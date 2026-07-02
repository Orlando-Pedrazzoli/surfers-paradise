// 📄 src/lib/services/email.ts
// Envio de e-mails transacionais via Resend.
// Env: RESEND_API_KEY, EMAIL_FROM (ex: "Surfers Paradise <noreply@send.surfersparadise.com.br>")
// Mesmas exports da versão nodemailer — nenhum consumidor precisa mudar.

import { Resend } from 'resend';
import { company } from '@/lib/config/company';

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

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Código de Verificação - Surfers Paradise',
    html: `
    <div style="background:#f4f4f4;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
        <div style="background:#1A1A1A;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:1px;">SURFERS PARADISE</h1>
        </div>
        <div style="padding:32px 28px;text-align:center;">
          <p style="margin:0 0 16px;color:#4b5563;font-size:15px;">Seu código de verificação:</p>
          <div style="display:inline-block;background:#FFF7F0;border:2px dashed #FF6600;border-radius:12px;padding:16px 32px;">
            <span style="font-size:32px;font-weight:800;color:#FF6600;letter-spacing:8px;">${code}</span>
          </div>
          <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">
            O código expira em alguns minutos. Se você não solicitou, ignore este e-mail.
          </p>
        </div>
      </div>
    </div>`,
  });
}

export async function sendOrderConfirmation(
  to: string,
  orderId: string,
): Promise<boolean> {
  const orderUrl = `${company.url}/meus-pedidos`;
  return sendEmail({
    to,
    subject: `Pedido Confirmado #${orderId} - Surfers Paradise`,
    html: `
    <div style="background:#f4f4f4;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
        <div style="background:#1A1A1A;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:1px;">SURFERS PARADISE</h1>
        </div>
        <div style="padding:32px 28px;">
          <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Pedido confirmado! 🤙</h2>
          <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
            Recebemos o pagamento do seu pedido <strong>#${orderId}</strong>.
            Vamos preparar tudo e te avisamos quando for despachado.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${orderUrl}" style="display:inline-block;background:#FF6600;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;">
              Acompanhar pedido
            </a>
          </div>
        </div>
        <div style="background:#fafafa;padding:18px 24px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">
            ${company.name} · ${company.email} · ${company.whatsapp}
          </p>
        </div>
      </div>
    </div>`,
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

  const html = `
  <div style="background:#f4f4f4;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background:#1A1A1A;padding:28px 24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">SURFERS PARADISE</h1>
        <p style="margin:6px 0 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:2px;">${company.slogan}</p>
      </div>
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
      </div>
      <div style="background:#fafafa;padding:18px 24px;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:11px;">
          ${company.name} · ${company.email} · ${company.whatsapp}
        </p>
      </div>
    </div>
  </div>`;

  return sendEmail({
    to,
    subject: `🎁 Seu cupom de ${discountPercent}% OFF chegou! - Surfers Paradise`,
    html,
  });
}
