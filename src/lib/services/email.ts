import nodemailer from 'nodemailer';
import { company } from '@/lib/config/company';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

// Transporter SMTP — configure as variáveis no .env.local:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=seu-email@gmail.com
//   SMTP_PASS=senha-de-app   (App Password do Gmail, NÃO a senha normal)
//   EMAIL_FROM="Surfers Paradise <seu-email@gmail.com>"   (opcional)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM =
  process.env.EMAIL_FROM ||
  `${company.name} <${process.env.SMTP_USER || company.email}>`;

export async function sendEmail({
  to,
  subject,
  html,
}: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(
        `[Email] SMTP não configurado (SMTP_USER/SMTP_PASS ausentes). Email não enviado: "${subject}"`,
      );
      return false;
    }
    await transporter.sendMail({ from: FROM, to, subject, html });
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
    html: `<p>Seu código: <strong>${code}</strong></p>`,
  });
}

export async function sendOrderConfirmation(
  to: string,
  orderId: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Pedido Confirmado #${orderId} - Surfers Paradise`,
    html: `<p>Seu pedido #${orderId} foi confirmado!</p>`,
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
