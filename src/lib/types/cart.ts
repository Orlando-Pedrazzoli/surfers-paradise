export interface ICartItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  variant?: string;
  quantity: number;
  stock: number;
  weight: number;
}

export interface ICart {
  items: ICartItem[];
  subtotal: number;
  itemCount: number;
}
