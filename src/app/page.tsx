import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import HeroBanner from '@/components/home/HeroBanner';
import BrandCarousel from '@/components/home/BrandCarousel';
import FeaturedProducts from '@/components/home/FeaturedProducts';

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main>
        {/* Hero Banner Carousel */}
        <HeroBanner />

        {/* Brand Carousel */}
        <BrandCarousel />

        {/* Featured Products */}
        <FeaturedProducts
          title='Encontre sua Prancha'
          fetchUrl='/api/products?limit=8&sort=-createdAt&isActive=true'
        />

        {/* New Arrivals */}
        <FeaturedProducts
          title='Novidades'
          fetchUrl='/api/products?limit=8&sort=-createdAt&isActive=true'
        />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
