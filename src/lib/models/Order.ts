import mongoose, { Schema, Model } from 'mongoose';
import { IOrder } from '@/lib/types';

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },

    // ═══ UNIFIED COMMERCE ═══
    channel: {
      type: String,
      enum: ['online', 'pos'],
      required: true,
      default: 'online',
      index: true,
    },

    // Cliente
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    guestEmail: { type: String, default: '' },
    customerSnapshot: {
      name: { type: String, default: 'Consumidor' },
      cpf: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    cashier: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // Items
    items: [
      {
        _id: false,
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        sku: { type: String, default: '' },
        name: { type: String, required: true },
        slug: { type: String, default: '' },
        image: { type: String, default: '' },
        variant: { type: String, default: '' },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }, // preço CHEIO unitário
        costPrice: { type: Number, default: 0 },
        // Desconto de linha (balcão)
        discountPercent: { type: Number, default: 0, min: 0, max: 100 },
        discountValue: { type: Number, default: 0, min: 0 },
      },
    ],

    // Totais
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 }, // total agregado (cupom + manual)
    manualDiscount: { type: Number, default: 0, min: 0 }, // só a parte manual de balcão
    coupon: { type: String, default: '' },
    total: { type: Number, required: true, min: 0 },

    // Endereço (opcional — obrigatório apenas para channel='online' via API validation)
    shippingAddress: {
      name: { type: String },
      street: { type: String },
      number: { type: String },
      complement: { type: String, default: '' },
      neighborhood: { type: String },
      city: { type: String },
      state: { type: String },
      cep: { type: String },
      phone: { type: String },
      cpf: { type: String },
    },

    // Pagamento (estendido para POS)
    payment: {
      method: {
        type: String,
        enum: ['credit_card', 'debit_card', 'boleto', 'pix', 'cash'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
        index: true,
      },
      // Online
      pagarmeOrderId: { type: String, default: '' },
      pagarmeChargeId: { type: String, default: '' },
      installments: { type: Number, default: 1 },
      boletoUrl: { type: String, default: '' },
      boletoBarcode: { type: String, default: '' },
      pixQrCode: { type: String, default: '' },
      pixCopyPaste: { type: String, default: '' },
      // Balcão
      cashReceived: { type: Number, default: 0 },
      cashChange: { type: Number, default: 0 },
      // Comum
      paidAt: { type: Date },
    },

    // ═══ ESTOQUE ═══
    // Flag de idempotência do decremento de estoque na transição para paid.
    // NUNCA setar diretamente — usar processOrderStock/restoreOrderStock em
    // services/inventory.ts, que fazem o claim de forma atômica (à prova de
    // reenvios simultâneos do webhook Pagar.me).
    stockProcessed: { type: Boolean, default: false },

    // Shipping (opcional — só online)
    shipping: {
      method: { type: String, default: '' },
      carrier: { type: String, default: '' },
      estimatedDays: { type: Number, default: 0 },
      trackingCode: { type: String, default: '' },
      melhorEnvioId: { type: String, default: '' },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },

    // Status
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
      index: true,
    },

    // Cancelamento
    cancellationReason: { type: String, default: '' },
    cancelledAt: { type: Date },

    // Meta
    notes: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true },
);

// Indexes
orderSchema.index({ channel: 1, status: 1 });
orderSchema.index({ channel: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Geração de orderNumber se não fornecido
orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const prefix = this.channel === 'pos' ? 'POS' : 'WEB';
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000 + 1000); // 4 dígitos
    this.orderNumber = `${prefix}${year}${month}${day}-${random}`;
  }
});

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order;
