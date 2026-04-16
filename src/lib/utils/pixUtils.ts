export function generatePixPayload(params: {
  key: string;
  name: string;
  city: string;
  amount: number;
  txid?: string;
}): string {
  // TODO: Implement full EMV QR code generation
  return `PIX:${params.key}:${params.amount}`;
}

export function formatPixKey(key: string, type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'): string {
  return key;
}
