import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import HeroBanner from '@/components/home/HeroBanner';
import BrandCarousel from '@/components/home/BrandCarousel';
import FeaturedProducts from '@/components/home/FeaturedProducts';
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
        <FeaturedProducts
          title='Encontre sua Prancha'
          fetchUrl='/api/products?limit=8&sort=-createdAt&isActive=true&categorySlug=pranchas'
        />
        <FeaturedProducts
          title='Novidades'
          fetchUrl='/api/products?limit=8&sort=-createdAt&isActive=true&isNewArrival=true'
        />
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
