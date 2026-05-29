import Image from 'next/image';
import Link from 'next/link';

interface ImageBannerProps {
  /** Caminho da imagem em /public (default: banner de wetsuits) */
  src?: string;
  alt?: string;
  /** Se informado, o banner vira um link clicável */
  href?: string;
  /** Dimensões reais da imagem (para aspect-ratio correto / evitar CLS) */
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function ImageBanner({
  src = '/images/ripcurl_banner.jpg',
  alt = 'Rip Curl — Surfers Paradise',
  href,
  width = 1500,
  height = 378,
  priority = false,
}: ImageBannerProps) {
  const image = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes='(max-width: 1280px) 100vw, 1280px'
      priority={priority}
      className='w-full h-auto rounded-lg'
    />
  );

  return (
    <section className='py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        {href ? (
          <Link href={href} className='block overflow-hidden rounded-lg'>
            {image}
          </Link>
        ) : (
          image
        )}
      </div>
    </section>
  );
}
