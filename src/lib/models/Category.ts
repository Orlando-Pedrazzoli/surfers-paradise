import mongoose, { Schema, Model } from 'mongoose';
import { ICategory } from '@/lib/types';

const categorySchema = new Schema<ICategory>(
  {
    // `unique: true` em slug já cria índice automaticamente — NÃO declarar
    // categorySchema.index({ slug: 1 }) abaixo (evita warning "Duplicate schema index").
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    icon: { type: String, default: '' },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    level: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ═══════════════════════════════════════════════════════════════
// INDICES
// ═══════════════════════════════════════════════════════════════
// O campo `slug` já tem índice por causa do `unique: true`.
// NÃO declarar categorySchema.index({ slug: 1 }) (causaria warning do Mongoose 9).

// Índice composto para listagem hierárquica (filhos de um parent, ordenados)
categorySchema.index({ parent: 1, order: 1 });

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>('Category', categorySchema);

export default Category;
