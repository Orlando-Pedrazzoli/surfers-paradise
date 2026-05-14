'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Filter,
  X,
  AlertCircle,
  PackageX,
  Store,
  Globe,
  Loader2,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  gtin?: string;
  price: number;
  compareAtPrice: number;
  costPrice: number;
  stock: number;
  images: string[];
  isActive: boolean;
  isAvailableInStore: boolean;
  isPublishedOnline: boolean;
  completionStatus: 'incomplete' | 'partial' | 'complete';
  category: { _id: string; name: string } | null;
  brand: { _id: string; name: string } | null;
  supplier: { _id: string; name: string } | null;
  productFamily?: string;
  isMainVariant?: boolean;
  color?: string;
  size?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Facets {
  total: number;
  status: { complete: number; partial: number; incomplete: number };
  channel: { inStore: number; online: number };
  stock: { outOfStock: number; lowStock: number; inStock: number };
  brands: { _id: string; name: string; count: number }[];
  suppliers: { _id: string; name: string; count: number }[];
  categories: { _id: string; name: string; count: number }[];
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function AdminProdutosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado da listagem
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState<Facets | null>(null);

  // Estado da busca (input controlado)
  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') || '',
  );

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filtros lidos da URL
  const filters = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      status: searchParams.getAll('status'),
      channel: searchParams.getAll('channel'),
      stock: searchParams.getAll('stock'),
      brands: searchParams.getAll('brand'),
      suppliers: searchParams.getAll('supplier'),
      categories: searchParams.getAll('category'),
      page: parseInt(searchParams.get('page') || '1'),
    };
  }, [searchParams]);

  const activeFiltersCount =
    filters.status.length +
    filters.channel.length +
    filters.stock.length +
    filters.brands.length +
    filters.suppliers.length +
    filters.categories.length +
    (filters.search ? 1 : 0);

  // Atualizar URL com filtros
  const updateURL = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        params.delete(key);
        if (value === null || value === '') return;
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value);
        }
      });

      router.push(`/admin/produtos?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Toggle filtro multi-select (adiciona ou remove valor)
  const toggleFilter = (key: string, value: string) => {
    const current = searchParams.getAll(key);
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateURL({ [key]: updated, page: null });
  };

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setSearchInput('');
    router.push('/admin/produtos', { scroll: false });
  };

  // Buscar (Enter ou botão)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ search: searchInput || null, page: null });
  };

  // Carregar produtos
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('context', 'admin');
      params.set('page', filters.page.toString());
      params.set('limit', '20');
      params.set('sort', '-createdAt');

      if (filters.search) params.set('search', filters.search);

      // Mapear filtros para query params da API
      if (filters.status.length === 1) {
        params.set('completionStatus', filters.status[0]);
      }
      if (filters.channel.includes('inStore')) {
        params.set('isAvailableInStore', 'true');
      }
      if (filters.channel.includes('online')) {
        params.set('isPublishedOnline', 'true');
      }
      if (filters.stock.includes('outOfStock')) {
        params.set('outOfStock', 'true');
      } else if (filters.stock.includes('lowStock')) {
        params.set('lowStock', 'true');
      }
      // Brand / Supplier / Category: o backend só aceita 1 por enquanto
      if (filters.brands.length === 1) params.set('brand', filters.brands[0]);
      if (filters.suppliers.length === 1)
        params.set('supplier', filters.suppliers[0]);
      if (filters.categories.length === 1)
        params.set('category', filters.categories[0]);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
        setSelected(new Set()); // Reset selection on new fetch
      }
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Carregar facets (contadores dos filtros)
  const fetchFacets = useCallback(async () => {
    try {
      const res = await fetch('/api/products/facets');
      const data = await res.json();
      if (data.success) setFacets(data.facets);
    } catch {
      // Silent fail — não bloqueia a página
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchFacets();
  }, []);

  // Sincroniza input quando URL muda externamente
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Bulk actions
  const toggleSelectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map(p => p._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleBulkAction = async (
    action: 'publish' | 'unpublish' | 'activate' | 'deactivate' | 'delete',
  ) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    const labels = {
      publish: 'publicar online',
      unpublish: 'despublicar',
      activate: 'ativar',
      deactivate: 'desativar',
      delete: 'excluir',
    };

    if (
      !confirm(
        `Tem certeza que quer ${labels[action]} ${ids.length} produto(s)?`,
      )
    ) {
      return;
    }

    setBulkLoading(true);
    const errors: string[] = [];
    let success = 0;

    for (const id of ids) {
      try {
        if (action === 'delete') {
          const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) success++;
          else errors.push(`${id}: ${data.error}`);
        } else {
          const body: Record<string, boolean> = {};
          if (action === 'publish') body.isPublishedOnline = true;
          if (action === 'unpublish') body.isPublishedOnline = false;
          if (action === 'activate') body.isActive = true;
          if (action === 'deactivate') body.isActive = false;

          const res = await fetch(`/api/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (data.success) success++;
          else errors.push(`${id}: ${data.error}`);
        }
      } catch {
        errors.push(`${id}: erro de rede`);
      }
    }

    setBulkLoading(false);

    if (success > 0) toast.success(`${success} produto(s) atualizado(s)`);
    if (errors.length > 0) {
      toast.error(
        `${errors.length} falha(s). Verifique se o produto está completo.`,
      );
      console.warn('Bulk action errors:', errors);
    }

    fetchProducts();
    fetchFacets();
  };

  const handleDeleteSingle = async (id: string, name: string) => {
    if (!confirm(`Remover o produto "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Produto removido!');
        fetchProducts();
        fetchFacets();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao remover produto');
    }
  };

  const goToPage = (page: number) => {
    updateURL({ page: page.toString() });
  };

  // Status visual config
  const statusBadge = (status: string) => {
    if (status === 'complete')
      return (
        <span
          className='inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded'
          title='Completo — pronto para vender em todos os canais'
        >
          <CheckCircle2 size={10} />
          COMPLETO
        </span>
      );
    if (status === 'partial')
      return (
        <span
          className='inline-flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded'
          title='Parcial — vende no balcão, faltam dados para site'
        >
          <Circle size={10} />
          PARCIAL
        </span>
      );
    return (
      <span
        className='inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded'
        title='Incompleto — faltam dados mínimos'
      >
        <AlertCircle size={10} />
        INCOMPLETO
      </span>
    );
  };

  return (
    <div>
      {/* HEADER */}
      <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold'>Produtos</h1>
          {facets && (
            <p className='text-sm text-gray-500 mt-1'>
              {facets.total} no catálogo · {facets.channel.online} no site ·{' '}
              {facets.stock.lowStock} estoque baixo · {facets.stock.outOfStock}{' '}
              esgotados
            </p>
          )}
        </div>
        <Link
          href='/admin/produtos/novo'
          className='flex items-center gap-2 px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors'
        >
          <Plus size={18} />
          Novo Produto
        </Link>
      </div>

      {/* SEARCH + ACTIVE FILTERS */}
      <div className='mb-4'>
        <form onSubmit={handleSearch} className='flex gap-2 mb-3'>
          <div className='relative flex-1'>
            <Search
              size={18}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            />
            <input
              type='text'
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder='Buscar por nome, SKU, GTIN ou tag...'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
            />
          </div>
          <button
            type='submit'
            className='px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors'
          >
            Buscar
          </button>
        </form>

        {activeFiltersCount > 0 && (
          <div className='flex items-center gap-2 text-sm'>
            <Filter size={14} className='text-gray-400' />
            <span className='text-gray-600'>
              {activeFiltersCount} filtro{activeFiltersCount !== 1 && 's'} ativo
              {activeFiltersCount !== 1 && 's'}
            </span>
            <button
              onClick={clearAllFilters}
              className='text-[#FF6600] hover:underline'
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* GRID: SIDEBAR + TABLE */}
      <div className='grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4'>
        {/* SIDEBAR FILTERS */}
        <aside className='bg-white rounded-lg shadow-sm p-4 h-fit lg:sticky lg:top-4'>
          <h2 className='text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide'>
            Filtros
          </h2>

          {/* STATUS */}
          {facets && (
            <div className='mb-5'>
              <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
                Status
              </p>
              <div className='space-y-1.5'>
                <FilterCheckbox
                  label='🟢 Completo'
                  count={facets.status.complete}
                  checked={filters.status.includes('complete')}
                  onChange={() => toggleFilter('status', 'complete')}
                />
                <FilterCheckbox
                  label='🟡 Parcial'
                  count={facets.status.partial}
                  checked={filters.status.includes('partial')}
                  onChange={() => toggleFilter('status', 'partial')}
                />
                <FilterCheckbox
                  label='🔴 Incompleto'
                  count={facets.status.incomplete}
                  checked={filters.status.includes('incomplete')}
                  onChange={() => toggleFilter('status', 'incomplete')}
                />
              </div>
            </div>
          )}

          {/* CHANNEL */}
          {facets && (
            <div className='mb-5'>
              <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
                Canal de Venda
              </p>
              <div className='space-y-1.5'>
                <FilterCheckbox
                  label='🏪 Balcão'
                  count={facets.channel.inStore}
                  checked={filters.channel.includes('inStore')}
                  onChange={() => toggleFilter('channel', 'inStore')}
                />
                <FilterCheckbox
                  label='🌐 Site'
                  count={facets.channel.online}
                  checked={filters.channel.includes('online')}
                  onChange={() => toggleFilter('channel', 'online')}
                />
              </div>
            </div>
          )}

          {/* STOCK */}
          {facets && (
            <div className='mb-5'>
              <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
                Estoque
              </p>
              <div className='space-y-1.5'>
                <FilterCheckbox
                  label='Esgotado'
                  count={facets.stock.outOfStock}
                  checked={filters.stock.includes('outOfStock')}
                  onChange={() => toggleFilter('stock', 'outOfStock')}
                />
                <FilterCheckbox
                  label='Baixo (≤3)'
                  count={facets.stock.lowStock}
                  checked={filters.stock.includes('lowStock')}
                  onChange={() => toggleFilter('stock', 'lowStock')}
                />
                <FilterCheckbox
                  label='Em stock'
                  count={facets.stock.inStock}
                  checked={filters.stock.includes('inStock')}
                  onChange={() => toggleFilter('stock', 'inStock')}
                />
              </div>
            </div>
          )}

          {/* BRANDS */}
          {facets && facets.brands.length > 0 && (
            <div className='mb-5'>
              <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
                Marca
              </p>
              <div className='space-y-1.5 max-h-48 overflow-y-auto'>
                {facets.brands.map(b => (
                  <FilterCheckbox
                    key={b._id}
                    label={b.name}
                    count={b.count}
                    checked={filters.brands.includes(b._id)}
                    onChange={() => toggleFilter('brand', b._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SUPPLIERS */}
          {facets && facets.suppliers.length > 0 && (
            <div className='mb-5'>
              <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
                Fornecedor
              </p>
              <div className='space-y-1.5 max-h-48 overflow-y-auto'>
                {facets.suppliers.map(s => (
                  <FilterCheckbox
                    key={s._id}
                    label={s.name}
                    count={s.count}
                    checked={filters.suppliers.includes(s._id)}
                    onChange={() => toggleFilter('supplier', s._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIES */}
          {facets && facets.categories.length > 0 && (
            <div className='mb-5'>
              <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
                Categoria
              </p>
              <div className='space-y-1.5 max-h-48 overflow-y-auto'>
                {facets.categories.map(c => (
                  <FilterCheckbox
                    key={c._id}
                    label={c.name}
                    count={c.count}
                    checked={filters.categories.includes(c._id)}
                    onChange={() => toggleFilter('category', c._id)}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* MAIN TABLE */}
        <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
          {loading ? (
            <div className='p-12 flex items-center justify-center'>
              <Loader2 size={32} className='animate-spin text-[#FF6600]' />
            </div>
          ) : products.length === 0 ? (
            <div className='p-12 text-center text-gray-500'>
              <Package size={48} className='mx-auto mb-3 opacity-50' />
              <p className='font-medium'>Nenhum produto encontrado</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className='mt-3 text-[#FF6600] hover:underline text-sm'
                >
                  Limpar filtros para ver todos
                </button>
              )}
            </div>
          ) : (
            <>
              {/* BULK ACTIONS BAR */}
              {selected.size > 0 && (
                <div className='bg-gray-900 text-white p-3 flex items-center gap-3 flex-wrap'>
                  <span className='text-sm font-medium'>
                    {selected.size} selecionado{selected.size !== 1 && 's'}
                  </span>
                  <button
                    onClick={() => handleBulkAction('publish')}
                    disabled={bulkLoading}
                    className='text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50'
                  >
                    Publicar no site
                  </button>
                  <button
                    onClick={() => handleBulkAction('unpublish')}
                    disabled={bulkLoading}
                    className='text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50'
                  >
                    Despublicar
                  </button>
                  <button
                    onClick={() => handleBulkAction('activate')}
                    disabled={bulkLoading}
                    className='text-xs bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50'
                  >
                    Ativar
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    disabled={bulkLoading}
                    className='text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50'
                  >
                    Desativar
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    disabled={bulkLoading}
                    className='text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50'
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className='ml-auto text-xs text-gray-300 hover:text-white'
                  >
                    Limpar seleção
                  </button>
                </div>
              )}

              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='bg-gray-50 border-b'>
                    <tr>
                      <th className='w-10 p-3'>
                        <input
                          type='checkbox'
                          checked={
                            products.length > 0 &&
                            selected.size === products.length
                          }
                          onChange={toggleSelectAll}
                          className='w-4 h-4 rounded cursor-pointer'
                        />
                      </th>
                      <th className='text-left p-3 font-medium text-gray-600'>
                        Produto
                      </th>
                      <th className='text-left p-3 font-medium text-gray-600'>
                        Marca / Fornecedor
                      </th>
                      <th className='text-right p-3 font-medium text-gray-600'>
                        Preço
                      </th>
                      <th className='text-center p-3 font-medium text-gray-600'>
                        Estoque
                      </th>
                      <th className='text-left p-3 font-medium text-gray-600'>
                        Status / Canais
                      </th>
                      <th className='text-right p-3 font-medium text-gray-600'>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {products.map(p => {
                      const isChecked = selected.has(p._id);
                      const stockColor =
                        p.stock === 0
                          ? 'text-red-600 bg-red-50'
                          : p.stock <= 3
                            ? 'text-orange-600 bg-orange-50'
                            : 'text-green-700 bg-green-50';

                      return (
                        <tr
                          key={p._id}
                          className={`hover:bg-gray-50 ${isChecked ? 'bg-blue-50' : ''}`}
                        >
                          {/* CHECKBOX */}
                          <td className='p-3'>
                            <input
                              type='checkbox'
                              checked={isChecked}
                              onChange={() => toggleSelect(p._id)}
                              className='w-4 h-4 rounded cursor-pointer'
                            />
                          </td>

                          {/* PRODUTO (imagem + nome + SKU + GTIN) */}
                          <td className='p-3'>
                            <div className='flex items-center gap-3'>
                              {p.images[0] ? (
                                <Image
                                  src={p.images[0]}
                                  alt={p.name}
                                  width={48}
                                  height={48}
                                  className='rounded object-cover flex-shrink-0'
                                />
                              ) : (
                                <div className='w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0'>
                                  <Package
                                    size={16}
                                    className='text-gray-400'
                                  />
                                </div>
                              )}
                              <div className='min-w-0'>
                                <p className='font-medium text-gray-900 line-clamp-1'>
                                  {p.name}
                                </p>
                                <p className='text-xs text-gray-400 font-mono'>
                                  SKU: {p.sku}
                                  {p.gtin && ` · GTIN: ${p.gtin}`}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* MARCA / FORNECEDOR */}
                          <td className='p-3'>
                            <div className='text-xs space-y-0.5'>
                              {p.brand && (
                                <p className='text-gray-700 font-medium'>
                                  {p.brand.name}
                                </p>
                              )}
                              {p.supplier && (
                                <p className='text-gray-500'>
                                  {p.supplier.name}
                                </p>
                              )}
                              {!p.brand && !p.supplier && (
                                <span className='text-gray-300'>—</span>
                              )}
                            </div>
                          </td>

                          {/* PREÇO */}
                          <td className='p-3 text-right'>
                            <p className='font-medium text-gray-900'>
                              {formatPrice(p.price)}
                            </p>
                            {p.costPrice > 0 && (
                              <p className='text-[10px] text-gray-400'>
                                Margem:{' '}
                                {((1 - p.costPrice / p.price) * 100).toFixed(0)}
                                %
                              </p>
                            )}
                          </td>

                          {/* ESTOQUE */}
                          <td className='p-3 text-center'>
                            <span
                              className={`inline-block font-bold text-sm px-2 py-0.5 rounded ${stockColor}`}
                            >
                              {p.stock}
                            </span>
                          </td>

                          {/* STATUS + CANAIS */}
                          <td className='p-3'>
                            <div className='flex flex-col gap-1'>
                              {statusBadge(p.completionStatus)}
                              <div className='flex gap-1'>
                                {p.isAvailableInStore && (
                                  <span
                                    className='inline-flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded'
                                    title='Disponível no balcão'
                                  >
                                    <Store size={10} />
                                  </span>
                                )}
                                {p.isPublishedOnline && (
                                  <span
                                    className='inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded'
                                    title='Publicado no site'
                                  >
                                    <Globe size={10} />
                                  </span>
                                )}
                                {!p.isActive && (
                                  <span
                                    className='inline-flex items-center gap-0.5 text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded'
                                    title='Desativado'
                                  >
                                    <EyeOff size={10} />
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* AÇÕES */}
                          <td className='p-3 text-right'>
                            <div className='flex items-center justify-end gap-1'>
                              <Link
                                href={`/admin/produtos/${p._id}`}
                                className='p-2 text-gray-400 hover:text-[#FF6600] transition-colors'
                                title='Editar'
                              >
                                <Pencil size={16} />
                              </Link>
                              <button
                                onClick={() =>
                                  handleDeleteSingle(p._id, p.name)
                                }
                                className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                                title='Excluir'
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

              {/* PAGINATION */}
              {pagination.pages > 1 && (
                <div className='flex items-center justify-between p-4 border-t bg-gray-50'>
                  <p className='text-sm text-gray-500'>
                    {pagination.total} produto{pagination.total !== 1 && 's'} ·
                    Página {pagination.page} de {pagination.pages}
                  </p>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className='p-2 border rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className='p-2 border rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT — Filter Checkbox com contador
// ═══════════════════════════════════════════════════════════════

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  const disabled = count === 0 && !checked;

  return (
    <label
      className={`flex items-center justify-between gap-2 text-sm py-1 px-1 rounded transition-colors cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
    >
      <div className='flex items-center gap-2 min-w-0'>
        <input
          type='checkbox'
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className='w-4 h-4 rounded cursor-pointer'
        />
        <span className='text-gray-700 truncate'>{label}</span>
      </div>
      <span className='text-xs text-gray-400 flex-shrink-0'>{count}</span>
    </label>
  );
}
