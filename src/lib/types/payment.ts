export interface ICreditCardData {
  number: string;
  holderName: string;
  expMonth: number;
  expYear: number;
  cvv: string;
  installments: number;
}

export interface IPagarmeCustomer {
  name: string;
  email: string;
  document: string;
  phone: string;
}

export interface IPagarmeAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IPaymentRequest {
  method: 'credit_card' | 'boleto' | 'pix';
  amount: number;
  customer: IPagarmeCustomer;
  billingAddress: IPagarmeAddress;
  shippingAddress: IPagarmeAddress;
  creditCard?: ICreditCardData;
  orderId: string;
}

export interface IPaymentResponse {
  success: boolean;
  pagarmeOrderId?: string;
  chargeId?: string;
  status: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  error?: string;
}
