interface OrderStatusUpdateProps {
  customerName: string;
  orderId: string;
  status: string;
  trackingCode?: string;
}

export default function OrderStatusUpdate({ customerName, orderId, status, trackingCode }: OrderStatusUpdateProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#FF6600' }}>Atualizacao do Pedido</h1>
      <p>Ola {customerName},</p>
      <p>Seu pedido <strong>#{orderId}</strong> foi atualizado para: <strong>{status}</strong></p>
      {trackingCode && <p>Codigo de rastreio: <strong>{trackingCode}</strong></p>}
    </div>
  );
}
