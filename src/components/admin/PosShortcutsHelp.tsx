'use client';

import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface PosShortcutsHelpProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['F2'], description: 'Focar campo de busca' },
  { keys: ['F3'], description: 'Limpar carrinho' },
  { keys: ['F4'], description: 'Finalizar venda' },
  { keys: ['F6'], description: 'Foco no desconto geral do carrinho' },
  { keys: ['F7'], description: 'Cadastro rápido de produto' },
  { keys: ['F9'], description: 'Remover último item do carrinho' },
  { keys: ['+', '='], description: 'Aumentar quantidade do último item' },
  { keys: ['-'], description: 'Diminuir quantidade do último item' },
  { keys: ['Esc'], description: 'Limpar busca / fechar modal' },
  { keys: ['?'], description: 'Mostrar esta ajuda' },
];

export default function PosShortcutsHelp({ onClose }: PosShortcutsHelpProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-2xl max-w-md w-full'>
        <div className='flex items-center justify-between p-4 border-b'>
          <div className='flex items-center gap-2'>
            <Keyboard size={20} className='text-[#FF6600]' />
            <h2 className='text-lg font-bold'>Atalhos do POS</h2>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <X size={20} />
          </button>
        </div>
        <div className='p-4'>
          <div className='space-y-2'>
            {SHORTCUTS.map((s, i) => (
              <div
                key={i}
                className='flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-md'
              >
                <span className='text-sm text-gray-700'>{s.description}</span>
                <div className='flex items-center gap-1'>
                  {s.keys.map((k, j) => (
                    <kbd
                      key={j}
                      className='inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-mono font-bold bg-gray-100 border border-gray-300 rounded shadow-sm'
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className='mt-4 pt-3 border-t text-xs text-gray-400 text-center'>
            Pressiona <kbd className='bg-gray-100 px-1 rounded'>?</kbd> a
            qualquer momento para ver esta ajuda
          </div>
        </div>
      </div>
    </div>
  );
}
