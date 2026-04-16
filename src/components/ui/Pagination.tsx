'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-50">Anterior</button>
      <span className="text-sm text-gray-600">P\u00e1gina {currentPage} de {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-50">Pr\u00f3xima</button>
    </div>
  );
}
