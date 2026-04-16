interface RelatedProductsProps {
  productId: string;
  categoryId?: string;
}

export default function RelatedProducts({ productId, categoryId }: RelatedProductsProps) {
  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold mb-6">Produtos Relacionados</h2>
      <p className="text-gray-500 text-sm">Em breve...</p>
    </section>
  );
}
