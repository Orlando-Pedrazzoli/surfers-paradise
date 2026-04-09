import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IStoreSettings {
  _id: Types.ObjectId;
  announcementBar: {
    messages: string[];
    isActive: boolean;
  };
  whatsappNumber: string;
  businessHours: string;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  freeShippingMinValue: number;
  pixDiscountPercent: number;
  maxInstallments: number;
  minInstallmentValue: number;
  updatedAt: Date;
}

const storeSettingsSchema = new Schema<IStoreSettings>(
  {
    announcementBar: {
      messages: [{ type: String }],
      isActive: { type: Boolean, default: true },
    },
    whatsappNumber: { type: String, default: '' },
    businessHours: { type: String, default: '' },
    socialMedia: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    freeShippingMinValue: { type: Number, default: 299.9 },
    pixDiscountPercent: { type: Number, default: 10 },
    maxInstallments: { type: Number, default: 10 },
    minInstallmentValue: { type: Number, default: 30 },
  },
  { timestamps: true },
);

const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>('StoreSettings', storeSettingsSchema);

export default StoreSettings;
