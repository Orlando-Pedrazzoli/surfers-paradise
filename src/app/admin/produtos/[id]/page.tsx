'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ProductForm, {
  type ProductFormData,
} from '@/components/admin/ProductForm';

export default function AdminProdutoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);
        } else {
          toast.error('Produto não encontrado');
          router.push('/admin/produtos');
        }
      } catch {
        toast.error('Erro ao carregar produto');
        router.push('/admin/produtos');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, router]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
      </div>
    );
  }

  if (!product) return null;

  return <ProductForm mode='edit' initialData={product} />;
}
