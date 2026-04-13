'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { useCart } from '@/lib/context/CartProvider';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToCartModal({
  isOpen,
  onClose,
}: AddToCartModalProps) {
  const router = useRouter();
  const { closeCart } = useCart();

  if (!isOpen) return null;

  const handleContinue = () => {
    closeCart();
    onClose();
  };

  const handleFinalize = () => {
    closeCart();
    onClose();
    router.push('/checkout');
  };

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/50' onClick={handleContinue} />

      {/* Modal */}
      <div className='relative bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center'>
        {/* Green Checkmark */}
        <div className='flex justify-center mb-4'>
          <CheckCircle size={64} className='text-green-500' strokeWidth={1.5} />
        </div>

        <h2 className='text-lg font-bold text-gray-900 mb-1'>
          Produto adicionado com sucesso!
        </h2>
        <p className='text-sm text-gray-500 mb-6'>O que deseja fazer?</p>

        {/* Buttons */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <button
            onClick={handleContinue}
            className='flex-1 px-6 py-3 border-2 border-gray-900 text-gray-900 font-bold text-sm rounded-md hover:bg-gray-100 transition-colors'
          >
            Continuar Comprando
          </button>
          <button
            onClick={handleFinalize}
            className='flex-1 px-6 py-3 bg-[#FF6600] text-white font-bold text-sm rounded-md hover:bg-[#e55b00] transition-colors'
          >
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  );
}
