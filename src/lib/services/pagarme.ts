interface PagarmeOrderParams {
  amount: number;
  customerId: string;
  paymentMethod: 'credit_card' | 'boleto' | 'pix';
  items: Array<{ name: string; quantity: number; amount: number }>;
}

interface PagarmeOrderResult {
  id: string;
  status: string;
  charges: Array<{ id: string; status: string }>;
}

export async function createOrder(params: PagarmeOrderParams): Promise<PagarmeOrderResult | null> {
  // TODO: Implement Pagar.me V5 API
  console.log('[Pagar.me Stub] Creating order:', params.paymentMethod);
  return null;
}

export async function getOrder(orderId: string): Promise<PagarmeOrderResult | null> {
  console.log('[Pagar.me Stub] Getting order:', orderId);
  return null;
}

export function validateWebhookSignature(body: string, signature: string): boolean {
  // TODO: Validate HMAC signature
  return false;
}
