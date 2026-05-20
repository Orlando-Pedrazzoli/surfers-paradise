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
  wetsuitTypes: ValueFacet[];
  thicknesses: ValueFacet[];
  genders: ValueFacet[];
  wetsuitLines: ValueFacet[];
  zipperTypes: ValueFacet[];
  sizes: ValueFacet[];
  priceRange: PriceRange;
}

interface WetsuitsFiltersProps {
  categorySlug?: string;
  selectedBrand?: string;
  selectedSubcategory?: string;
  selectedWetsuitType?: string;
  selectedThickness?: string;
  selectedGender?: string;
  selectedWetsuitLine?: string;
  selectedZipperType?: string;
  selectedSize?: string;
  minPrice?: string;
  maxPrice?: string;
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  onClearFilters: () => void;
}

// Labels amigáveis
const WETSUIT_TYPE_LABELS: Record<string, string> = {
  'long-john': 'Long John (manga e perna longa)',
  'short-john': 'Short John (manga ou perna curta)',
  jaqueta: 'Jaqueta',
  lycra: 'Lycra / Camisa térmica',
  calca: 'Calça',
  bermuda: 'Bermuda térmica',
  maio: 'Maiô',
  botinha: 'Botinha',
  luva: 'Luva',
  gorro: 'Gorro',
  capacete: 'Capacete',
  meia: 'Meia',
};

const GENDER_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  kids: 'Infantil / Juvenil',
  unissex: 'Unissex',
};

const ZIPPER_LABELS: Record<string, string> = {
  'zip-free': 'Zip Free (sem zíper)',
  'chest-zip': 'Chest Zip (peito)',
  'back-zip': 'Back Zip (costas)',
  'front-zip': 'Front Zip (frontal)',
};

const WETSUIT_LINE_INITIAL_LIMIT = 6;
const WETSUIT_TYPE_INITIAL_LIMIT = 6;

// Faixas de preço pré-definidas para wetsuits
const PRICE_RANGES = [
  { label: 'Até R$ 1.000', min: '', max: '1000' },
  { label: 'R$ 1.000 — R$ 2.000', min: '1000', max: '2000' },
  { label: 'R$ 2.000 — R$ 3.000', min: '2000', max: '3000' },
  { label: 'Acima de R$ 3.000', min: '3000', max: '' },
];

