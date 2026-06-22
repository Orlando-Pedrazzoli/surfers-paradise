// 📄 src/lib/services/fraudProtection.ts
// Camada de antifraude da aplicação (complementa o antifraude nativo da Pagar.me).
// Valores em REAIS (mesma unidade de Order.total).

import { isDisposableEmail } from '@/lib/utils/disposableEmails';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';

export interface FraudCheckParams {
  email: string;
  cpf?: string;
  ip?: string;
  amount: number; // em reais
}

export interface FraudCheckResult {
  passed: boolean;
  score: number; // 0–100 (quanto maior, mais arriscado)
  reasons: string[];
}

const BLOCK_THRESHOLD = 70;
const HIGH_AMOUNT = 8000;
const VELOCITY_WINDOW_MS = 30 * 60 * 1000; // 30 min

/** Valida CPF pelos dígitos verificadores. */
function isValidCPF(raw: string): boolean {
  const cpf = (raw || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
}

export async function checkFraud(
  params: FraudCheckParams,
): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let score = 0;

  // 1. E-mail descartável
  if (isDisposableEmail(params.email)) {
    reasons.push('E-mail descartável');
    score += 60;
  }

  // 2. CPF inválido
  if (params.cpf && !isValidCPF(params.cpf)) {
    reasons.push('CPF inválido');
    score += 70;
  }

  // 3. Velocity check (tentativas e falhas recentes do mesmo e-mail/IP)
  try {
    await connectDB();
    const since = new Date(Date.now() - VELOCITY_WINDOW_MS);

    const identityOr: Record<string, unknown>[] = [
      { guestEmail: params.email },
      { 'customerSnapshot.email': params.email },
    ];
    if (params.ip) identityOr.push({ ip: params.ip });

    const recentCount = await Order.countDocuments({
      createdAt: { $gte: since },
      $or: identityOr,
    });
    if (recentCount >= 5) {
      reasons.push('Muitas tentativas em curto período');
      score += 50;
    } else if (recentCount >= 3) {
      score += 20;
    }

    const recentFailed = await Order.countDocuments({
      createdAt: { $gte: since },
      'payment.status': 'failed',
      $or: identityOr,
    });
    if (recentFailed >= 3) {
      reasons.push('Múltiplas falhas de pagamento recentes');
      score += 40;
    }
  } catch {
    // Falha de infra não bloqueia a compra
  }

  // 4. Teto de valor (revisão manual em compras muito altas)
  if (params.amount > HIGH_AMOUNT) {
    reasons.push('Valor elevado — sugerido revisar');
    score += 15;
  }

  return { passed: score < BLOCK_THRESHOLD, score, reasons };
}
