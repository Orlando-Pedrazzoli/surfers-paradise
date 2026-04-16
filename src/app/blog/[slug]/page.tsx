interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 capitalize">{slug.replace(/-/g, ' ')}</h1>
      <p className="text-gray-500">Conteudo em breve...</p>
    </div>
  );
}
