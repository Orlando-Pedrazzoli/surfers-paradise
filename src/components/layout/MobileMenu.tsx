'use client';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={onClose} className="text-gray-500 text-2xl">&times;</button>
        </div>
        <nav className="p-4">
          <p className="text-gray-500 text-sm">Menu em construcao...</p>
        </nav>
      </div>
    </div>
  );
}
