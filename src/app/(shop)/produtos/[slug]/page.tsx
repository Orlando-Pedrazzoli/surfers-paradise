// 📄 src/app/(shop)/produtos/[slug]/page.tsx
// v2: cálculo de frete real via Melhor Envio (5 opções, somente visualização —
// cotação automática ao completar o CEP) + scroll para o topo sempre que a
// página de detalhe abre ou troca de produto (variantes da família).
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Check,
  Truck,
  Zap,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {
  calculateInstallments,
  calculatePixPrice,
} from '@/lib/utils/installments';
import ProductCard from '@/components/product/ProductCard';
import ProductGallery from '@/components/product/ProductGallery';
import { useCart } from '@/lib/context/CartProvider';
import AddToCartModal from '@/components/checkout/AddToCartModal';
import { useShippingQuotes } from '@/lib/hooks/useShippingQuotes';

interface ProductData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  richDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  category: { _id: string; name: string; slug: string } | null;
  brand: { _id: string; name: string; slug: string; logo?: string } | null;
  images: string[];
  thumbnail?: string;
  variants: {
    name: string;
    options: { label: string; value: string; stock: number; sku?: string }[];
  }[];
  specifications: { key: string; value: string }[];
  stock: number;
  weight: number;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  salePercentage?: number;
  averageRating: number;
  reviewCount: number;
  productFamily?: string;
  variantType?: 'color' | 'size' | 'both';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant?: boolean;
}

interface FamilyProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  thumbnail?: string;
  variantType?: 'color' | 'size' | 'both';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant?: boolean;
  stock: number;
}

interface RelatedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  thumbnail?: string;
  isOnSale?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  salePercentage?: number;
  productFamily?: string;
  variantType?: 'color' | 'size' | 'both';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant?: boolean;
}

