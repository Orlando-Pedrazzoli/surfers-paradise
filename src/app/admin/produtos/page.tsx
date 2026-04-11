'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  category: { _id: string; name: string } | null;
  brand: { _id: string; name: string } | null;
  createdAt: string;
  // ═══ FAMILY FIELDS ═══
  productFamily?: string;
  variantType?: 'color' | 'size';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = useCallback(async (page: number, query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort: '-createdAt',
        admin: 'true', // ═══ SHOW ALL PRODUCTS INCLUDING NON-MAIN VARIANTS ═══
      });
      if (query) params.set('search', query);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(pagination.page, searchQuery);
  }, [pagination.page, searchQuery, fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover o produto "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Produto removido!');
        fetchProducts(pagination.page, searchQuery);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao remover produto');
    }
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  if (loading && products.length === 0) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
      </div>
    );
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Produtos</h1>
        <Link
          href='/admin/produtos/novo'
          className='flex items-center gap-2 px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors'
        >
          <Plus size={18} />
          Novo Produto
        </Link>
      </div>

      <form onSubmit={handleSearch} className='mb-6'>
        <div className='flex gap-2'>
          <div className='relative flex-1'>
            <Search
              size={18}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            />
            <input
              type='text'
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Buscar por nome, SKU ou tag...'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
            />
          </div>
          <button
            type='submit'
            className='px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors'
          >
            Buscar
          </button>
        </div>
      </form>

      <div className='bg-white rounded-lg shadow-sm'>
        {products.length === 0 ? (
          <div className='p-12 text-center text-gray-500'>
            <Package size={48} className='mx-auto mb-3 opacity-50' />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-50 border-b'>
                  <tr>
                    <th className='text-left p-4 font-medium text-gray-600'>
                      Produto
                    </th>
                    <th className='text-left p-4 font-medium text-gray-600'>
                      Cor / Tamanho
                    </th>
                    <th className='text-left p-4 font-medium text-gray-600'>
                      Categoria
                    </th>
                    <th className='text-left p-4 font-medium text-gray-600'>
                      Preço
                    </th>
                    <th className='text-left p-4 font-medium text-gray-600'>
                      Estoque
                    </th>
                    <th className='text-left p-4 font-medium text-gray-600'>
                      Status
                    </th>
                    <th className='text-right p-4 font-medium text-gray-600'>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {products.map(product => {
                    const isLight = (c: string) =>
                      ['#FFFFFF', '#FFF', '#ffffff', '#fff'].includes(c);
                    const isDual =
                      product.colorCode2 &&
                      product.colorCode2 !== product.colorCode;

                    return (
                      <tr key={product._id} className='hover:bg-gray-50'>
                        {/* Product Name + Image + SKU + Weight + Family Badge */}
                        <td className='p-4'>
                          <div className='flex items-center gap-3'>
                            {product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={48}
                                height={48}
                                className='rounded object-cover'
                              />
                            ) : (
                              <div className='w-12 h-12 bg-gray-100 rounded flex items-center justify-center'>
                                <Package size={16} className='text-gray-400' />
                              </div>
                            )}
                            <div>
                              <div className='flex items-center gap-2'>
                                <p className='font-medium text-gray-900 line-clamp-1'>
                                  {product.name}
                                </p>
                                {/* P = Principal, V = Variante */}
                                {product.productFamily && (
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      product.isMainVariant
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    {product.isMainVariant ? 'P' : 'V'}
                                  </span>
                                )}
                              </div>
                              <p className='text-xs text-gray-400'>
                                {product.sku}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Color / Size */}
                        <td className='p-4'>
                          {product.variantType === 'color' &&
                          product.colorCode ? (
                            <div className='flex items-center gap-2'>
                              <span
                                className='w-6 h-6 rounded-full border border-gray-300 flex-shrink-0'
                                style={
                                  isDual
                                    ? {
                                        background: `linear-gradient(135deg, ${product.colorCode} 50%, ${product.colorCode2} 50%)`,
                                        border:
                                          isLight(product.colorCode!) ||
                                          isLight(product.colorCode2!)
                                            ? '1px solid #d1d5db'
                                            : undefined,
                                      }
                                    : {
                                        backgroundColor: product.colorCode,
                                        border: isLight(product.colorCode!)
                                          ? '1px solid #d1d5db'
                                          : undefined,
                                      }
                                }
                              />
                              <div>
                                <p className='text-sm text-gray-700'>
                                  {product.color}
                                </p>
                                <p className='text-[10px] text-gray-400'>
                                  {isDual ? 'Bicolor' : 'Cor'}
                                </p>
                              </div>
                            </div>
                          ) : product.variantType === 'size' && product.size ? (
                            <span className='inline-block bg-gray-100 text-gray-700 text-sm font-medium px-2.5 py-1 rounded border border-gray-300'>
                              {product.size}
                            </span>
                          ) : (
                            <span className='text-gray-300'>—</span>
                          )}
                        </td>

                        {/* Category */}
                        <td className='p-4 text-gray-600'>
                          {product.category?.name || '—'}
                        </td>

                        {/* Price */}
                        <td className='p-4'>
                          <div>
                            <p className='font-medium'>
                              {formatPrice(product.price)}
                            </p>
                            {product.compareAtPrice > 0 && (
                              <p className='text-xs text-gray-400 line-through'>
                                {formatPrice(product.compareAtPrice)}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className='p-4'>
                          <span
                            className={`font-medium ${product.stock <= 0 ? 'text-red-600' : product.stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}
                          >
                            {product.stock}
                          </span>
                        </td>

                        {/* Status */}
                        <td className='p-4'>
                          <div className='flex flex-wrap gap-1'>
                            {product.isActive ? (
                              <span className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded'>
                                Ativo
                              </span>
                            ) : (
                              <span className='text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded'>
                                Inativo
                              </span>
                            )}
                            {product.isFeatured && (
                              <span className='text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded'>
                                Destaque
                              </span>
                            )}
                            {product.isOnSale && (
                              <span className='text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded'>
                                Promoção
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className='p-4 text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <Link
                              href={`/admin/produtos/${product._id}`}
                              className='p-2 text-gray-400 hover:text-[#FF6600] transition-colors'
                            >
                              <Pencil size={16} />
                            </Link>
                            <button
                              onClick={() =>
                                handleDelete(product._id, product.name)
                              }
                              className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className='flex items-center justify-between p-4 border-t'>
                <p className='text-sm text-gray-500'>
                  {pagination.total} produto{pagination.total !== 1 && 's'} —
                  Página {pagination.page} de {pagination.pages}
                </p>
                <div className='flex gap-2'>
                  <button
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={pagination.page <= 1}
                    className='p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={pagination.page >= pagination.pages}
                    className='p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
