// 📄 src/components/admin/CouponForm.tsx
// v2 (cupons restritos por categoria/marca):
// - Multi-select de CATEGORIAS (com hierarquia pai → filho indentada) e de
//   MARCAS. Vazio = cupom vale para a loja inteira (comportamento antigo).
// - Selecionar uma categoria-raiz (ex.: Wetsuits) já cobre todas as
//   subcategorias — a validação server-side aceita category OU subcategory.
// - Se categoria E marca forem selecionadas, o produto precisa satisfazer
//   AMBAS (ex.: só quilhas FCS).
// - Envia applicableCategories/applicableBrands como arrays de ObjectId
//   (strings) no payload do POST/PUT.
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface CouponData {
  _id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom: string | Date;
  validUntil: string | Date;
  isActive: boolean;
  applicableCategories?: string[];
  applicableBrands?: string[];
}

interface CategoryOption {
  _id: string;
  name: string;
  parent?: string | null;
  level?: number;
  order?: number;
  isActive?: boolean;
}

interface BrandOption {
  _id: string;
  name: string;
  isActive?: boolean;
}

interface CouponFormProps {
  coupon?: CouponData | null;
  onSaved: () => void;
  onCancel: () => void;
}

// Converte Date/ISO para o formato YYYY-MM-DD do input[type=date]
function toDateInput(value?: string | Date): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

// Normaliza refs que podem vir como string ou como objeto populado { _id }
function toIdArray(value?: unknown[]): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(v =>
      typeof v === 'string'
        ? v
        : v && typeof v === 'object' && '_id' in v
          ? String((v as { _id: unknown })._id)
          : '',
    )
    .filter(Boolean);
}

/**
 * Ordena categorias em árvore achatada (raiz seguida dos filhos), para o
 * multi-select exibir a hierarquia com indentação.
 */
