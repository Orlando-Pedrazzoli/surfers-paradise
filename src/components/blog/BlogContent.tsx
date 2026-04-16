interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <article className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
  );
}
