import { Types } from 'mongoose';

export type PaymentMethod = 'credit_card' | 'boleto' | 'pix';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  slug: string;
  image: string;
  variant?: string;
  quantity: number;
  price: number;
}

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

export interface IOrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  pagarmeOrderId?: string;
  pagarmeChargeId?: string;
  installments?: number;
  boletoUrl?: string;
  boletoBarcode?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
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
  user?: Types.ObjectId;
  guestEmail?: string;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  coupon?: string;
  total: number;
  shippingAddress: IShippingAddress;
  payment: IOrderPayment;
  shipping: IOrderShipping;
  status: OrderStatus;
  notes?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}
