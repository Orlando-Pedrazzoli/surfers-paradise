import { Types } from 'mongoose';

// Métodos de pagamento expandidos para POS + online
export type PaymentMethod =
  | 'credit_card' // Cartão de crédito (online + balcão)
  | 'debit_card' // Cartão de débito (balcão)
  | 'boleto' // Boleto (online)
  | 'pix' // PIX (online + balcão)
  | 'cash'; // Dinheiro (balcão)

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderStatus =
  | 'pending' // Aguardando pagamento (online)
  | 'confirmed' // Pagamento confirmado
  | 'processing' // Preparando (online)
  | 'shipped' // Enviado (online)
  | 'delivered' // Entregue / Finalizada balcão
  | 'cancelled'; // Cancelado

// Canal de venda — Unified Commerce
export type OrderChannel = 'online' | 'pos';

export interface IOrderItem {
  product: Types.ObjectId;
  sku: string;
  name: string;
  slug: string;
  image: string;
  variant?: string;
  quantity: number;
  price: number; // Preço unitário CHEIO no momento da venda (antes do desconto de linha)
  costPrice?: number; // Custo no momento da venda (para relatório de margem)
  // ─── Desconto de linha (balcão) ───
  discountPercent?: number; // % aplicado nesta linha (0–100). 0 = sem desconto.
  discountValue?: number; // Valor do desconto da linha em R$ (price × quantity × %). Calculado no servidor.
}

// Endereço opcional (obrigatório só para canal online)
export interface IShippingAddress {
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  cpf: string;
}

// Snapshot do cliente — para POS, cliente pode ser walk-in (sem User)
export interface ICustomerSnapshot {
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
}

export interface IOrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  // Online (Pagar.me)
  mpOrderId?: string;
  mpPaymentId?: string;
  pagarmeOrderId?: string;
  pagarmeChargeId?: string;
  installments?: number;
  boletoUrl?: string;
  boletoBarcode?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  // Balcão (POS)
  cashReceived?: number; // Quanto o cliente entregou em dinheiro
  cashChange?: number; // Troco devolvido
  // Comum
  paidAt?: Date;
}

export interface IOrderShipping {
  method: string;
  carrier: string;
  estimatedDays: number;
  trackingCode?: string;
  melhorEnvioId?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  channel: OrderChannel; // 'online' | 'pos'
  user?: Types.ObjectId | null; // null se for walk-in
  guestEmail?: string;
  customerSnapshot?: ICustomerSnapshot; // Sempre preenchido (até "Consumidor")
  cashier?: Types.ObjectId | null; // Quem operou a venda (POS) — futuro
  items: IOrderItem[];
  subtotal: number; // Soma dos itens a preço CHEIO (price × quantity)
  shippingCost: number;
  discount: number; // Desconto TOTAL agregado (cupom + manual de balcão)
  manualDiscount?: number; // Parte do desconto que veio do balcão (linhas + carrinho), separado do cupom — para relatório
  coupon?: string;
  total: number;
  shippingAddress?: IShippingAddress; // Opcional (obrigatório só para canal online)
  payment: IOrderPayment;
  shipping?: IOrderShipping; // Opcional (não existe em POS)
  status: OrderStatus;
  // ─── Estoque ───
  // Flag de idempotência do decremento de estoque na transição para paid.
  // Gerenciado exclusivamente por services/inventory.ts (claim atômico) —
  // nunca setar manualmente.
  stockProcessed?: boolean;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}