function flattenCategoryTree(cats: CategoryOption[]): CategoryOption[] {
  const roots = cats
    .filter(c => !c.parent)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const childrenOf = (parentId: string) =>
    cats
      .filter(c => c.parent && String(c.parent) === parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const out: CategoryOption[] = [];
  const walk = (node: CategoryOption, level: number) => {
    out.push({ ...node, level });
    for (const child of childrenOf(node._id)) walk(child, level + 1);
  };
  for (const root of roots) walk(root, 0);

  // Categorias órfãs (parent não encontrado na lista) entram no fim
  const seen = new Set(out.map(c => c._id));
  for (const c of cats) if (!seen.has(c._id)) out.push({ ...c, level: 0 });
  return out;
}

export default function CouponForm({
  coupon,
  onSaved,
  onCancel,
}: CouponFormProps) {
  const isEdit = Boolean(coupon?._id);
  const today = new Date().toISOString().slice(0, 10);

  const [code, setCode] = useState(coupon?.code || '');
  const [type, setType] = useState<'percentage' | 'fixed'>(
    coupon?.type || 'percentage',
  );
  const [value, setValue] = useState(coupon?.value?.toString() || '');
  const [minOrderValue, setMinOrderValue] = useState(
    coupon?.minOrderValue?.toString() || '',
  );
  const [maxDiscount, setMaxDiscount] = useState(
    coupon?.maxDiscount?.toString() || '',
  );
  const [usageLimit, setUsageLimit] = useState(
    coupon?.usageLimit?.toString() || '',
  );
  const [validFrom, setValidFrom] = useState(
    toDateInput(coupon?.validFrom) || today,
  );
  const [validUntil, setValidUntil] = useState(toDateInput(coupon?.validUntil));
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  // ── Restrições de categoria/marca ────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    toIdArray(coupon?.applicableCategories),
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    toIdArray(coupon?.applicableBrands),
  );
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);
        const catData = await catRes.json();
        const brandData = await brandRes.json();
        if (cancelled) return;

        // Aceita { categories: [...] } ou array direto
        const rawCats: CategoryOption[] = Array.isArray(catData)
          ? catData
          : catData.categories || [];
        const rawBrands: BrandOption[] = Array.isArray(brandData)
          ? brandData
          : brandData.brands || [];

        setCategories(
          flattenCategoryTree(rawCats.filter(c => c.isActive !== false)),
        );
        setBrands(
          rawBrands
            .filter(b => b.isActive !== false)
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } catch {
        if (!cancelled) toast.error('Erro ao carregar categorias/marcas');
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCategory = (id: string) =>
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
  const toggleBrand = (id: string) =>
    setSelectedBrands(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id],
    );

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Informe o código');
      return;
    }
    const numValue = parseFloat(value);
    if (!numValue || numValue <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    if (type === 'percentage' && numValue > 100) {
      toast.error('Percentual não pode passar de 100%');
      return;
    }
    if (!validFrom || !validUntil) {
      toast.error('Preencha as datas de validade');
      return;
    }
    if (new Date(validUntil) <= new Date(validFrom)) {
      toast.error('A data final deve ser após a inicial');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: numValue,
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : 0,
      usageLimit: usageLimit ? parseInt(usageLimit) : 0,
      validFrom,
      validUntil,
      isActive,
      applicableCategories: selectedCategories,
      applicableBrands: selectedBrands,
    };

    setSaving(true);
    try {
      const url = isEdit ? `/api/coupons/${coupon!._id}` : '/api/coupons';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Erro ao salvar cupom');
        return;
      }
      toast.success(isEdit ? 'Cupom atualizado!' : 'Cupom criado!');
      onSaved();
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/50';

  const hasRestriction =
    selectedCategories.length > 0 || selectedBrands.length > 0;

  return (
    <div className='space-y-4'>
      <Input
        id='cf-code'
        label='CÓDIGO'
        placeholder='EX: VERAO20'
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
      />

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            TIPO
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value as 'percentage' | 'fixed')}
            className={selectClass}
          >
            <option value='percentage'>Percentual (%)</option>
            <option value='fixed'>Valor fixo (R$)</option>
          </select>
        </div>
        <Input
          id='cf-value'
          type='number'
          label={type === 'percentage' ? 'VALOR (%)' : 'VALOR (R$)'}
          placeholder={type === 'percentage' ? '10' : '50.00'}
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <Input
          id='cf-min'
          type='number'
          label='PEDIDO MÍN. (R$)'
          placeholder='0 = sem mínimo'
          value={minOrderValue}
          onChange={e => setMinOrderValue(e.target.value)}
        />
        <Input
          id='cf-max'
          type='number'
          label='DESC. MÁX. (R$)'
          placeholder='0 = sem teto'
          value={maxDiscount}
          onChange={e => setMaxDiscount(e.target.value)}
        />
      </div>

      <Input
        id='cf-limit'
        type='number'
        label='LIMITE DE USOS'
        placeholder='0 = ilimitado'
        value={usageLimit}
        onChange={e => setUsageLimit(e.target.value)}
      />

      <div className='grid grid-cols-2 gap-3'>
        <Input
          id='cf-from'
          type='date'
          label='VÁLIDO DE'
          value={validFrom}
          onChange={e => setValidFrom(e.target.value)}
        />
        <Input
          id='cf-until'
          type='date'
          label='VÁLIDO ATÉ'
          value={validUntil}
          onChange={e => setValidUntil(e.target.value)}
        />
      </div>

      {/* ── Restrições (categoria/marca) ─────────────────────────── */}
      <div className='rounded-lg border border-gray-200 p-3'>
        <p className='mb-1 text-sm font-medium text-gray-700'>
          RESTRINGIR CUPOM (opcional)
        </p>
        <p className='mb-3 text-xs text-gray-500'>
          Sem seleção, o cupom vale para a loja inteira. Selecionar uma
          categoria principal já inclui as subcategorias. Se selecionar
          categoria E marca, o produto precisa atender às duas.
        </p>

        {loadingOptions ? (
          <p className='text-xs text-gray-400'>Carregando opções...</p>
        ) : (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <p className='mb-1.5 text-xs font-semibold text-gray-600'>
                CATEGORIAS ({selectedCategories.length})
              </p>
              <div className='max-h-48 space-y-1 overflow-y-auto rounded border border-gray-200 p-2'>
                {categories.map(cat => (
                  <label
                    key={cat._id}
                    className='flex cursor-pointer items-center gap-2 text-sm text-gray-700'
                    style={{ paddingLeft: `${(cat.level ?? 0) * 16}px` }}
                  >
                    <input
                      type='checkbox'
                      checked={selectedCategories.includes(cat._id)}
                      onChange={() => toggleCategory(cat._id)}
                      className='h-4 w-4 accent-[#FF6600]'
                    />
                    <span
                      className={
                        (cat.level ?? 0) === 0 ? 'font-medium' : 'text-gray-600'
                      }
                    >
                      {cat.name}
                    </span>
                  </label>
                ))}
                {!categories.length && (
                  <p className='text-xs text-gray-400'>
                    Nenhuma categoria encontrada
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className='mb-1.5 text-xs font-semibold text-gray-600'>
                MARCAS ({selectedBrands.length})
              </p>
              <div className='max-h-48 space-y-1 overflow-y-auto rounded border border-gray-200 p-2'>
                {brands.map(brand => (
                  <label
                    key={brand._id}
                    className='flex cursor-pointer items-center gap-2 text-sm text-gray-700'
                  >
                    <input
                      type='checkbox'
                      checked={selectedBrands.includes(brand._id)}
                      onChange={() => toggleBrand(brand._id)}
                      className='h-4 w-4 accent-[#FF6600]'
                    />
                    {brand.name}
                  </label>
                ))}
                {!brands.length && (
                  <p className='text-xs text-gray-400'>
                    Nenhuma marca encontrada
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {hasRestriction && (
          <p className='mt-2 text-xs text-amber-600'>
            Cupom restrito: o desconto será aplicado apenas aos produtos
            elegíveis do carrinho.
          </p>
        )}
      </div>

      <label className='flex cursor-pointer items-center gap-2'>
        <input
          type='checkbox'
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
          className='h-4 w-4 accent-[#FF6600]'
        />
        <span className='text-sm text-gray-700'>Cupom ativo</span>
      </label>

      <div className='flex gap-3 pt-2'>
        <Button variant='outline' onClick={onCancel} className='flex-1'>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={saving} className='flex-1'>
          {isEdit ? 'Salvar alterações' : 'Criar cupom'}
        </Button>
      </div>
    </div>
  );
}
