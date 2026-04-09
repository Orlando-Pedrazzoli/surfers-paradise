import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IRomaneio {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  items: {
    product: string;
    variant?: string;
    quantity: number;
    location?: string;
  }[];
  status: 'pending' | 'picked' | 'packed' | 'shipped';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const romaneioSchema = new Schema<IRomaneio>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    items: [
      {
        product: { type: String, required: true },
        variant: { type: String, default: '' },
        quantity: { type: Number, required: true },
        location: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'picked', 'packed', 'shipped'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

const Romaneio: Model<IRomaneio> =
  mongoose.models.Romaneio ||
  mongoose.model<IRomaneio>('Romaneio', romaneioSchema);

export default Romaneio;
