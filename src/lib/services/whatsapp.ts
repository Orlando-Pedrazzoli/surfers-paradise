const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '5511999999999';

export function getWhatsAppLink(message?: string): string {
  const encoded = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${WHATSAPP_NUMBER}${encoded ? `?text=${encoded}` : ''}`;
}

export function getOrderWhatsAppLink(orderId: string): string {
  return getWhatsAppLink(`Ola! Gostaria de informacoes sobre meu pedido #${orderId}`);
}
