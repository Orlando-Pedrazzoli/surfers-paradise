// 📄 src/lib/types/payment.ts

export interface PaymentCustomer {
  name: string;
  email: string;
  document: string; // CPF (com ou sem máscara)
  phone?: string;
}

export interface PaymentAddress {
  name?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  phone?: string;
  cpf?: string;
}

export interface PaymentItem {
  productId?: string;
  sku?: string;
  name: string;
  slug?: string;
  image?: string;
  variant?: string;
  quantity: number;
  price: number; // REAIS, unitário cheio
}

export interface CheckoutShipping {
  method?: string;
  carrier?: string;
  estimatedDays?: number;
  melhorEnvioId?: string;
}

export interface CheckoutRequestBase {
  userId?: string;
  customer: PaymentCustomer;
  shippingAddress: PaymentAddress;
  items: PaymentItem[];
  shippingCost: number;
  shipping?: CheckoutShipping;
  coupon?: string;
  couponDiscount?: number; // REAIS
}

export interface CardCheckoutRequest extends CheckoutRequestBase {
  cardToken: string;
  paymentMethodId: string; // id do MP resolvido pelo BIN (visa, debvisa…)
  cardType?: 'credit_card' | 'debit_card';
  cardBrand?: string;
  cardLast4?: string;
  installments: number;
  deviceId?: string;
}

export interface PixResult {
  qrCode: string; // copia-e-cola (EMV)
  qrCodeUrl: string; // imagem do QR
  expiresAt?: string;
}

export interface BoletoResult {
  url: string;
  pdf?: string;
  line: string; // linha digitável
  barcode: string;
  dueAt?: string;
}

export interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  total?: number;
  installments?: number;
  pix?: PixResult;
  boleto?: BoletoResult;
  error?: string;
  // Recusa de cartão (paymentStatus 'failed')
  failureCode?: string; // status_detail do MP
  failureMessage?: string; // mensagem para o cliente
  retryable?: boolean;
  attempts?: number;
}
