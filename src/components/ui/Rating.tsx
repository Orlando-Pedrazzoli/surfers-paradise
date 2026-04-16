interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
}

export default function Rating({ value, max = 5, size = 'md', showValue = false }: RatingProps) {
  const starSize = size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`${starSize} ${i < Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}`}>&#9733;</span>
      ))}
      {showValue && <span className="ml-1 text-sm text-gray-600">{value.toFixed(1)}</span>}
    </div>
  );
}
