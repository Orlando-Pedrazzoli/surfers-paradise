'use client';

interface ProductSortProps {
  value: string;
  onChange: (value: string) => void;
  total?: number;
}

const sortOptions = [
  { label: 'Mais recentes', value: '-createdAt' },
  { label: 'Menor preço', value: 'price' },
  { label: 'Maior preço', value: '-price' },
  { label: 'A - Z', value: 'name' },
  { label: 'Z - A', value: '-name' },
  { label: 'Mais vendidos', value: '-soldCount' },
];

export default function ProductSort({
  value,
  onChange,
  total,
}: ProductSortProps) {
  return (
    <div className='flex items-center justify-between gap-4 mb-6'>
      {total !== undefined && (
        <p className='text-sm text-gray-500'>
          {total} produto{total !== 1 ? 's' : ''} encontrado
          {total !== 1 ? 's' : ''}
        </p>
      )}
      <div className='flex items-center gap-2 ml-auto'>
        <label className='text-sm text-gray-600 whitespace-nowrap'>
          Ordenar por:
        </label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className='px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] bg-white'
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
