import mongoose, { Schema, Model } from 'mongoose';
import { IBrand } from '@/lib/types';

const brandSchema = new Schema<IBrand>(
  {
    // `unique: true` em slug já cria índice automaticamente — NÃO declarar
    // brandSchema.index({ slug: 1 }) abaixo (evita warning "Duplicate schema index").
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { type: String, default: '' },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ═══════════════════════════════════════════════════════════════
// INDICES
// ═══════════════════════════════════════════════════════════════
// O campo `slug` já tem índice por causa do `unique: true`.
// Não declarar índice adicional aqui (causaria warning do Mongoose 9).
// Adicione índices adicionais aqui se precisar no futuro.

const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>('Brand', brandSchema);

export default Brand;
