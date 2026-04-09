export interface IShippingQuote {
  id: number;
  name: string;
  carrier: string;
  price: number;
  deliveryTime: number;
  deliveryRange: {
    min: number;
    max: number;
  };
  currency: string;
  error?: string;
}

export interface IShippingCalculateRequest {
  cepDestino: string;
  weight: number;
  height: number;
  width: number;
  length: number;
  productValue: number;
}
