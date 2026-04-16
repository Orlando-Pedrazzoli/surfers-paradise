interface ShippingQuote {
  id: number;
  name: string;
  price: number;
  deliveryDays: number;
  company: string;
}

interface ShippingParams {
  cepOrigem: string;
  cepDestino: string;
  weight: number;
  height: number;
  width: number;
  length: number;
}

export async function calculateShipping(params: ShippingParams): Promise<ShippingQuote[]> {
  // TODO: Integrate with Melhor Envio API
  console.log('[Melhor Envio Stub] Calculating shipping for CEP:', params.cepDestino);
  return [
    { id: 1, name: 'PAC', price: 25.90, deliveryDays: 8, company: 'Correios' },
    { id: 2, name: 'SEDEX', price: 45.90, deliveryDays: 3, company: 'Correios' },
  ];
}

export async function generateLabel(shipmentId: string): Promise<string | null> {
  // TODO: Implement label generation
  console.log('[Melhor Envio Stub] Generating label for:', shipmentId);
  return null;
}
