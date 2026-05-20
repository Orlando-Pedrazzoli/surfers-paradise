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

// Setup de quilhas (configuração de fins)
export type FinSetup =
  | 'thruster'
  | 'twin'
  | 'twin-1'
  | 'quad'
  | 'quad-rear'
  | '5-fin'
  | 'single'
  | '';

// ═══════════════════════════════════════════════════════════════
// WETSUITS (Categoria: Wetsuits)
// ═══════════════════════════════════════════════════════════════

// Tipo de produto de neoprene
export type WetsuitType =
  | 'long-john' // Manga e perna longa (fullsuit)
  | 'short-john' // Manga curta ou perna curta (springsuit)
  | 'jaqueta' // Jaqueta/top de neoprene
  | 'lycra' // Camisa térmica fina / rashguard
  | 'calca' // Calça/pant
  | 'bermuda' // Bermuda térmica
  | 'maio' // Maiô feminino
  | 'botinha' // Boot
  | 'luva' // Glove
  | 'gorro' // Hood
  | 'capacete' // Helmet (Gath)
  | 'meia' // Meia neoprene
  | '';

// Sistema de entrada do wetsuit (tipo de zíper)
export type ZipperType =
  | 'zip-free' // Sem zíper (Z/F) — topo de linha
  | 'chest-zip' // Zíper no peito (C/Z)
  | 'back-zip' // Zíper nas costas (B/Z)
  | 'front-zip' // Zíper frontal (F/Z)
  | '';

// Gênero/público-alvo
export type Gender = 'masculino' | 'feminino' | 'kids' | 'unissex' | '';

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

  // Atributos de Quilhas (categoria: Quilhas)
  setup?: FinSetup;
  construction?: string;
  template?: string;

  // Atributos de Wetsuits (categoria: Wetsuits)
  wetsuitType?: WetsuitType;
  thickness?: string;
  gender?: Gender;
  wetsuitLine?: string;
  zipperType?: ZipperType;

  createdAt: Date;
  updatedAt: Date;
}
