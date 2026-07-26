// 📄 src/lib/services/orderExpiration.ts
// Cancelamento automático de pedidos online não pagos — Surfers Paradise
//
// PROBLEMA QUE RESOLVE: pedido online criado sem conclusão do pagamento
// fica "pending" para sempre no painel, e (dependendo do fluxo) segura
// estoque de produto que nunca foi vendido.
//
// ESTRATÉGIA (dupla, complementar):
//   1. Vercel Cron (api/cron/cancel-expired-orders) — varredura periódica
//   2. Sweep lazy — chamado no GET /api/orders (admin) e no
//      dashboard-stats, garantindo que o admin NUNCA vê um pedido vencido
//      como "Aguardando", mesmo entre execuções do cron
//
// JANELAS DE EXPIRAÇÃO por método de pagamento:
//   - PIX / cartão: 24h (PIX expira em minutos; cartão falha na hora)
//   - Boleto: 96h (compensação bancária leva até 3 dias úteis — cancelar
//     em 24h cancelaria pedidos cujo boleto ainda vai compensar)
//
// CONCORRÊNCIA: o cancelamento de cada pedido é um claim atômico via
// findOneAndUpdate (status pending → cancelled). Se o webhook do Mercado
// Pago marcar o pedido como paid no mesmo instante, um dos dois vence e o
// outro é no-op — nunca cancelamos pedido pago, nunca cancelamos duas
// vezes. A devolução de estoque reutiliza restoreOrderStock (claim
// idempotente no stockProcessed): pedido que nunca decrementou estoque
// não devolve nada; pedido que decrementou devolve exatamente uma vez.
//
// Nunca lança exceção — falhas são logadas e reportadas no retorno, para
// não derrubar as rotas que fazem o sweep lazy.

import mongoose from 'mongoose';
import Order from '@/lib/models/Order';
import { restoreOrderStock } from '@/lib/services/inventory';
import { sendOrderStatusUpdate } from '@/lib/services/email';

// Janelas de expiração (em horas) — ajuste aqui se quiser outra política
const EXPIRATION_HOURS_DEFAULT = 24; // pix, credit_card, debit_card
const EXPIRATION_HOURS_BOLETO = 96; // boleto compensa em até 3 dias úteis

export interface ExpirationResult {
  scanned: number; // quantos pedidos vencidos foram encontrados
  cancelled: number; // quantos foram efetivamente cancelados por ESTA chamada
  restocked: number; // em quantos o estoque foi devolvido
  errors: number;
}

interface ExpiredOrderId {
  _id: mongoose.Types.ObjectId;
}

interface CancelledOrderLean {
  orderNumber: string;
  customerSnapshot?: { email?: string };
  guestEmail?: string;
}

/**
 * Cancela pedidos online pendentes cuja janela de pagamento expirou,
 * devolvendo o estoque quando aplicável. Idempotente e seguro para
 * execução concorrente (cron + sweep lazy simultâneos).
 */
export async function cancelExpiredOrders(): Promise<ExpirationResult> {
  const result: ExpirationResult = {
    scanned: 0,
    cancelled: 0,
    restocked: 0,
    errors: 0,
  };

  try {
    const now = Date.now();
    const cutoffDefault = new Date(now - EXPIRATION_HOURS_DEFAULT * 3600_000);
    const cutoffBoleto = new Date(now - EXPIRATION_HOURS_BOLETO * 3600_000);

    // Busca enxuta: só IDs de candidatos vencidos (indexado por
    // channel+status; o filtro de data corta o resto)
    const expired = await Order.find({
      channel: 'online',
      status: 'pending',
      'payment.status': 'pending',
      $or: [
        {
          'payment.method': { $ne: 'boleto' },
          createdAt: { $lte: cutoffDefault },
        },
        {
          'payment.method': 'boleto',
          createdAt: { $lte: cutoffBoleto },
        },
      ],
    })
      .select('_id')
      .limit(200) // teto por execução — lote seguinte pega o resto
      .lean<ExpiredOrderId[]>();

    result.scanned = expired.length;
    if (expired.length === 0) return result;

    for (const { _id } of expired) {
      try {
        // Claim atômico: só cancela se AINDA estiver pending/pending.
        // Se o webhook marcou como paid entre a busca e agora, é no-op.
        const order = await Order.findOneAndUpdate(
          {
            _id,
            status: 'pending',
            'payment.status': 'pending',
          },
          {
            $set: {
              status: 'cancelled',
              'payment.status': 'failed',
              cancellationReason:
                'Cancelado automaticamente — pagamento não confirmado no prazo',
              cancelledAt: new Date(),
            },
          },
          { new: true },
        )
          .select('orderNumber customerSnapshot guestEmail')
          .lean<CancelledOrderLean | null>();

        if (!order) continue; // outro processo venceu o claim (pago ou já cancelado)

        result.cancelled++;

        // Devolve estoque APENAS se foi decrementado (claim idempotente)
        const restock = await restoreOrderStock(_id);
        if (restock.processed) result.restocked++;

        // Notifica o cliente (fire-and-forget)
        const email = order.customerSnapshot?.email || order.guestEmail;
        if (email) {
          sendOrderStatusUpdate(email, order.orderNumber, 'cancelled').catch(
            e =>
              console.error(
                '[OrderExpiration] falha ao enviar e-mail:',
                order.orderNumber,
                e,
              ),
          );
        }

        console.info(
          `[OrderExpiration] pedido ${order.orderNumber} cancelado por expiração` +
            (restock.processed ? ' (estoque devolvido)' : ''),
        );
      } catch (err) {
        result.errors++;
        console.error('[OrderExpiration] falha ao cancelar pedido:', _id, err);
      }
    }

    return result;
  } catch (err) {
    console.error('[OrderExpiration] falha na varredura:', err);
    result.errors++;
    return result;
  }
}
