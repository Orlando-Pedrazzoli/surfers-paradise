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

export type ProductCompletionStatus = 'incomplete' | 'partial' | 'complete';

// Origem do produto (NF-e: 0=Nacional, 1=Importado direto, 2=Adquirido no BR, etc)
export type ProductOrigin = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export interface IProduct {
  _id: Types.ObjectId;

  // Identificacao
  name: string;
  slug: string;
  sku: string;

  // Descricao (opcionais para cadastro rapido)
  description?: string;
  richDescription?: string;

  // Precos
  price: number;
  compareAtPrice?: number;
  costPrice?: number;

  // Categorizacao
  category: Types.ObjectId;
  subcategory?: Types.ObjectId | null;
  brand: Types.ObjectId;

  // Midia
  images: string[];
  thumbnail?: string;

  // Variantes (legado)
  variants: IProductVariant[];

  // Estoque e Dimensoes
  stock: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  // Especificacoes
  specifications: IProductSpecification[];
  tags: string[];

  // Flags legadas
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  salePercentage?: number;

  // Unified Commerce
  isAvailableInStore: boolean;
  isPublishedOnline: boolean;
  completionStatus: ProductCompletionStatus;

  // Fiscal (NF-e) — todos opcionais
  gtin?: string;
  ncm?: string;
  origin?: ProductOrigin;
  cest?: string;

  // Fornecedor — opcional
  supplier?: Types.ObjectId | null;
  supplierProductCode?: string;

  // SEO
  seoTitle?: string;
  seoDescription?: string;

  // Metricas
  averageRating: number;
  reviewCount: number;
  soldCount: number;

  // Family System
  productFamily?: string;
  variantType?: 'color' | 'size' | 'both' | '';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant: boolean;

  createdAt: Date;
  updatedAt: Date;
}
