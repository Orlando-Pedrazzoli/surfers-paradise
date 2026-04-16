'use client';
import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600">Utilizamos cookies para melhorar sua experiencia. Ao continuar navegando, voce concorda com nossa politica de privacidade.</p>
        <button onClick={accept} className="bg-[#FF6600] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#e55b00] whitespace-nowrap">Aceitar</button>
      </div>
    </div>
  );
}
