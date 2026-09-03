// 📄 src/lib/models/Wishlist.ts
// Lista de desejos: UM documento por usuário, itens como refs de Product.
// Guests usam localStorage (client); ao logar, o provider faz merge via
// PUT /api/wishlist. addedAt permite ordenar por "adicionado recentemente".
import mongoose, { Schema, models, model } from 'mongoose';

const WishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export interface WishlistDoc extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  items: { product: mongoose.Types.ObjectId; addedAt: Date }[];
}

const Wishlist =
  models.Wishlist || model<WishlistDoc>('Wishlist', WishlistSchema);

export default Wishlist;
