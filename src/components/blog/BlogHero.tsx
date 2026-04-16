import Image from 'next/image';

interface BlogHeroProps {
  title: string;
  coverImage?: string;
  date: string;
  author?: string;
}

export default function BlogHero({ title, coverImage, date, author }: BlogHeroProps) {
  return (
    <div className="mb-8">
      {coverImage && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
          <Image src={coverImage} alt={title} fill className="object-cover" sizes="100vw" priority />
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        {author && <span>{author}</span>}
        <span>{date}</span>
      </div>
    </div>
  );
}
