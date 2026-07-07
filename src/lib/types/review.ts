import { Types } from 'mongoose';

export interface IReview {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user?: Types.ObjectId | null; // null em avaliações de loja/legadas
  name: string;
  email: string;
  city?: string;
  state?: string;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  isStoreReview: boolean;
  // Selo "compra verificada" — setado pelo servidor quando o cliente tem
  // pedido delivered contendo o produto (nunca vem do client).
  isVerifiedPurchase?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
