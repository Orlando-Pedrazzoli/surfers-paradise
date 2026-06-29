import { Types } from 'mongoose';

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string; // círculos do ShopByCategory (subcategorias)
  megaImage?: string; // imagem do mega-menu da navbar (categorias-raiz)
  icon?: string;
  parent?: Types.ObjectId | null;
  level: number;
  order: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}
