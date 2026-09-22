// 📄 src/lib/cloudinaryLoader.ts
// Loader custom do next/image — evita o /_next/image da Vercel (quota → 402)
// e delega a otimização ao Cloudinary via transformações no URL.
// Ativado em next.config.ts: images.loader = 'custom', images.loaderFile.

import type { ImageLoaderProps } from 'next/image';

const CLOUDINARY_UPLOAD = '/image/upload/';

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  // Imagens locais (/images/logo-navbar.png, etc.) e outros hosts: sem alteração
  if (!src.includes('res.cloudinary.com') || !src.includes(CLOUDINARY_UPLOAD)) {
    return src;
  }

  const [base, rest] = src.split(CLOUDINARY_UPLOAD);
  const transforms = [
    'f_auto',
    quality ? `q_${quality}` : 'q_auto',
    `w_${width}`,
    'c_limit',
  ].join(',');

  return `${base}${CLOUDINARY_UPLOAD}${transforms}/${rest}`;
}
