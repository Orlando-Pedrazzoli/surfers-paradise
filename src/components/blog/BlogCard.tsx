import Link from 'next/link';
import Image from 'next/image';

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  date: string;
}

export default function BlogCard({ title, slug, excerpt, coverImage, date }: BlogCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="group block">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
        {coverImage && <Image src={coverImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />}
      </div>
      <p className="text-xs text-gray-400 mb-2">{date}</p>
      <h3 className="font-semibold text-gray-900 group-hover:text-[#FF6600] transition-colors">{title}</h3>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{excerpt}</p>
    </Link>
  );
}
