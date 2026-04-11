import { Types } from 'mongoose';

export interface IProductVariantOption {
  label: string;
  value: string;
  stock: number;
  sku?: string;
}

export interface IProductVariant {
  name: string;
  options: IProductVariantOption[];
}

export interface IProductSpecification {
  key: string;
  value: string;
}

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  richDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  category: Types.ObjectId;
  subcategory?: string;
  brand: Types.ObjectId;
  images: string[];
  thumbnail?: string;
  variants: IProductVariant[];
  stock: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  specifications: IProductSpecification[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  salePercentage?: number;
  seoTitle?: string;
  seoDescription?: string;
  averageRating: number;
  reviewCount: number;
  soldCount: number;

  // ═══ FAMILY SYSTEM ═══
  productFamily?: string;
  variantType?: 'color' | 'size' | 'both';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant: boolean;

  createdAt: Date;
  updatedAt: Date;
}
