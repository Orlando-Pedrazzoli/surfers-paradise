interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminRomaneioDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Romaneio #{id}</h1>
      <p className="text-gray-500">Detalhes do romaneio em construcao...</p>
    </div>
  );
}
