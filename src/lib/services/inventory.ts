// 📄 src/lib/services/inventory.ts
// Decremento e restauração de estoque na transição de pagamento — Surfers Paradise
//
// PROBLEMA QUE RESOLVE: a Pagar.me reenvia eventos de webhook (e o mesmo
// order.paid pode chegar 2x em paralelo). Decrementar estoque direto no
// handler causaria decremento duplo. Um flag lido-e-salvo também não basta:
// duas requests simultâneas leem stockProcessed=false e ambas decrementam.
//
// SOLUÇÃO: claim atômico via findOneAndUpdate — só UMA request consegue
// virar o flag de false→true (ou true→false na restauração). Quem perde o
// claim retorna sem tocar no estoque. À prova de corrida, sem locks.
//
// USO:
//   processOrderStock(orderId)  → na transição para paid (webhook + cartão
//                                 aprovado na hora no checkout)
//   restoreOrderStock(orderId)  → em refund (devolve o estoque)
//
// Ambas são seguras de chamar múltiplas vezes (idempotentes) e nunca lançam
// exceção — falha é logada e reportada no retorno, para não derrubar o
// webhook (500 no webhook = reenvio infinito da Pagar.me).

import mongoose from 'mongoose';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

interface StockResult {
  processed: boolean; // true = este chamador executou a mudança de estoque
  reason?: string;
}

interface OrderItemLean {
  product?: mongoose.Types.ObjectId;
  sku?: string;
  name: string;
  quantity: number;
}

/**
 * Decrementa o estoque (e incrementa soldCount) de todos os itens do pedido.
 * Idempotente: só executa uma vez por pedido, mesmo com chamadas concorrentes.
 */
export async function processOrderStock(
  orderId: mongoose.Types.ObjectId | string,
): Promise<StockResult> {
  try {
    // Claim atômico: só prossegue quem virar o flag primeiro
    const order = await Order.findOneAndUpdate(
      { _id: orderId, stockProcessed: { $ne: true } },
      { $set: { stockProcessed: true } },
      { new: false }, // não precisamos do doc atualizado
    )
      .select('items orderNumber')
      .lean<{ items: OrderItemLean[]; orderNumber: string } | null>();

    if (!order) {
      return { processed: false, reason: 'already_processed_or_not_found' };
    }

    for (const item of order.items) {
      if (!item.product) continue; // item sem ref de produto (ex: avulso POS)

      // Decremento guardado: nunca deixa o estoque negativo
      const res = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
      );

      if (res.modifiedCount === 0) {
        // Oversell: estoque mudou entre a validação do checkout e o paid
        // (ex: venda simultânea no balcão). Zera e alerta — o admin precisa
        // saber que vendeu algo que pode não ter fisicamente.
        await Product.updateOne({ _id: item.product }, [
          {
            $set: {
              stock: 0,
              soldCount: {
                $add: [{ $ifNull: ['$soldCount', 0] }, item.quantity],
              },
            },
          },
        ]);
        console.warn(
          `[Inventory] OVERSELL no pedido ${order.orderNumber}: "${item.name}" (qty ${item.quantity}) — estoque zerado, verificar disponibilidade física.`,
        );
      }
    }

    return { processed: true };
  } catch (err) {
    console.error('[Inventory] falha ao processar estoque:', orderId, err);
    return { processed: false, reason: 'error' };
  }
}

/**
 * Devolve o estoque de um pedido (refund/cancelamento de pedido pago).
 * Só executa se o estoque foi de fato decrementado antes (claim reverso).
 */
export async function restoreOrderStock(
  orderId: mongoose.Types.ObjectId | string,
): Promise<StockResult> {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: orderId, stockProcessed: true },
      { $set: { stockProcessed: false } },
      { new: false },
    )
      .select('items orderNumber')
      .lean<{ items: OrderItemLean[]; orderNumber: string } | null>();

    if (!order) {
      return { processed: false, reason: 'not_processed_or_not_found' };
    }

    for (const item of order.items) {
      if (!item.product) continue;
      await Product.updateOne(
        { _id: item.product },
        {
          $inc: { stock: item.quantity, soldCount: -item.quantity },
        },
      );
    }

    console.info(
      `[Inventory] estoque restaurado para o pedido ${order.orderNumber}.`,
    );
    return { processed: true };
  } catch (err) {
    console.error('[Inventory] falha ao restaurar estoque:', orderId, err);
    return { processed: false, reason: 'error' };
  }
}
