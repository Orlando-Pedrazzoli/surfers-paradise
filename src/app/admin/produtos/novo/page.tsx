// src/app/admin/produtos/novo/page.tsx
// Novo produto. Com ?clonar=<id> abre o formulário pré-preenchido com os
// dados desse produto (nova variante da mesma família: outro tamanho/cor).
'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ProductForm, {
  type ProductFormData,
} from '@/components/admin/ProductForm';

export default function AdminProdutoNovoPage({
  searchParams,
}: {
  searchParams: Promise<{ clonar?: string | string[] }>;
}) {
  const sp = use(searchParams);
  const cloneId = Array.isArray(sp.clonar) ? sp.clonar[0] : sp.clonar;

  const [source, setSource] = useState<ProductFormData | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    if (!cloneId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${cloneId}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.product) {
          setSource(data.product);
        } else {
          toast.error('Produto a clonar não encontrado');
          setSource(null);
        }
      } catch {
        if (!cancelled) {
          toast.error('Erro ao carregar produto a clonar');
          setSource(null);
        }
      } finally {
        if (!cancelled) setLoadedId(cloneId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cloneId]);

  // Sem clonagem → formulário vazio
  if (!cloneId) return <ProductForm key='novo' mode='create' />;

  // A carregar o produto a clonar
  if (loadedId !== cloneId) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
      </div>
    );
  }

  // `key` remonta o formulário a cada clone ("Salvar e clonar próximo")
  return source ? (
    <ProductForm key={`clone-${cloneId}`} mode='create' cloneSource={source} />
  ) : (
    <ProductForm key='novo' mode='create' />
  );
}
