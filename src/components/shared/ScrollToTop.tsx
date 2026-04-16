'use client';
import { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-40 bg-[#FF6600] text-white p-3 rounded-full shadow-lg hover:bg-[#e55b00] transition-colors"
      aria-label="Voltar ao topo"
    >
      &uarr;
    </button>
  );
}
