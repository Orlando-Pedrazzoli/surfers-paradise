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
  installments: number;
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
}
