'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface BrandFacet {
  _id: string;
  name: string;
  slug: string;
  count: number;
}

interface SubcategoryFacet {
  _id: string;
  name: string;
  slug: string;
  count: number;
}

interface ValueFacet {
  value: string;
  count: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface Facets {
  brands: BrandFacet[];
  subcategories: SubcategoryFacet[];
  setups: ValueFacet[];
  constructions: ValueFacet[];
  templates: ValueFacet[];
  sizes: ValueFacet[];
  priceRange: PriceRange;
}

interface QuilhasFiltersProps {
  categorySlug?: string;
  selectedBrand?: string;
  selectedSetup?: string;
  selectedConstruction?: string;
  selectedTemplate?: string;
  selectedSize?: string;
  selectedSubcategory?: string;
  minPrice?: string;
  maxPrice?: string;
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  onClearFilters: () => void;
}

// Labels amigáveis para os setups
const SETUP_LABELS: Record<string, string> = {
  thruster: 'Thruster (3 quilhas)',
  twin: 'Twin (2 quilhas)',
  'twin-1': 'Twin + 1',
  quad: 'Quad (4 quilhas)',
  'quad-rear': 'Quad Rear (par traseiras)',
  '5-fin': 'Set 5-Fin (tri/quad)',
  single: 'Single (1 quilha)',
};

const CONSTRUCTION_INITIAL_LIMIT = 6;
const TEMPLATE_INITIAL_LIMIT = 7;

export default function QuilhasFilters({
  categorySlug,
  selectedBrand,
  selectedSetup,
  selectedConstruction,
  selectedTemplate,
  selectedSize,
  selectedSubcategory,
  minPrice,
  maxPrice,
  onFilterChange,
  onClearFilters,
}: QuilhasFiltersProps) {
  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(true);

  // Section collapse states
  const [showSubcategories, setShowSubcategories] = useState(true);
  const [showBrands, setShowBrands] = useState(true);
  const [showSetup, setShowSetup] = useState(true);
  const [showSize, setShowSize] = useState(true);
  const [showConstruction, setShowConstruction] = useState(true);
  const [showTemplate, setShowTemplate] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  // Show more states
  const [showAllConstructions, setShowAllConstructions] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // Local price inputs
  const [localMin, setLocalMin] = useState(minPrice || '');
  const [localMax, setLocalMax] = useState(maxPrice || '');

  useEffect(() => {
    setLocalMin(minPrice || '');
    setLocalMax(maxPrice || '');
  }, [minPrice, maxPrice]);

  // Fetch facets — refetch quando filtros mudam para counts contextuais
  const fetchFacets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categorySlug) params.set('categorySlug', categorySlug);
      if (selectedBrand) params.set('brand', selectedBrand);
      if (selectedSetup) params.set('setup', selectedSetup);
      if (selectedConstruction)
        params.set('construction', selectedConstruction);
      if (selectedTemplate) params.set('template', selectedTemplate);
      if (selectedSize) params.set('size', selectedSize);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);

      const res = await fetch(`/api/products/facets-shop?${params}`);
      const data = await res.json();
      if (data.success) {
        setFacets(data.facets);
      }
    } catch {
      console.error('Erro ao carregar filtros');
    } finally {
      setLoading(false);
    }
  }, [
    categorySlug,
    selectedBrand,
    selectedSetup,
    selectedConstruction,
    selectedTemplate,
    selectedSize,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    fetchFacets();
  }, [fetchFacets]);

  const hasActiveFilters =
    selectedBrand ||
    selectedSetup ||
    selectedConstruction ||
    selectedTemplate ||
    selectedSize ||
    selectedSubcategory ||
    minPrice ||
    maxPrice;

  const handlePriceApply = () => {
    onFilterChange({
      minPrice: localMin || undefined,
      maxPrice: localMax || undefined,
    });
  };

  // ── Skeleton loading ──
  if (loading && !facets) {
    return (
      <aside className='w-full'>
        <div className='space-y-4'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='animate-pulse'>
              <div className='h-4 bg-gray-200 rounded w-24 mb-3' />
              <div className='space-y-2'>
                <div className='h-3 bg-gray-100 rounded w-full' />
                <div className='h-3 bg-gray-100 rounded w-3/4' />
                <div className='h-3 bg-gray-100 rounded w-5/6' />
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  if (!facets) return null;

  // Determinar quais secções mostrar (escondemos se 0 ou 1 opção)
  const showSubcategoriesSection = facets.subcategories.length > 1;
  const showBrandsSection = facets.brands.length > 1;
  const showSetupSection = facets.setups.length > 1;
  const showSizeSection = facets.sizes.length > 1;
  const showConstructionSection = facets.constructions.length > 1;
  const showTemplateSection = facets.templates.length > 0;
  const showPriceSection = facets.priceRange.max > facets.priceRange.min;

  return (
    <aside className='w-full text-sm'>
      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className='flex items-center gap-1 text-sm text-[#FF6600] hover:text-[#e55b00] mb-4 font-medium'
        >
          <X size={14} />
          Limpar filtros
        </button>
      )}

      {/* ━━━ SUBCATEGORIAS (Sistema FCS II / Futures) ━━━ */}
      {showSubcategoriesSection && (
        <FilterSection
          title='Sistema'
          show={showSubcategories}
          onToggle={() => setShowSubcategories(!showSubcategories)}
        >
          {facets.subcategories.map(sub => (
            <CheckboxOption
              key={sub._id}
              label={sub.name}
              count={sub.count}
              checked={selectedSubcategory === sub._id}
              onChange={() =>
                onFilterChange({
                  subcategory:
                    selectedSubcategory === sub._id ? undefined : sub._id,
                })
              }
            />
          ))}
        </FilterSection>
      )}

      {/* ━━━ MARCAS ━━━ */}
      {showBrandsSection && (
        <FilterSection
          title='Marca'
          show={showBrands}
          onToggle={() => setShowBrands(!showBrands)}
        >
          {facets.brands.map(brand => (
            <CheckboxOption
              key={brand._id}
              label={brand.name}
              count={brand.count}
              checked={selectedBrand === brand._id}
              onChange={() =>
                onFilterChange({
                  brand: selectedBrand === brand._id ? undefined : brand._id,
                })
              }
            />
          ))}
        </FilterSection>
      )}

      {/* ━━━ SETUP ━━━ */}
      {showSetupSection && (
        <FilterSection
          title='Configuração'
          show={showSetup}
          onToggle={() => setShowSetup(!showSetup)}
        >
          {facets.setups.map(s => (
            <CheckboxOption
              key={s.value}
              label={SETUP_LABELS[s.value] || s.value}
              count={s.count}
              checked={selectedSetup === s.value}
              onChange={() =>
                onFilterChange({
                  setup: selectedSetup === s.value ? undefined : s.value,
                })
              }
            />
          ))}
        </FilterSection>
      )}

      {/* ━━━ TAMANHO (botões) ━━━ */}
      {showSizeSection && (
        <FilterSection
          title='Tamanho'
          show={showSize}
          onToggle={() => setShowSize(!showSize)}
        >
          <div className='flex flex-wrap gap-1.5'>
            {facets.sizes.map(s => (
              <button
                key={s.value}
                onClick={() =>
                  onFilterChange({
                    size: selectedSize === s.value ? undefined : s.value,
                  })
                }
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  selectedSize === s.value
                    ? 'bg-orange-50 text-[#FF6600] border-[#FF6600]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {s.value}{' '}
                <span className='text-gray-400 ml-0.5'>{s.count}</span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* ━━━ CONSTRUÇÃO ━━━ */}
      {showConstructionSection && (
        <FilterSection
          title='Construção'
          show={showConstruction}
          onToggle={() => setShowConstruction(!showConstruction)}
        >
          {(showAllConstructions
            ? facets.constructions
            : facets.constructions.slice(0, CONSTRUCTION_INITIAL_LIMIT)
          ).map(c => (
            <CheckboxOption
              key={c.value}
              label={c.value}
              count={c.count}
              checked={selectedConstruction === c.value}
              onChange={() =>
                onFilterChange({
                  construction:
                    selectedConstruction === c.value ? undefined : c.value,
                })
              }
            />
          ))}
          {facets.constructions.length > CONSTRUCTION_INITIAL_LIMIT && (
            <button
              onClick={() => setShowAllConstructions(!showAllConstructions)}
              className='text-xs text-[#FF6600] hover:text-[#e55b00] mt-1 font-medium'
            >
              {showAllConstructions
                ? '— Mostrar menos'
                : `+ Mostrar mais (${facets.constructions.length - CONSTRUCTION_INITIAL_LIMIT})`}
            </button>
          )}
        </FilterSection>
      )}

      {/* ━━━ TEMPLATE ━━━ */}
      {showTemplateSection && (
        <FilterSection
          title='Template'
          show={showTemplate}
          onToggle={() => setShowTemplate(!showTemplate)}
        >
          {(showAllTemplates
            ? facets.templates
            : facets.templates.slice(0, TEMPLATE_INITIAL_LIMIT)
          ).map(t => (
            <CheckboxOption
              key={t.value}
              label={t.value}
              count={t.count}
              checked={selectedTemplate === t.value}
              onChange={() =>
                onFilterChange({
                  template: selectedTemplate === t.value ? undefined : t.value,
                })
              }
            />
          ))}
          {facets.templates.length > TEMPLATE_INITIAL_LIMIT && (
            <button
              onClick={() => setShowAllTemplates(!showAllTemplates)}
              className='text-xs text-[#FF6600] hover:text-[#e55b00] mt-1 font-medium'
            >
              {showAllTemplates
                ? '— Mostrar menos'
                : `+ Mostrar mais (${facets.templates.length - TEMPLATE_INITIAL_LIMIT})`}
            </button>
          )}
        </FilterSection>
      )}

      {/* ━━━ PREÇO ━━━ */}
      {showPriceSection && (
        <FilterSection
          title='Preço'
          show={showPrice}
          onToggle={() => setShowPrice(!showPrice)}
          isLast
        >
          <p className='text-xs text-gray-400 mb-2'>
            R$ {facets.priceRange.min} — R$ {facets.priceRange.max}
          </p>
          <div className='flex items-center gap-1.5 mb-2'>
            <input
              type='number'
              placeholder='Min'
              value={localMin}
              onChange={e => setLocalMin(e.target.value)}
              className='w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
            />
            <span className='text-gray-400 text-xs'>—</span>
            <input
              type='number'
              placeholder='Max'
              value={localMax}
              onChange={e => setLocalMax(e.target.value)}
              className='w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
            />
          </div>
          <button
            onClick={handlePriceApply}
            className='w-full py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors'
          >
            Filtrar
          </button>
        </FilterSection>
      )}
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════

function FilterSection({
  title,
  show,
  onToggle,
  children,
  isLast = false,
}: {
  title: string;
  show: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`${isLast ? 'pb-4' : 'border-b border-gray-200 pb-4 mb-4'}`}
    >
      <button
        onClick={onToggle}
        className='flex items-center justify-between w-full text-xs font-bold text-gray-900 uppercase mb-3 tracking-wide'
      >
        {title}
        {show ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {show && <div className='space-y-0.5'>{children}</div>}
    </div>
  );
}

function CheckboxOption({
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
  return (
    <label
      className={`flex items-center gap-2 py-1 px-1 rounded cursor-pointer transition-colors ${
        checked ? 'bg-orange-50' : 'hover:bg-gray-50'
      }`}
    >
      <input
        type='checkbox'
        checked={checked}
        onChange={onChange}
        className='w-3.5 h-3.5 text-[#FF6600] border-gray-300 rounded focus:ring-[#FF6600] cursor-pointer'
      />
      <span
        className={`flex-1 text-sm ${checked ? 'text-[#FF6600] font-semibold' : 'text-gray-700'}`}
      >
        {label}
      </span>
      <span className='text-xs text-gray-400'>{count}</span>
    </label>
  );
}
