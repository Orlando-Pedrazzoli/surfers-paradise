interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pedido #{id}</h1>
      <p className="text-gray-500">Detalhes do pedido em construcao...</p>
    </div>
  );
}