const maskCep = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [familyProducts, setFamilyProducts] = useState<FamilyProduct[]>([]);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cepFrete, setCepFrete] = useState('');

  // ═══ SCROLL TOP: sempre que a página de detalhe abre ou troca de produto
  // (ex: clique numa variante de cor/tamanho da família) ═══
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/slug/${slug}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);
          setFamilyProducts(data.familyProducts || []);
          setRelated(data.related || []);
          setQuantity(1);
        } else {
          router.push('/404');
        }
      } catch {
        toast.error('Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchProduct();
  }, [slug, router]);

  // ═══ FRETE: cotação automática (Melhor Envio) ao completar o CEP.
  // Somente visualização — a escolha definitiva acontece no checkout. ═══
  const {
    quotes,
    loading: freteLoading,
    error: freteError,
  } = useShippingQuotes({
    cep: cepFrete,
    items: product
      ? [{ quantity, price: product.price, weight: product.weight }]
      : [],
    subtotal: product ? product.price * quantity : 0,
  });

  if (loading) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div className='aspect-square bg-gray-100 rounded-lg animate-pulse' />
          <div className='space-y-4'>
            <div className='h-8 bg-gray-100 rounded animate-pulse w-3/4' />
            <div className='h-6 bg-gray-100 rounded animate-pulse w-1/2' />
            <div className='h-10 bg-gray-100 rounded animate-pulse w-1/3' />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const pixPrice = calculatePixPrice(product.price);
  const installment = calculateInstallments(product.price);
  const images = product.images.length > 0 ? product.images : [];

  // ═══ BADGES: desconto (compareAtPrice) + promoção/novidade ═══
  const hasDiscount = !!(
    product.compareAtPrice && product.compareAtPrice > product.price
  );
  const discountPct = hasDiscount
    ? product.salePercentage ||
      Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100,
      )
    : 0;
  const showBadges = product.isNewArrival || product.isOnSale || hasDiscount;

  const colorFamilyProducts = familyProducts.filter(
    fp => ['color', 'both'].includes(fp.variantType || '') && fp.colorCode,
  );
  const sizeFamilyProducts = familyProducts.filter(
    fp => ['size', 'both'].includes(fp.variantType || '') && fp.size,
  );

  const handleAddToCart = () => {
    addToCart(
      {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.images[0] || '',
        sku: product.sku,
        color: product.color,
        colorCode: product.colorCode,
        size: product.size,
        weight: product.weight,
        stock: product.stock,
      },
      quantity,
    );
    setShowCartModal(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={
          i < Math.round(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }
      />
    ));

  const isLight = (c: string) =>
    ['#FFFFFF', '#FFF', '#ffffff', '#fff'].includes(c);

  return (
    <div className='max-w-7xl mx-auto px-4 py-4'>
      {/* Add to Cart Modal */}
      <AddToCartModal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
      />

      {/* Breadcrumb */}
      <nav className='text-sm text-gray-500 mb-6'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        {product.category && (
          <>
            <span className='mx-2'>/</span>
            <Link
              href={`/categoria/${product.category.slug}`}
              className='hover:text-[#FF6600]'
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>{product.name}</span>
      </nav>

      {/* Product Section */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-12'>
        {/* Gallery */}
        <ProductGallery images={images} productName={product.name} />

        {/* Product Info */}
        <div className='space-y-4'>
          {/* ═══ BADGES ═══ */}
          {showBadges && (
            <div className='flex flex-wrap items-center gap-2'>
              {product.isNewArrival && (
                <span className='bg-[#FF6600] text-white font-bold rounded text-xs px-2.5 py-1'>
                  NOVIDADE
                </span>
              )}
              {product.isOnSale && (
                <span className='bg-green-600 text-white font-bold rounded text-xs px-2.5 py-1'>
                  PROMOÇÃO
                </span>
              )}
              {hasDiscount && !product.isOnSale && (
                <span className='bg-red-600 text-white font-bold rounded text-xs px-2.5 py-1'>
                  -{discountPct}%
                </span>
              )}
            </div>
          )}

          <h1 className='text-xl md:text-2xl font-bold text-[#FF6600] leading-tight'>
            {product.name}
          </h1>
          <p className='text-xs text-gray-400'>(Cód. {product.sku})</p>

          {product.reviewCount > 0 && (
            <div className='flex items-center gap-2'>
              <div className='flex'>{renderStars(product.averageRating)}</div>
              <span className='text-sm text-gray-500'>
                {product.reviewCount} avaliação
                {product.reviewCount !== 1 ? 'ões' : ''}
              </span>
            </div>
          )}

          {product.brand && (
            <Link
              href={`/marca/${product.brand.slug}`}
              className='text-sm text-gray-600 hover:text-[#FF6600] transition-colors inline-block'
            >
              {product.brand.name}
            </Link>
          )}

          {/* Price + Buy */}
          <div className='flex items-start justify-between gap-4'>
            <div>
              {product.compareAtPrice != null &&
                product.compareAtPrice > product.price && (
                  <p className='text-sm text-gray-400 line-through'>
                    de {formatCurrency(product.compareAtPrice)}
                  </p>
                )}
              <p className='text-3xl font-black text-gray-900'>
                {formatCurrency(product.price)}
              </p>
              <p className='text-sm text-gray-500'>
                {installment.count}x de{' '}
                <span className='font-semibold'>
                  {formatCurrency(installment.value)}
                </span>{' '}
                sem juros
              </p>
            </div>
            <div className='text-right'>
              {product.stock > 0 && (
                <div className='flex items-center gap-1 text-green-600 mb-2'>
                  <Check size={16} />
                  <span className='text-sm font-semibold'>EM ESTOQUE</span>
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className='px-8 py-3 bg-[#FF6600] text-white font-bold text-lg rounded-md hover:bg-[#e55b00] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
              >
                COMPRAR
              </button>
            </div>
          </div>

          {/* PIX / Boleto */}
          <div className='border rounded-lg divide-y'>
            <div className='flex items-center justify-between px-4 py-3'>
              <div className='flex items-center gap-3'>
                <span className='text-lg'>◉</span>
                <span className='text-sm font-medium'>PIX</span>
              </div>
              <div className='text-right'>
                <span className='font-bold'>{formatCurrency(pixPrice)}</span>
                <span className='text-sm text-green-600 ml-2'>
                  (10% de desconto)
                </span>
              </div>
            </div>
            <div className='flex items-center justify-between px-4 py-3'>
              <div className='flex items-center gap-3'>
                <span className='text-lg'>▨</span>
                <span className='text-sm font-medium'>Boleto</span>
              </div>
              <div className='text-right'>
                <span className='font-bold'>{formatCurrency(pixPrice)}</span>
                <span className='text-sm text-green-600 ml-2'>
                  (10% de desconto)
                </span>
              </div>
            </div>
          </div>

          {/* ═══ FAMILY COLOR VARIANTS ═══ */}
          {colorFamilyProducts.length > 1 && (
            <div>
              <p className='text-sm font-medium text-gray-700 mb-2'>
                Cor: <span className='text-[#FF6600]'>{product.color}</span>
              </p>
              <div className='flex flex-wrap gap-2'>
                {colorFamilyProducts.map(fp => {
                  const isActive = fp._id === product._id;
                  const isDual =
                    fp.colorCode2 && fp.colorCode2 !== fp.colorCode;
                  return (
                    <Link
                      key={fp._id}
                      href={`/produtos/${fp.slug}`}
                      className={`w-10 h-10 rounded-full transition-all hover:scale-110 ${isActive ? 'ring-2 ring-[#FF6600] ring-offset-2' : 'border-2 border-gray-300 hover:border-gray-500'} ${fp.stock <= 0 ? 'opacity-40' : ''}`}
                      title={fp.color}
                    >
                      {isDual ? (
                        <div
                          className='w-full h-full rounded-full overflow-hidden'
                          style={{
                            background: `linear-gradient(135deg, ${fp.colorCode} 50%, ${fp.colorCode2} 50%)`,
                            border:
                              isLight(fp.colorCode!) || isLight(fp.colorCode2!)
                                ? '1px solid #d1d5db'
                                : 'none',
                          }}
                        />
                      ) : (
                        <div
                          className='w-full h-full rounded-full'
                          style={{
                            backgroundColor: fp.colorCode,
                            border: isLight(fp.colorCode!)
                              ? '1px solid #d1d5db'
                              : 'none',
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ FAMILY SIZE VARIANTS ═══ */}
          {sizeFamilyProducts.length > 1 && (
            <div>
              <p className='text-sm font-medium text-gray-700 mb-2'>
                Tamanho: <span className='text-[#FF6600]'>{product.size}</span>
              </p>
              <div className='flex flex-wrap gap-2'>
                {sizeFamilyProducts.map(fp => {
                  const isActive = fp._id === product._id;
                  return (
                    <Link
                      key={fp._id}
                      href={`/produtos/${fp.slug}`}
                      className={`px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ${isActive ? 'border-[#FF6600] bg-[#FF6600]/10 text-[#FF6600]' : 'border-gray-300 text-gray-600 hover:border-gray-500'} ${fp.stock <= 0 ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      {fp.size}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legacy Variants */}
          {product.variants.map((variant, vi) => (
            <div key={vi}>
              <p className='text-sm font-medium text-gray-700 mb-2'>
                {variant.name}:
              </p>
              <div className='flex flex-wrap gap-2'>
                {variant.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() =>
                      setSelectedVariants(prev => ({
                        ...prev,
                        [variant.name]: opt.value,
                      }))
                    }
                    className={`px-3 py-1.5 border rounded-md text-sm transition-colors ${selectedVariants[variant.name] === opt.value ? 'border-[#FF6600] bg-[#FF6600]/10 text-[#FF6600] font-medium' : 'border-gray-300 text-gray-600 hover:border-gray-500'} ${opt.stock <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    disabled={opt.stock <= 0}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-gray-700'>
              Quantidade:
            </span>
            <div className='flex items-center border border-gray-300 rounded-md'>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className='px-3 py-1.5 text-gray-600 hover:bg-gray-100'
              >
                &minus;
              </button>
              <span className='px-4 py-1.5 text-sm font-medium border-x border-gray-300'>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                className='px-3 py-1.5 text-gray-600 hover:bg-gray-100'
              >
                +
              </button>
            </div>
          </div>

          {/* ═══ FRETE: cotação real Melhor Envio (somente visualização) ═══ */}
          <div className='border-t pt-4'>
            <div className='flex items-center gap-3 mb-2'>
              <Truck size={18} className='text-gray-500' />
              <span className='text-sm font-medium text-gray-700'>
                Frete e prazo
              </span>
            </div>
            <div className='relative w-40'>
              <input
                type='text'
                inputMode='numeric'
                placeholder='Digite seu CEP'
                maxLength={9}
                value={cepFrete}
                onChange={e => setCepFrete(maskCep(e.target.value))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
              {freteLoading && (
                <Loader2
                  size={16}
                  className='absolute right-3 top-2.5 animate-spin text-gray-400'
                />
              )}
            </div>
            <a
              href='https://buscacepinter.correios.com.br/app/endereco/index.php'
              target='_blank'
              rel='noopener noreferrer'
              className='text-xs text-gray-400 hover:text-[#FF6600] mt-1 inline-block'
            >
              Não sei meu CEP
            </a>

            {freteError && (
              <p className='mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600'>
                {freteError}
              </p>
            )}

            {quotes.length > 0 && (
              <div className='mt-3 overflow-hidden rounded-lg border border-gray-200'>
                {quotes.map((q, i) => (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between px-3 py-2 text-sm ${
                      i % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className='flex flex-wrap items-center gap-1.5'>
                      <span className='font-medium text-gray-800'>
                        {q.company} — {q.name}
                      </span>
                      {q.cheapest && !q.isFree && (
                        <span className='rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700'>
                          Mais barata
                        </span>
                      )}
                      {q.fastest && (
                        <span className='inline-flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700'>
                          <Zap className='h-2.5 w-2.5' /> Mais rápida
                        </span>
                      )}
                      <span className='text-xs text-gray-500'>
                        · até {q.deliveryDays}{' '}
                        {q.deliveryDays === 1 ? 'dia útil' : 'dias úteis'}
                      </span>
                    </div>
                    <div className='text-right'>
                      {q.isFree ? (
                        <>
                          <span className='mr-1.5 text-xs text-gray-400 line-through'>
                            {formatCurrency(q.price)}
                          </span>
                          <span className='font-bold text-green-600'>
                            Grátis
                          </span>
                        </>
                      ) : (
                        <span className='font-bold text-gray-900'>
                          {formatCurrency(q.price)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <p className='bg-white px-3 py-1.5 text-center text-[11px] text-gray-400'>
                  Cotação via Melhor Envio · você escolhe o envio no checkout
                </p>
              </div>
            )}
          </div>

          {/* Share + Wishlist */}
          <div className='flex items-center justify-between border-t pt-4'>
            <div>
              <p className='text-xs text-gray-500 mb-2 uppercase font-medium'>
                Compartilhar
              </p>
              <button
                onClick={handleShare}
                className='flex items-center gap-2 text-sm text-gray-600 hover:text-[#FF6600] transition-colors'
              >
                <Share2 size={18} /> Compartilhar
              </button>
            </div>
            <div>
              <p className='text-xs text-gray-500 mb-2 uppercase font-medium'>
                Lista de desejos
              </p>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center gap-2 text-sm border rounded-md px-4 py-2 transition-colors ${isFavorite ? 'border-[#FF6600] text-[#FF6600]' : 'border-gray-300 text-gray-600 hover:border-[#FF6600] hover:text-[#FF6600]'}`}
              >
                <Heart
                  size={16}
                  className={isFavorite ? 'fill-[#FF6600]' : ''}
                />{' '}
                {isFavorite ? 'Adicionado' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className='mb-12'>
        <div className='mb-6'>
          <span className='bg-[#FF6600] text-white px-6 py-3 font-bold text-sm uppercase inline-block'>
            Informações do Produto
          </span>
        </div>
        <div className='prose max-w-none text-gray-700 text-sm leading-relaxed'>
          {product.richDescription ? (
            <div
              dangerouslySetInnerHTML={{
                __html: product.richDescription || '',
              }}
            />
          ) : (
            <p className='whitespace-pre-line'>{product.description}</p>
          )}
        </div>
      </div>

      {/* Specifications */}
      {product.specifications.length > 0 && (
        <div className='mb-12'>
          <h2 className='text-lg font-bold text-gray-900 mb-4'>
            Informações Técnicas
          </h2>
          <table className='w-full'>
            <tbody>
              {product.specifications.map((spec, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className='px-4 py-3 text-sm font-medium text-gray-700 w-1/3'>
                    {spec.key}
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-600'>
                    {spec.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reviews */}
      <div className='mb-12 text-center'>
        <div className='mb-6'>
          <ShoppingCart size={40} className='mx-auto text-[#FF6600] mb-2' />
          <h2 className='text-xl font-bold text-gray-900 uppercase'>
            Opinião dos Clientes
          </h2>
          {product.reviewCount > 0 ? (
            <div className='flex items-center justify-center gap-2 mt-2'>
              <div className='flex'>{renderStars(product.averageRating)}</div>
              <span className='text-sm text-gray-500'>
                {product.averageRating.toFixed(1)} de 5 estrelas |{' '}
                {product.reviewCount} avaliação
                {product.reviewCount !== 1 ? 'ões' : ''}
              </span>
            </div>
          ) : (
            <p className='text-sm text-gray-400 mt-2'>
              Nenhuma avaliação ainda
            </p>
          )}
        </div>
        <button className='px-6 py-2.5 bg-[#FF6600] text-white font-medium rounded-md hover:bg-[#e55b00] transition-colors inline-flex items-center gap-2'>
          <Star size={16} /> Avaliar este produto
        </button>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className='mb-12'>
          <h2 className='text-xl font-bold text-gray-900 uppercase mb-2'>
            Você também deve gostar
          </h2>
          <div className='border-t-2 border-gray-200 mb-6' />
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {related.slice(0, 4).map(prod => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
