// 📄 src/lib/models/OtpVerification.ts
// Códigos OTP de verificação de e-mail — Surfers Paradise
// Segurança: armazena apenas o HASH do código (sha256 + segredo do servidor);
// vazamento do banco não expõe códigos válidos. TTL index remove docs
// expirados automaticamente. Um doc por e-mail (upsert no reenvio).

import mongoose, { Schema, Model } from 'mongoose';

export interface IOtpVerification {
  _id: mongoose.Types.ObjectId;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number; // tentativas de verificação erradas
  lastSentAt: Date; // cooldown de reenvio
  createdAt: Date;
  updatedAt: Date;
}

const otpVerificationSchema = new Schema<IOtpVerification>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true, // um OTP ativo por e-mail (reenvio substitui)
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL: o MongoDB apaga o doc quando expiresAt passa (varredura ~1 min)
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpVerification: Model<IOtpVerification> =
  mongoose.models.OtpVerification ||
  mongoose.model<IOtpVerification>('OtpVerification', otpVerificationSchema);

export default OtpVerification;
