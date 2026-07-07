// 📄 src/lib/services/otp.ts
// OTP de verificação de e-mail — implementação real (substitui o stub).
//
// Regras:
// - Código de 6 dígitos gerado com crypto.randomInt (não Math.random).
// - Armazenado como sha256(code:email:OTP_SECRET) — nunca em claro.
// - Expira em 10 minutos (EXPIRY_MINUTES).
// - Máximo 5 tentativas erradas → código invalidado.
// - Cooldown de 60s entre reenvios para o mesmo e-mail.
// - Uso único: verificação bem-sucedida apaga o doc.
//
// Env opcional: OTP_SECRET (fallback para NEXTAUTH_SECRET).

import crypto from 'crypto';
import connectDB from '@/lib/db/connect';
import OtpVerification from '@/lib/models/OtpVerification';
import { sendOtpEmail } from '@/lib/services/email';

const EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function getSecret(): string {
  const secret = process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('OTP_SECRET/NEXTAUTH_SECRET não configurado.');
  }
  return secret;
}

function hashCode(code: string, email: string): string {
  return crypto
    .createHash('sha256')
    .update(`${code}:${email.toLowerCase()}:${getSecret()}`)
    .digest('hex');
}

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString(); // 6 dígitos, CSPRNG
}

export type OtpSendResult =
  | { ok: true }
  | { ok: false; error: string; retryInSeconds?: number };

/**
 * Gera, persiste (upsert) e envia o OTP por e-mail.
 * Respeita cooldown de reenvio.
 */
export async function createAndSendOtp(
  rawEmail: string,
): Promise<OtpSendResult> {
  const email = rawEmail.trim().toLowerCase();
  await connectDB();

  const existing = await OtpVerification.findOne({ email });
  if (existing) {
    const elapsed = (Date.now() - existing.lastSentAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const retryInSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      return {
        ok: false,
        error: `Aguarde ${retryInSeconds}s para reenviar o código.`,
        retryInSeconds,
      };
    }
  }

  const code = generateOtpCode();
  const now = new Date();

  await OtpVerification.findOneAndUpdate(
    { email },
    {
      email,
      codeHash: hashCode(code, email),
      expiresAt: new Date(now.getTime() + EXPIRY_MINUTES * 60_000),
      attempts: 0,
      lastSentAt: now,
    },
    { upsert: true, new: true },
  );

  const sent = await sendOtpEmail(email, code);
  if (!sent) {
    return {
      ok: false,
      error: 'Não foi possível enviar o e-mail. Tente novamente.',
    };
  }
  return { ok: true };
}

export type OtpVerifyResult = { ok: true } | { ok: false; error: string };

/**
 * Verifica o código. Uso único: sucesso apaga o doc.
 * Comparação em tempo constante; tentativas erradas contam até invalidar.
 */
export async function verifyOtp(
  rawEmail: string,
  code: string,
): Promise<OtpVerifyResult> {
  const email = rawEmail.trim().toLowerCase();
  const normalized = (code || '').trim();

  if (!/^\d{6}$/.test(normalized)) {
    return { ok: false, error: 'Código inválido.' };
  }

  await connectDB();

  const doc = await OtpVerification.findOne({ email });
  if (!doc) {
    return {
      ok: false,
      error: 'Código expirado ou inexistente. Solicite um novo.',
    };
  }
  if (doc.expiresAt.getTime() < Date.now()) {
    await OtpVerification.deleteOne({ _id: doc._id });
    return { ok: false, error: 'Código expirado. Solicite um novo.' };
  }
  if (doc.attempts >= MAX_ATTEMPTS) {
    await OtpVerification.deleteOne({ _id: doc._id });
    return {
      ok: false,
      error: 'Muitas tentativas. Solicite um novo código.',
    };
  }

  const expected = Buffer.from(doc.codeHash, 'hex');
  const received = Buffer.from(hashCode(normalized, email), 'hex');
  const match =
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received);

  if (!match) {
    // Incremento atômico da tentativa errada
    await OtpVerification.updateOne(
      { _id: doc._id },
      { $inc: { attempts: 1 } },
    );
    const remaining = MAX_ATTEMPTS - doc.attempts - 1;
    return {
      ok: false,
      error:
        remaining > 0
          ? `Código incorreto. ${remaining} tentativa(s) restante(s).`
          : 'Código incorreto. Solicite um novo código.',
    };
  }

  // Uso único
  await OtpVerification.deleteOne({ _id: doc._id });
  return { ok: true };
}
