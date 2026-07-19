// src/app/page.tsx
// Home — canonical explícito + title otimizado para a keyword principal.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import HeroBanner from '@/components/home/HeroBanner';
import BrandCarousel from '@/components/home/BrandCarousel';
import ShopByCategory from '@/components/home/ShopByCategory';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import FeaturedWetsuits from '@/components/home/FeaturedWetsuits';
import ImageBanner from '@/components/home/ImageBanner';
import PromoBanners from '@/components/home/PromoBanners';
import CategoryBanners from '@/components/home/CategoryBanners';
import ReviewsCarousel from '@/components/home/ReviewsCarousel';

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main>
        <HeroBanner />
        <BrandCarousel />
        <ShopByCategory />
        <FeaturedProducts
          title='Novidades'
          fetchUrl='/api/products?limit=8&sort=-createdAt&isActive=true&isNewArrival=true'
        />
        <FeaturedProducts
          title='Encontre sua Prancha'
          fetchUrl='/api/products?limit=8&sort=-createdAt&isActive=true&categorySlug=pranchas'
        />
        <ImageBanner alt='Rip Curl — Surfers Paradise' />
        <FeaturedWetsuits title='Wetsuits' />
        <PromoBanners />
        <FeaturedProducts
          title='Quilhas'
          fetchUrl='/api/products?limit=10&sort=-createdAt&isActive=true&categorySlug=quilhas'
        />
        <CategoryBanners />
        <ReviewsCarousel />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
