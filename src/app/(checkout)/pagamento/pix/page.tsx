// 📄 src/app/(checkout)/pagamento/pix/page.tsx
// v2 (GAP 5 — retomar pagamento): substitui o stub. A página agora busca o
// pedido em GET /api/orders/[id] (rota existente, protegida: dono ou admin)
// e renderiza o PixPayment.tsx com o QR/copia-e-cola persistidos no Order.
// Acesso: /pagamento/pix?orderId=<ObjectId> (link em Meus Pedidos).
// Estados tratados: carregando, não logado/sem permissão, já pago,
// cancelado/expirado (cron), método boleto (redireciona ao detalhe),
// QR indisponível.
// v2: EXPIRAÇÃO DO QR — o Order não persiste expiresAt, mas ele é
//     determinístico: createdAt + PIX_EXPIRES_SECONDS (checkout.ts define
//     3600s e passa o mesmo valor ao Mercado Pago). A página deriva o
//     deadline, alimenta o countdown do PixPayment e troca para o card de
//     "expirado" quando vence — sem exibir QR morto. O cron (24h) segue
//     como rede de segurança do cancelamento.
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import PixPayment from '@/components/checkout/PixPayment';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface PendingOrder {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  payment: {
    method: string;
    status: string;
    pixQrCode?: string;
    pixCopyPaste?: string;
    boletoUrl?: string;
  };
}

// ⚠️ Manter em sincronia com PIX_EXPIRES_SECONDS em src/lib/services/checkout.ts
const PIX_EXPIRES_MS = 3600 * 1000;

/**
 * O checkout do Mercado Pago devolve o QR como base64 puro
 * (qr_code_base64). Se um dia o campo passar a guardar URL ou data-URI,
 * usamos direto; caso contrário prefixamos o data-URI PNG.
 */
function normalizeQrImage(raw?: string): string {
  if (!raw) return '';
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
  return `data:image/png;base64,${raw}`;
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className='mx-auto max-w-2xl px-4 py-10'>
      <div className='rounded-2xl bg-white p-8 shadow-lg'>{children}</div>
    </div>
  );
}

function PixPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [qrExpired, setQrExpired] = useState(false);

  // Deadline derivado do createdAt (o QR do MP expira em 1h)
  const pixDeadline = order
    ? new Date(order.createdAt).getTime() + PIX_EXPIRES_MS
    : null;

  // Marca expirado na chegada (link antigo) e no exato momento em que vence
  useEffect(() => {
    if (!pixDeadline) return;
    if (Date.now() >= pixDeadline) {
      setQrExpired(true);
      return;
    }
    const t = setTimeout(
      () => setQrExpired(true),
      pixDeadline - Date.now() + 500,
    );
    return () => clearTimeout(t);
  }, [pixDeadline]);

  useEffect(() => {
    if (!orderId) {
      setError('Pedido não informado.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
        } else if (res.status === 401 || res.status === 403) {
          setUnauthorized(true);
        } else {
          setError(data.error || 'Pedido não encontrado.');
        }
      } catch {
        setError('Erro ao carregar o pedido.');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  // Boleto não pertence a esta página — manda para o detalhe do pedido,
  // que já tem o link "Abrir boleto para pagamento".
  useEffect(() => {
    if (order && order.payment.method === 'boleto') {
      router.replace(`/meus-pedidos/${order._id}`);
    }
  }, [order, router]);

  if (loading) {
    return (
      <div className='flex justify-center py-16'>
        <Loader2 size={32} className='animate-spin text-[#FF6600]' />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <CenteredCard>
        <div className='text-center'>
          <AlertTriangle size={40} className='mx-auto mb-3 text-amber-500' />
          <h1 className='mb-2 text-xl font-bold text-gray-900'>
            Entre para continuar
          </h1>
          <p className='mb-6 text-sm text-gray-500'>
            Você precisa estar logado na conta que fez este pedido para retomar
            o pagamento.
          </p>
          <Link
            href='/login'
            className='inline-block rounded-lg bg-[#FF6600] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e55b00]'
          >
            Fazer login
          </Link>
        </div>
      </CenteredCard>
    );
  }

  if (error || !order) {
    return (
      <CenteredCard>
        <div className='text-center'>
          <AlertTriangle size={40} className='mx-auto mb-3 text-gray-300' />
          <p className='mb-6 text-gray-500'>
            {error || 'Pedido não encontrado.'}
          </p>
          <Link
            href='/meus-pedidos'
            className='text-sm font-medium text-[#FF6600] hover:underline'
          >
            ← Voltar para Meus Pedidos
          </Link>
        </div>
      </CenteredCard>
    );
  }

  // Já pago (inclusive se o cliente pagar em outra aba e recarregar aqui)
  if (order.payment.status === 'paid') {
    return (
      <CenteredCard>
        <div className='text-center'>
          <CheckCircle2 size={40} className='mx-auto mb-3 text-green-600' />
          <h1 className='mb-2 text-xl font-bold text-gray-900'>
            Pagamento confirmado!
          </h1>
          <p className='mb-6 text-sm text-gray-500'>
            O pedido #{order.orderNumber} já está pago. Obrigado!
          </p>
          <Link
            href={`/meus-pedidos/${order._id}`}
            className='inline-block rounded-lg bg-[#FF6600] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e55b00]'
          >
            Acompanhar pedido
          </Link>
        </div>
      </CenteredCard>
    );
  }

  // Cancelado pelo cron de expiração (ou pelo admin)
  if (order.status === 'cancelled') {
    return (
      <CenteredCard>
        <div className='text-center'>
          <Clock size={40} className='mx-auto mb-3 text-amber-500' />
          <h1 className='mb-2 text-xl font-bold text-gray-900'>
            Este pedido expirou
          </h1>
          <p className='mb-6 text-sm text-gray-500'>
            O prazo de pagamento do pedido #{order.orderNumber} terminou e ele
            foi cancelado — nada foi cobrado. É só fazer um novo pedido.
          </p>
          <Link
            href='/produtos'
            className='inline-block rounded-lg bg-[#FF6600] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e55b00]'
          >
            Voltar à loja
          </Link>
        </div>
      </CenteredCard>
    );
  }

  if (order.payment.method !== 'pix') {
    // boleto já redirecionou no useEffect; cartão pendente não tem retomada
    return (
      <CenteredCard>
        <div className='text-center'>
          <AlertTriangle size={40} className='mx-auto mb-3 text-gray-300' />
          <p className='mb-6 text-gray-500'>
            Este pedido não usa pagamento por PIX.
          </p>
          <Link
            href={`/meus-pedidos/${order._id}`}
            className='text-sm font-medium text-[#FF6600] hover:underline'
          >
            Ver detalhes do pedido →
          </Link>
        </div>
      </CenteredCard>
    );
  }

  // QR morto (mais de 1h desde a criação): não exibir código inválido.
  // O pedido ainda está pending — o cron cancela em 24h.
  if (qrExpired) {
    return (
      <CenteredCard>
        <div className='text-center'>
          <Clock size={40} className='mx-auto mb-3 text-amber-500' />
          <h1 className='mb-2 text-xl font-bold text-gray-900'>
            Este código PIX expirou
          </h1>
          <p className='mb-6 text-sm text-gray-500'>
            Nada foi cobrado. O pedido #{order.orderNumber} será cancelado
            automaticamente — para concluir a compra, é só fazer um novo pedido.
          </p>
          <div className='flex flex-wrap justify-center gap-3'>
            <Link
              href='/produtos'
              className='inline-block rounded-lg bg-[#FF6600] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e55b00]'
            >
              Fazer novo pedido
            </Link>
            <Link
              href={`/meus-pedidos/${order._id}`}
              className='inline-block rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200'
            >
              Ver pedido
            </Link>
          </div>
        </div>
      </CenteredCard>
    );
  }

  if (!order.payment.pixCopyPaste) {
    return (
      <CenteredCard>
        <div className='text-center'>
          <AlertTriangle size={40} className='mx-auto mb-3 text-amber-500' />
          <p className='mb-6 text-gray-500'>
            O código PIX deste pedido não está mais disponível. Entre em contato
            conosco ou faça um novo pedido.
          </p>
          <Link
            href={`/meus-pedidos/${order._id}`}
            className='text-sm font-medium text-[#FF6600] hover:underline'
          >
            Ver detalhes do pedido →
          </Link>
        </div>
      </CenteredCard>
    );
  }

  return (
    <div className='mx-auto max-w-2xl px-4 py-10'>
      <div className='rounded-2xl bg-white p-8 shadow-lg'>
        <div className='mb-6 text-center'>
          <h1 className='text-xl font-bold text-gray-900'>
            Pedido #{order.orderNumber}
          </h1>
          <p className='mt-1 text-sm text-gray-500'>
            Total: <strong>{formatCurrency(order.total)}</strong>
          </p>
        </div>

        <PixPayment
          qrCode={order.payment.pixCopyPaste}
          qrCodeUrl={normalizeQrImage(order.payment.pixQrCode)}
          expiresAt={
            pixDeadline ? new Date(pixDeadline).toISOString() : undefined
          }
          orderNumber={order.orderNumber}
          orderId={order._id}
          onPaid={() => router.push(`/meus-pedidos/${order._id}`)}
          onExpired={() => setQrExpired(true)}
        />

        <div className='mt-6 text-center'>
          <Link
            href={`/meus-pedidos/${order._id}`}
            className='text-sm text-gray-500 transition-colors hover:text-[#FF6600]'
          >
            ← Voltar para o pedido
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PixPage() {
  // useSearchParams exige boundary de Suspense no App Router
  return (
    <Suspense
      fallback={
        <div className='flex justify-center py-16'>
          <Loader2 size={32} className='animate-spin text-[#FF6600]' />
        </div>
      }
    >
      <PixPageInner />
    </Suspense>
  );
}
