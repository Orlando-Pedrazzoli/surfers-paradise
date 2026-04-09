import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IAddress {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    street: { type: String, required: true },
    number: { type: String, required: true },
    complement: { type: String, default: '' },
    neighborhood: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    cep: { type: String, required: true },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

addressSchema.index({ user: 1 });

const Address: Model<IAddress> =
  mongoose.models.Address || mongoose.model<IAddress>('Address', addressSchema);

export default Address;
