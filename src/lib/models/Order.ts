import mongoose, { Schema, Model } from 'mongoose';
import { IOrder } from '@/lib/types';

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    guestEmail: { type: String, default: '' },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        image: { type: String, required: true },
        variant: { type: String, default: '' },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    coupon: { type: String, default: '' },
    total: { type: Number, required: true },
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      number: { type: String, required: true },
      complement: { type: String, default: '' },
      neighborhood: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      cep: { type: String, required: true },
      phone: { type: String, required: true },
      cpf: { type: String, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: ['credit_card', 'boleto', 'pix'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      pagarmeOrderId: { type: String, default: '' },
      pagarmeChargeId: { type: String, default: '' },
      installments: { type: Number, default: 1 },
      boletoUrl: { type: String, default: '' },
      boletoBarcode: { type: String, default: '' },
      pixQrCode: { type: String, default: '' },
      pixCopyPaste: { type: String, default: '' },
      paidAt: { type: Date },
    },
    shipping: {
      method: { type: String, default: '' },
      carrier: { type: String, default: '' },
      estimatedDays: { type: Number, default: 0 },
      trackingCode: { type: String, default: '' },
      melhorEnvioId: { type: String, default: '' },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true },
);

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order;
