'use client';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const colors = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-[#FF6600]',
};

export default function Toast({ message, type = 'info', isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white">&times;</button>
    </div>
  );
}
