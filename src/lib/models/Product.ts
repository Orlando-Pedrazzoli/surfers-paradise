import mongoose, { Schema, Model } from 'mongoose';
import { IProduct } from '@/lib/types';

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    richDescription: { type: String, default: '' },
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: String, default: '' },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    images: [{ type: String }],
    thumbnail: { type: String, default: '' },
    variants: [
      {
        name: { type: String },
        options: [
          {
            label: { type: String },
            value: { type: String },
            stock: { type: Number, default: 0 },
            sku: { type: String, default: '' },
          },
        ],
      },
    ],
    stock: { type: Number, required: true, default: 0 },
    weight: { type: Number, required: true, default: 0 },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    specifications: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    salePercentage: { type: Number, default: 0 },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', tags: 'text', description: 'text' });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;
