import { isDisposableEmail } from '@/lib/utils/disposableEmails';

interface FraudCheckResult {
  passed: boolean;
  reason?: string;
}

export async function checkFraud(params: {
  email: string;
  ip?: string;
  cpf?: string;
  amount: number;
}): Promise<FraudCheckResult> {
  if (isDisposableEmail(params.email)) {
    return { passed: false, reason: 'E-mail descartavel nao permitido' };
  }
  // TODO: Add more fraud checks
  return { passed: true };
}
