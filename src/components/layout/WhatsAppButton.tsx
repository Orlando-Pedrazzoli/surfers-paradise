'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const whatsappNumber = '5511999999999';
  const message = encodeURIComponent(
    'Olá! Gostaria de saber mais sobre os produtos da Surfers Paradise.',
  );
  const url = 'https://wa.me/' + whatsappNumber + '?text=' + message;

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      className='fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all'
      aria-label='Fale conosco pelo WhatsApp'
    >
      <MessageCircle size={28} />
    </a>
  );
}
