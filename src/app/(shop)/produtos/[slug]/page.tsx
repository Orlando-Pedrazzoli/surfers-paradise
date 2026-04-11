'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronUp,
  ChevronDown,
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Check,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {
  calculateInstallments,
  calculatePixPrice,
} from '@/lib/utils/installments';
import ProductCard from '@/components/product/ProductCard';

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
  // ═══ FAMILY FIELDS ═══
  productFamily?: string;
  variantType?: 'color' | 'size';
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
  variantType?: 'color' | 'size';
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
  variantType?: 'color' | 'size';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant?: boolean;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [familyProducts, setFamilyProducts] = useState<FamilyProduct[]>([]);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [thumbStart, setThumbStart] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/slug/${slug}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);
          setFamilyProducts(data.familyProducts || []);
          setRelated(data.related || []);
          setCurrentImage(0);
          setThumbStart(0);
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
  const maxThumbs = 5;
  const visibleThumbs = images.slice(thumbStart, thumbStart + maxThumbs);

  // Family variants
  const colorFamilyProducts = familyProducts.filter(
    fp => ['color', 'both'].includes(fp.variantType || '') && fp.colorCode,
  );
  const sizeFamilyProducts = familyProducts.filter(
    fp => ['size', 'both'].includes(fp.variantType || '') && fp.size,
  );

  const handleAddToCart = () => {
    toast.success('Produto adicionado ao carrinho!');
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
      <div className='grid grid-cols-1 md:grid-cols-[1fr_1fr] lg:grid-cols-[100px_1fr_1fr] gap-6 mb-12'>
        {/* Thumbnails — Desktop */}
        <div className='hidden lg:flex flex-col items-center gap-2'>
          {images.length > maxThumbs && thumbStart > 0 && (
            <button
              onClick={() => setThumbStart(prev => Math.max(0, prev - 1))}
              className='w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600'
            >
              <ChevronUp size={20} />
            </button>
          )}
          {visibleThumbs.map((img, i) => {
            const realIndex = thumbStart + i;
            return (
              <button
                key={realIndex}
                onClick={() => setCurrentImage(realIndex)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${currentImage === realIndex ? 'border-[#FF6600]' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <Image
                  src={img}
                  alt={`${product.name} ${realIndex + 1}`}
                  width={80}
                  height={80}
                  className='w-full h-full object-contain p-1'
                />
              </button>
            );
          })}
          {images.length > maxThumbs &&
            thumbStart + maxThumbs < images.length && (
              <button
                onClick={() => setThumbStart(prev => prev + 1)}
                className='w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600'
              >
                <ChevronDown size={20} />
              </button>
            )}
        </div>

        {/* Main Image */}
        <div className='relative aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden'>
          {images.length > 0 ? (
            <Image
              src={images[currentImage]}
              alt={product.name}
              fill
              priority
              sizes='(max-width: 768px) 100vw, 50vw'
              className='object-contain p-6'
            />
          ) : (
            <div className='flex items-center justify-center h-full text-gray-300'>
              Sem imagem
            </div>
          )}
          {images.length > 1 && (
            <div className='lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5'>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-2.5 h-2.5 rounded-full ${i === currentImage ? 'bg-[#FF6600]' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className='space-y-4'>
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
                      className={`w-10 h-10 rounded-full transition-all hover:scale-110 ${
                        isActive
                          ? 'ring-2 ring-[#FF6600] ring-offset-2'
                          : 'border-2 border-gray-300 hover:border-gray-500'
                      } ${fp.stock <= 0 ? 'opacity-40' : ''}`}
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
                      className={`px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-[#FF6600] bg-[#FF6600]/10 text-[#FF6600]'
                          : 'border-gray-300 text-gray-600 hover:border-gray-500'
                      } ${fp.stock <= 0 ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      {fp.size}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legacy Variants (kept for backward compatibility) */}
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

          {/* Shipping */}
          <div className='border-t pt-4'>
            <div className='flex items-center gap-3 mb-2'>
              <Truck size={18} className='text-gray-500' />
              <span className='text-sm font-medium text-gray-700'>
                Frete e prazo
              </span>
            </div>
            <div className='flex gap-2'>
              <input
                type='text'
                placeholder='CEP'
                maxLength={9}
                className='w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
              <button className='px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors'>
                Calcular
              </button>
            </div>
            <a
              href='https://buscacepinter.correios.com.br/app/endereco/index.php'
              target='_blank'
              rel='noopener noreferrer'
              className='text-xs text-gray-400 hover:text-[#FF6600] mt-1 inline-block'
            >
              Não sei meu CEP
            </a>
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
