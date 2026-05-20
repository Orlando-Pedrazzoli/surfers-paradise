import mongoose, { Schema, Model } from 'mongoose';
import { IProduct } from '@/lib/types';

const productSchema = new Schema<IProduct>(
  {
    // IDENTIFICACAO
    // Note: `unique: true` em slug e sku já cria índices automaticamente.
    // NÃO declarar productSchema.index({ slug: 1 }) ou .index({ sku: 1 }) abaixo.
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
    // gtin SEM `index: true` aqui — declarado em productSchema.index() abaixo
    gtin: { type: String, default: '', trim: true },
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
    // productFamily SEM `index: true` aqui — declarado em productSchema.index() abaixo
    productFamily: { type: String, default: '' },
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
    // Note: índices destes campos declarados em productSchema.index() abaixo,
    // NÃO usar `index: true` no campo.
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
    },
    construction: {
      type: String,
      default: '',
      trim: true,
    },
    template: {
      type: String,
      default: '',
      trim: true,
    },

    // ═══ ATRIBUTOS DE WETSUITS (Categoria: Wetsuits) ═══
    // Note: índices destes campos declarados em productSchema.index() abaixo,
    // NÃO usar `index: true` no campo.
    wetsuitType: {
      type: String,
      enum: [
        'long-john',
        'short-john',
        'jaqueta',
        'lycra',
        'calca',
        'bermuda',
        'maio',
        'botinha',
        'luva',
        'gorro',
        'capacete',
        'meia',
        '',
      ],
      default: '',
    },
    thickness: {
      type: String,
      default: '',
      trim: true,
    },
    gender: {
      type: String,
      enum: ['masculino', 'feminino', 'kids', 'unissex', ''],
      default: '',
    },
    wetsuitLine: {
      type: String,
      default: '',
      trim: true,
    },
    zipperType: {
      type: String,
      enum: ['zip-free', 'chest-zip', 'back-zip', 'front-zip', ''],
      default: '',
    },
  },
  { timestamps: true },
);

// ═══════════════════════════════════════════════════════════════
// INDICES
// ═══════════════════════════════════════════════════════════════
// IMPORTANTE: Campos com `unique: true` (slug, sku) já criam índice
// automaticamente — NÃO declarar productSchema.index() para eles.
//
// Campos com índice declarado aqui NÃO devem ter `index: true` no schema
// (evita o warning "Duplicate schema index" do Mongoose 9).
// ═══════════════════════════════════════════════════════════════

// Categorização e relacionamentos
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ supplier: 1 });

// Busca por código de barras
productSchema.index({ gtin: 1 });

// Filtros de listagem
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ isActive: 1, isPublishedOnline: 1, isMainVariant: 1 });
productSchema.index({ isActive: 1, isAvailableInStore: 1 });
productSchema.index({ tags: 1 });

// Family system
productSchema.index({ productFamily: 1, isMainVariant: 1 });

// Full-text search
productSchema.index({ name: 'text', tags: 'text', description: 'text' });

// Indices compostos para filtros de quilhas
productSchema.index({ category: 1, setup: 1 });
productSchema.index({ category: 1, construction: 1 });
productSchema.index({ category: 1, template: 1 });

// Indices compostos para filtros de wetsuits
productSchema.index({ category: 1, wetsuitType: 1 });
productSchema.index({ category: 1, thickness: 1 });
productSchema.index({ category: 1, gender: 1 });
productSchema.index({ category: 1, wetsuitLine: 1 });
productSchema.index({ category: 1, zipperType: 1 });

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════

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
