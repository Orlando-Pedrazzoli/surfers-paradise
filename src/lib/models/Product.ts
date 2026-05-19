import mongoose, { Schema, Model } from 'mongoose';
import { IProduct } from '@/lib/types';

const productSchema = new Schema<IProduct>(
  {
    // IDENTIFICACAO
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sku: { type: String, required: true, unique: true, trim: true },

    // DESCRICAO (opcionais para Cadastro Rapido)
    description: { type: String, default: '' },
    richDescription: { type: String, default: '' },

    // PRECOS
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },

    // CATEGORIZACAO
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },

    // MIDIA
    images: [{ type: String }],
    thumbnail: { type: String, default: '' },

    // VARIANTES (legado)
    variants: [
      {
        _id: false,
        name: { type: String },
        options: [
          {
            _id: false,
            label: { type: String },
            value: { type: String },
            stock: { type: Number, default: 0 },
            sku: { type: String, default: '' },
          },
        ],
      },
    ],

    // ESTOQUE E DIMENSOES
    stock: { type: Number, required: true, default: 0, min: 0 },
    weight: { type: Number, default: 0 },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },

    // ESPECIFICACOES
    specifications: [
      {
        _id: false,
        key: { type: String },
        value: { type: String },
      },
    ],
    tags: [{ type: String }],

    // FLAGS LEGADAS
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    salePercentage: { type: Number, default: 0 },

    // UNIFIED COMMERCE
    isAvailableInStore: { type: Boolean, default: true, index: true },
    isPublishedOnline: { type: Boolean, default: false, index: true },
    completionStatus: {
      type: String,
      enum: ['incomplete', 'partial', 'complete'],
      default: 'incomplete',
      index: true,
    },

    // FISCAL (NF-e) - todos opcionais
    gtin: { type: String, default: '', trim: true, index: true },
    ncm: { type: String, default: '', trim: true },
    origin: {
      type: String,
      enum: ['0', '1', '2', '3', '4', '5', '6', '7', '8', ''],
      default: '0',
    },
    cest: { type: String, default: '', trim: true },

    // FORNECEDOR
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    supplierProductCode: { type: String, default: '', trim: true },

    // SEO
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },

    // METRICAS
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },

    // FAMILY SYSTEM
    productFamily: { type: String, default: '', index: true },
    variantType: {
      type: String,
      enum: ['color', 'size', 'both', ''],
      default: '',
    },
    color: { type: String, default: '' },
    colorCode: { type: String, default: '' },
    colorCode2: { type: String, default: '' },
    size: { type: String, default: '' },
    isMainVariant: { type: Boolean, default: true },

    // ═══ ATRIBUTOS DE QUILHAS (Categoria: Quilhas) ═══
    // Setup: configuração de fins (Thruster, Twin, Quad, etc.)
    setup: {
      type: String,
      enum: [
        'thruster',
        'twin',
        'twin-1',
        'quad',
        'quad-rear',
        '5-fin',
        'single',
        '',
      ],
      default: '',
      index: true,
    },
    // Construção/material (PC, PCC, Techflex, etc.)
    construction: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    // Template/família do template (Performer, Carver, Rake, etc.)
    template: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
  },
  { timestamps: true },
);

// INDICES
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ gtin: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ isActive: 1, isPublishedOnline: 1, isMainVariant: 1 });
productSchema.index({ isActive: 1, isAvailableInStore: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ productFamily: 1, isMainVariant: 1 });
productSchema.index({ name: 'text', tags: 'text', description: 'text' });
// Indices compostos para filtros de quilhas
productSchema.index({ category: 1, setup: 1 });
productSchema.index({ category: 1, construction: 1 });
productSchema.index({ category: 1, template: 1 });

// HOOK pre('save') — Mongoose 9 async syntax
productSchema.pre('save', async function () {
  const hasName = !!this.name && this.name.trim().length > 0;
  const hasSku = !!this.sku && this.sku.trim().length > 0;
  const hasPrice = this.price > 0;
  const hasCategory = !!this.category;
  const hasBrand = !!this.brand;
  const hasDescription =
    !!this.description && this.description.trim().length >= 20;
  const hasImage = Array.isArray(this.images) && this.images.length > 0;
  const hasWeight = (this.weight ?? 0) > 0;
  const hasDimensions =
    (this.dimensions?.length ?? 0) > 0 &&
    (this.dimensions?.width ?? 0) > 0 &&
    (this.dimensions?.height ?? 0) > 0;

  const minimumOk = hasName && hasSku && hasPrice && hasCategory && hasBrand;
  const fullOnlineReady =
    minimumOk && hasDescription && hasImage && hasWeight && hasDimensions;

  if (fullOnlineReady) {
    this.completionStatus = 'complete';
  } else if (minimumOk) {
    this.completionStatus = 'partial';
  } else {
    this.completionStatus = 'incomplete';
  }

  if (this.isPublishedOnline && this.completionStatus !== 'complete') {
    this.isPublishedOnline = false;
  }
});

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;
