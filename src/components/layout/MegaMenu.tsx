'use client';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-t z-50" onMouseLeave={onClose}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">Menu em construcao...</p>
      </div>
    </div>
  );
}
