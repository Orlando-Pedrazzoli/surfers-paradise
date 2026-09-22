// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      // Alias EN da página de contato (canonical: /contato)
      { source: '/contact', destination: '/contato', permanent: true },
    ];
  },
  images: {
    // Loader custom: bypass do otimizador da Vercel (quota mensal → 402);
    // a otimização (f_auto, q_auto, w_) é feita pelo Cloudinary no URL.
    loader: 'custom',
    loaderFile: './src/lib/cloudinaryLoader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
