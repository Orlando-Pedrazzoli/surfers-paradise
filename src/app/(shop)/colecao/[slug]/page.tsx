interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ColecaoPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 capitalize">{slug.replace(/-/g, ' ')}</h1>
      <p className="text-gray-500">Produtos desta colecao em breve...</p>
    </div>
  );
}
