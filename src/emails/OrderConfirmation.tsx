interface OrderConfirmationProps {
  customerName: string;
  orderId: string;
  total: number;
}

export default function OrderConfirmation({ customerName, orderId, total }: OrderConfirmationProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#FF6600' }}>Pedido Confirmado!</h1>
      <p>Ola {customerName},</p>
      <p>Seu pedido <strong>#{orderId}</strong> foi confirmado com sucesso.</p>
      <p>Total: <strong>R$ {total.toFixed(2)}</strong></p>
      <p>Obrigado por comprar na Surfers Paradise!</p>
    </div>
  );
}
