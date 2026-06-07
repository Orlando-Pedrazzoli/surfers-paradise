'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  Check,
  X,
  Package,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CatalogCategory {
  _id: string;
  name: string;
  slug: string;
  parent: string | null;
  level: number;
}
interface CatalogBrand {
  _id: string;
  name: string;
  slug: string;
}

interface InvoiceItem {
  cProd: string;
  gtin: string;
  xProd: string;
  ncm: string;
  cest: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  matchStatus: 'matched' | 'created' | 'pending';
  product?: string | null;
}
interface Invoice {
  _id: string;
  chave: string;
  number: string;
  series: string;
  issuer: { cnpj: string; name: string; ie: string };
  totalValue: number;
  status: 'pending' | 'completed';
  items: InvoiceItem[];
}

interface ItemForm {
  sku: string;
  price: string;
  brandId: string;
  categoryId: string;
  subcategoryId: string;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatCnpj(digits: string): string {
  if (!digits || digits.length !== 14) return digits;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

export default function EntradaNfePage() {
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [alreadyImported, setAlreadyImported] = useState(false);

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);

  const [forms, setForms] = useState<Record<number, ItemForm>>({});
  const [processing, setProcessing] = useState<number | null>(null);
  const [doneIndexes, setDoneIndexes] = useState<Set<number>>(new Set());

  // Carrega marcas e categorias para os selects
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories || []);
          setBrands(data.brands || []);
        }
      } catch {
        toast.error('Erro ao carregar marcas e categorias');
      }
    })();
  }, []);

  const rootCategories = categories.filter(c => c.level === 0);
  const subcategoriesOf = useCallback(
    (parentId: string) => categories.filter(c => c.parent === parentId),
    [categories],
  );

  const resetState = () => {
    setInvoice(null);
    setAlreadyImported(false);
    setForms({});
    setDoneIndexes(new Set());
    setProcessing(null);
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast.error('Selecione um arquivo .xml');
      return;
    }
    resetState();
    setImporting(true);
    try {
      const xml = await file.text();
      const res = await fetch('/api/fiscal/nfe-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Erro ao importar a nota');
        return;
      }
      setInvoice(data.invoice);
      setAlreadyImported(!!data.alreadyImported);

      // Pré-preenche os formulários dos itens pendentes
      const initial: Record<number, ItemForm> = {};
      (data.invoice.items as InvoiceItem[]).forEach((it, i) => {
        if (it.matchStatus === 'pending') {
          initial[i] = {
            sku: it.cProd || '',
            price: '',
            brandId: '',
            categoryId: '',
            subcategoryId: '',
          };
        }
      });
      setForms(initial);

      if (data.alreadyImported) {
        toast('Esta nota já tinha sido importada — exibindo o registro.');
      } else {
        const matched = (data.invoice.items as InvoiceItem[]).filter(
          i => i.matchStatus === 'matched',
        ).length;
        toast.success(
          matched > 0
            ? `Nota importada. ${matched} item(ns) com estoque atualizado.`
            : 'Nota importada.',
        );
      }
    } catch {
      toast.error('Erro ao ler o arquivo');
    } finally {
      setImporting(false);
    }
  };

  // Seleciona o primeiro .xml de uma lista (clique ou drop)
  const pickXml = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const xml = files.find(f => f.name.toLowerCase().endsWith('.xml'));
    if (!xml) {
      toast.error('Solte um arquivo .xml');
      return;
    }
    if (files.length > 1) {
      toast('Processando o primeiro XML. Suba os demais em seguida.');
    }
    handleFile(xml);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (importing) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (importing) return;
    pickXml(e.dataTransfer.files);
  };

  const updateForm = (idx: number, patch: Partial<ItemForm>) => {
    setForms(prev => ({ ...prev, [idx]: { ...prev[idx], ...patch } }));
  };

  const handleCreate = async (idx: number) => {
    if (!invoice) return;
    const form = forms[idx];
    if (!form) return;
    if (!form.sku.trim()) return toast.error('Informe o SKU');
    if (!form.price || parseFloat(form.price.replace(',', '.')) <= 0)
      return toast.error('Informe o preço de venda');
    if (!form.brandId) return toast.error('Selecione a marca');
    if (!form.categoryId) return toast.error('Selecione a categoria');

    setProcessing(idx);
    try {
      const res = await fetch(
        `/api/fiscal/nfe-import/${invoice._id}/process-item`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemIndex: idx,
            sku: form.sku.trim(),
            price: parseFloat(form.price.replace(',', '.')),
            brandId: form.brandId,
            categoryId: form.categoryId,
            subcategoryId: form.subcategoryId || undefined,
          }),
        },
      );
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Erro ao criar produto');
        return;
      }
      setDoneIndexes(prev => new Set(prev).add(idx));
      toast.success('Produto cadastrado e disponível no balcão!');
    } catch {
      toast.error('Erro de rede');
    } finally {
      setProcessing(null);
    }
  };

  const pendingItems = invoice
    ? invoice.items
        .map((it, i) => ({ it, i }))
        .filter(
          ({ it, i }) => it.matchStatus === 'pending' && !doneIndexes.has(i),
        )
    : [];
  const matchedItems = invoice
    ? invoice.items.filter(it => it.matchStatus === 'matched')
    : [];

  return (
    <div className='max-w-5xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Entrada de NF-e</h1>
        <p className='text-sm text-gray-500 mt-1'>
          Importe o XML da nota do fornecedor. Itens com GTIN já cadastrado têm
          o estoque atualizado automaticamente; os demais entram como cadastro
          rápido.
        </p>
      </div>

      {/* UPLOAD + DRAG AND DROP */}
      <label
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          importing
            ? 'border-gray-200 bg-gray-50'
            : dragActive
              ? 'border-[#FF6600] bg-orange-100'
              : 'border-gray-300 hover:border-[#FF6600] hover:bg-orange-50'
        }`}
      >
        <input
          type='file'
          accept='.xml,text/xml,application/xml'
          className='hidden'
          disabled={importing}
          onChange={e => {
            pickXml(e.target.files);
            e.target.value = '';
          }}
        />
        {importing ? (
          <div className='flex flex-col items-center text-gray-500'>
            <Loader2 size={32} className='animate-spin mb-2 text-[#FF6600]' />
            <p>Lendo a nota...</p>
          </div>
        ) : (
          <div className='flex flex-col items-center text-gray-500 pointer-events-none'>
            <Upload size={32} className='mb-2 text-[#FF6600]' />
            <p className='font-medium text-gray-700'>
              {dragActive
                ? 'Solte o XML aqui'
                : 'Arraste o XML aqui ou clique para selecionar'}
            </p>
            <p className='text-xs mt-1'>
              O arquivo .xml costuma vir do fornecedor por e-mail
            </p>
          </div>
        )}
      </label>

      {invoice && (
        <div className='mt-6 space-y-6'>
          {/* CABEÇALHO DA NOTA */}
          <div className='bg-white border rounded-lg p-4'>
            <div className='flex items-start justify-between gap-4 flex-wrap'>
              <div>
                <div className='flex items-center gap-2'>
                  <FileText size={18} className='text-[#FF6600]' />
                  <span className='font-bold text-gray-900'>
                    {invoice.issuer.name || 'Fornecedor'}
                  </span>
                  {alreadyImported && (
                    <span className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full'>
                      já importada
                    </span>
                  )}
                </div>
                <p className='text-sm text-gray-500 mt-1'>
                  CNPJ {formatCnpj(invoice.issuer.cnpj)}
                </p>
                <p className='text-xs text-gray-400 mt-1 font-mono'>
                  NF {invoice.number}/{invoice.series} · chave {invoice.chave}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-xs text-gray-500'>Total da nota</p>
                <p className='text-xl font-bold text-gray-900'>
                  {formatPrice(invoice.totalValue)}
                </p>
              </div>
            </div>
          </div>

          {/* ITENS CASADOS (automático) */}
          {matchedItems.length > 0 && (
            <div>
              <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-2'>
                Estoque atualizado automaticamente ({matchedItems.length})
              </h2>
              <div className='bg-white border rounded-lg divide-y'>
                {matchedItems.map((it, i) => (
                  <div
                    key={`m-${i}`}
                    className='p-3 flex items-center gap-3 text-sm'
                  >
                    <div className='w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
                      <Check size={15} className='text-green-600' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-gray-900 truncate'>
                        {it.xProd}
                      </p>
                      <p className='text-xs text-gray-400 font-mono'>
                        GTIN {it.gtin} · custo {formatPrice(it.unitCost)}
                      </p>
                    </div>
                    <span className='text-green-700 font-bold whitespace-nowrap'>
                      +{Math.round(it.quantity)} un
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ITENS PENDENTES (cadastro parcial) */}
          {pendingItems.length > 0 ? (
            <div>
              <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-2'>
                Cadastrar ({pendingItems.length})
              </h2>
              <div className='space-y-3'>
                {pendingItems.map(({ it, i }) => {
                  const form = forms[i];
                  const subs = form?.categoryId
                    ? subcategoriesOf(form.categoryId)
                    : [];
                  return (
                    <div
                      key={`p-${i}`}
                      className='bg-white border rounded-lg p-4'
                    >
                      <div className='flex items-start gap-3 mb-3'>
                        <div className='w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0'>
                          <Package size={18} className='text-gray-400' />
                        </div>
                        <div className='min-w-0'>
                          <p className='font-medium text-gray-900'>
                            {it.xProd}
                          </p>
                          <p className='text-xs text-gray-400 mt-0.5'>
                            Cód. fornecedor {it.cProd || '—'} · NCM{' '}
                            {it.ncm || '—'}
                            {it.gtin ? ` · GTIN ${it.gtin}` : ' · sem GTIN'} ·
                            qtde {Math.round(it.quantity)} · custo{' '}
                            {formatPrice(it.unitCost)}
                          </p>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                        <div>
                          <label className='block text-xs font-medium text-gray-600 mb-1'>
                            SKU
                          </label>
                          <input
                            type='text'
                            value={form?.sku || ''}
                            onChange={e =>
                              updateForm(i, { sku: e.target.value })
                            }
                            className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] font-mono'
                          />
                        </div>
                        <div>
                          <label className='block text-xs font-medium text-gray-600 mb-1'>
                            Preço de venda (R$)
                          </label>
                          <input
                            type='text'
                            value={form?.price || ''}
                            onChange={e =>
                              updateForm(i, {
                                price: e.target.value.replace(/[^\d,.]/g, ''),
                              })
                            }
                            placeholder='0,00'
                            className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] font-mono'
                          />
                        </div>
                        <div>
                          <label className='block text-xs font-medium text-gray-600 mb-1'>
                            Marca
                          </label>
                          <select
                            value={form?.brandId || ''}
                            onChange={e =>
                              updateForm(i, { brandId: e.target.value })
                            }
                            className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                          >
                            <option value=''>Selecione…</option>
                            {brands.map(b => (
                              <option key={b._id} value={b._id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className='block text-xs font-medium text-gray-600 mb-1'>
                            Categoria
                          </label>
                          <select
                            value={form?.categoryId || ''}
                            onChange={e =>
                              updateForm(i, {
                                categoryId: e.target.value,
                                subcategoryId: '',
                              })
                            }
                            className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                          >
                            <option value=''>Selecione…</option>
                            {rootCategories.map(c => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {subs.length > 0 && (
                          <div>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                              Subcategoria (opcional)
                            </label>
                            <select
                              value={form?.subcategoryId || ''}
                              onChange={e =>
                                updateForm(i, { subcategoryId: e.target.value })
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                            >
                              <option value=''>—</option>
                              {subs.map(s => (
                                <option key={s._id} value={s._id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className='flex items-end'>
                          <button
                            onClick={() => handleCreate(i)}
                            disabled={processing === i}
                            className='w-full px-4 py-2 bg-[#FF6600] text-white font-bold rounded-md hover:bg-[#e55b00] disabled:opacity-50 flex items-center justify-center gap-2 text-sm'
                          >
                            {processing === i ? (
                              <Loader2 size={16} className='animate-spin' />
                            ) : (
                              <Plus size={16} />
                            )}
                            Criar produto
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            invoice.items.length > 0 && (
              <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3'>
                <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'>
                  <Check size={18} className='text-green-600' />
                </div>
                <p className='text-sm text-green-800 font-medium'>
                  Todos os itens desta nota já foram processados.
                </p>
              </div>
            )
          )}

          <button
            onClick={resetState}
            className='inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800'
          >
            <X size={16} />
            Importar outra nota
          </button>
        </div>
      )}
    </div>
  );
}
