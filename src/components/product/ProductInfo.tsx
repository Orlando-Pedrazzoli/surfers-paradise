interface ProductInfoProps {
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  sku?: string;
  brand?: string;
  inStock?: boolean;
}

export default function ProductInfo({ name, price, originalPrice, description, sku, brand, inStock = true }: ProductInfoProps) {
  return (
    <div className="space-y-4">
      {brand && <p className="text-sm text-gray-500 uppercase tracking-wide">{brand}</p>}
      <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-[#FF6600]">R$ {price.toFixed(2)}</span>
        {originalPrice && originalPrice > price && <span className="text-lg text-gray-400 line-through">R$ {originalPrice.toFixed(2)}</span>}
      </div>
      <p className="text-gray-600 leading-relaxed">{description}</p>
      {sku && <p className="text-xs text-gray-400">SKU: {sku}</p>}
      <p className={`text-sm font-medium ${inStock ? 'text-green-600' : 'text-red-600'}`}>{inStock ? 'Em estoque' : 'Fora de estoque'}</p>
    </div>
  );
}