export default function WetsuitsFilters({
  categorySlug,
  selectedBrand,
  selectedSubcategory,
  selectedWetsuitType,
  selectedThickness,
  selectedGender,
  selectedWetsuitLine,
  selectedZipperType,
  selectedSize,
  minPrice,
  maxPrice,
  onFilterChange,
  onClearFilters,
}: WetsuitsFiltersProps) {
  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(true);

  // Section collapse states
  const [showSubcategories, setShowSubcategories] = useState(true);
  const [showBrands, setShowBrands] = useState(true);
  const [showGender, setShowGender] = useState(true);
  const [showWetsuitType, setShowWetsuitType] = useState(true);
  const [showThickness, setShowThickness] = useState(true);
  const [showWetsuitLine, setShowWetsuitLine] = useState(true);
  const [showZipperType, setShowZipperType] = useState(true);
  const [showSize, setShowSize] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  // Show more states
  const [showAllLines, setShowAllLines] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);

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
      if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
      if (selectedWetsuitType) params.set('wetsuitType', selectedWetsuitType);
      if (selectedThickness) params.set('thickness', selectedThickness);
      if (selectedGender) params.set('gender', selectedGender);
      if (selectedWetsuitLine) params.set('wetsuitLine', selectedWetsuitLine);
      if (selectedZipperType) params.set('zipperType', selectedZipperType);
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
    selectedSubcategory,
    selectedWetsuitType,
    selectedThickness,
    selectedGender,
    selectedWetsuitLine,
    selectedZipperType,
    selectedSize,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    fetchFacets();
  }, [fetchFacets]);

  const hasActiveFilters =
    selectedBrand ||
    selectedSubcategory ||
    selectedWetsuitType ||
    selectedThickness ||
    selectedGender ||
    selectedWetsuitLine ||
    selectedZipperType ||
    selectedSize ||
    minPrice ||
    maxPrice;

  const handlePriceApply = () => {
    onFilterChange({
      minPrice: localMin || undefined,
      maxPrice: localMax || undefined,
    });
  };

  const handlePriceRange = (range: { min: string; max: string }) => {
    onFilterChange({
      minPrice: range.min || undefined,
      maxPrice: range.max || undefined,
    });
  };

  const isPriceRangeActive = (range: { min: string; max: string }) =>
    (minPrice || '') === range.min && (maxPrice || '') === range.max;

  // ── Skeleton loading ──
  if (loading && !facets) {
    return (
      <aside className='w-full'>
        <div className='space-y-4'>
          {[...Array(6)].map((_, i) => (
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
  const showGenderSection = facets.genders.length > 1;
  const showWetsuitTypeSection = facets.wetsuitTypes.length > 1;
  const showThicknessSection = facets.thicknesses.length > 1;
  const showWetsuitLineSection = facets.wetsuitLines.length > 1;
  const showZipperTypeSection = facets.zipperTypes.length > 1;
  const showSizeSection = facets.sizes.length > 1;
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

      {/* ━━━ SUBCATEGORIAS (Long John / Short John / Jaqueta / Lycra / Acessórios) ━━━ */}
      {showSubcategoriesSection && (
        <FilterSection
          title='Categoria'
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

      {/* ━━━ GÊNERO ━━━ */}
      {showGenderSection && (
        <FilterSection
          title='Gênero'
          show={showGender}
          onToggle={() => setShowGender(!showGender)}
        >
          {facets.genders.map(g => (
            <CheckboxOption
              key={g.value}
              label={GENDER_LABELS[g.value] || g.value}
              count={g.count}
              checked={selectedGender === g.value}
              onChange={() =>
                onFilterChange({
                  gender: selectedGender === g.value ? undefined : g.value,
                })
              }
            />
          ))}
        </FilterSection>
      )}

      {/* ━━━ TIPO DE PRODUTO ━━━ */}
      {showWetsuitTypeSection && (
        <FilterSection
          title='Tipo'
          show={showWetsuitType}
          onToggle={() => setShowWetsuitType(!showWetsuitType)}
        >
          {(showAllTypes
            ? facets.wetsuitTypes
            : facets.wetsuitTypes.slice(0, WETSUIT_TYPE_INITIAL_LIMIT)
          ).map(t => (
            <CheckboxOption
              key={t.value}
              label={WETSUIT_TYPE_LABELS[t.value] || t.value}
              count={t.count}
              checked={selectedWetsuitType === t.value}
              onChange={() =>
                onFilterChange({
                  wetsuitType:
                    selectedWetsuitType === t.value ? undefined : t.value,
                })
              }
            />
          ))}
          {facets.wetsuitTypes.length > WETSUIT_TYPE_INITIAL_LIMIT && (
            <button
              onClick={() => setShowAllTypes(!showAllTypes)}
              className='text-xs text-[#FF6600] hover:text-[#e55b00] mt-1 font-medium'
            >
              {showAllTypes
                ? '— Mostrar menos'
                : `+ Mostrar mais (${facets.wetsuitTypes.length - WETSUIT_TYPE_INITIAL_LIMIT})`}
            </button>
          )}
        </FilterSection>
      )}

      {/* ━━━ ESPESSURA (botões) ━━━ */}
      {showThicknessSection && (
        <FilterSection
          title='Espessura'
          show={showThickness}
          onToggle={() => setShowThickness(!showThickness)}
        >
          <div className='flex flex-wrap gap-1.5'>
            {facets.thicknesses.map(t => (
              <button
                key={t.value}
                onClick={() =>
                  onFilterChange({
                    thickness:
                      selectedThickness === t.value ? undefined : t.value,
                  })
                }
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  selectedThickness === t.value
                    ? 'bg-orange-50 text-[#FF6600] border-[#FF6600]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {t.value}{' '}
                <span className='text-gray-400 ml-0.5'>{t.count}</span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* ━━━ LINHA / MODELO ━━━ */}
      {showWetsuitLineSection && (
        <FilterSection
          title='Linha / Modelo'
          show={showWetsuitLine}
          onToggle={() => setShowWetsuitLine(!showWetsuitLine)}
        >
          {(showAllLines
            ? facets.wetsuitLines
            : facets.wetsuitLines.slice(0, WETSUIT_LINE_INITIAL_LIMIT)
          ).map(l => (
            <CheckboxOption
              key={l.value}
              label={l.value}
              count={l.count}
              checked={selectedWetsuitLine === l.value}
              onChange={() =>
                onFilterChange({
                  wetsuitLine:
                    selectedWetsuitLine === l.value ? undefined : l.value,
                })
              }
            />
          ))}
          {facets.wetsuitLines.length > WETSUIT_LINE_INITIAL_LIMIT && (
            <button
              onClick={() => setShowAllLines(!showAllLines)}
              className='text-xs text-[#FF6600] hover:text-[#e55b00] mt-1 font-medium'
            >
              {showAllLines
                ? '— Mostrar menos'
                : `+ Mostrar mais (${facets.wetsuitLines.length - WETSUIT_LINE_INITIAL_LIMIT})`}
            </button>
          )}
        </FilterSection>
      )}

      {/* ━━━ SISTEMA DE ENTRADA (zíper) ━━━ */}
      {showZipperTypeSection && (
        <FilterSection
          title='Sistema de Entrada'
          show={showZipperType}
          onToggle={() => setShowZipperType(!showZipperType)}
        >
          {facets.zipperTypes.map(z => (
            <CheckboxOption
              key={z.value}
              label={ZIPPER_LABELS[z.value] || z.value}
              count={z.count}
              checked={selectedZipperType === z.value}
              onChange={() =>
                onFilterChange({
                  zipperType:
                    selectedZipperType === z.value ? undefined : z.value,
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

          {/* Faixas predefinidas */}
          <div className='space-y-1 mb-3'>
            {PRICE_RANGES.map(range => (
              <button
                key={range.label}
                onClick={() => handlePriceRange(range)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                  isPriceRangeActive(range)
                    ? 'bg-orange-50 text-[#FF6600] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Inputs manuais */}
          <div className='border-t border-gray-100 pt-2'>
            <p className='text-xs text-gray-400 mb-1.5'>Ou personalizar:</p>
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
          </div>
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
