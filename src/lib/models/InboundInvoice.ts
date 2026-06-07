import mongoose, { Schema, Model } from 'mongoose';
import { IInboundInvoice } from '@/lib/types';

const inboundInvoiceSchema = new Schema<IInboundInvoice>(
  {
    // `unique: true` em chave já cria índice automaticamente — NÃO declarar
    // inboundInvoiceSchema.index({ chave: 1 }) abaixo (evita warning Mongoose 9).
    chave: { type: String, required: true, unique: true, trim: true },
    modelo: { type: String, default: '' },
    number: { type: String, default: '' },
    series: { type: String, default: '' },
    issuedAt: { type: Date },

    issuer: {
      cnpj: { type: String, default: '' },
      name: { type: String, default: '' },
      ie: { type: String, default: '' },
    },
    dest: {
      cnpj: { type: String, default: '' },
      name: { type: String, default: '' },
    },

    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
    totalValue: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
      index: true,
    },

    items: [
      {
        _id: false,
        cProd: { type: String, default: '' },
        gtin: { type: String, default: '' },
        xProd: { type: String, default: '' },
        ncm: { type: String, default: '' },
        cest: { type: String, default: '' },
        cfop: { type: String, default: '' },
        unit: { type: String, default: '' },
        quantity: { type: Number, default: 0 },
        unitCost: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 },
        matchStatus: {
          type: String,
          enum: ['matched', 'created', 'pending'],
          default: 'pending',
        },
        product: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
      },
    ],

    rawXml: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

inboundInvoiceSchema.index({ createdAt: -1 });
inboundInvoiceSchema.index({ 'issuer.cnpj': 1 });

const InboundInvoice: Model<IInboundInvoice> =
  mongoose.models.InboundInvoice ||
  mongoose.model<IInboundInvoice>('InboundInvoice', inboundInvoiceSchema);

export default InboundInvoice;
