interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pedido #{id}</h1>
      <p className="text-gray-500">Detalhes do pedido em construcao...</p>
    </div>
  );
}
