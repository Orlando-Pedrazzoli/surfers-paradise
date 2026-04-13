import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import AccountSidebar from '@/components/account/AccountSidebar';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='flex flex-col md:flex-row gap-8'>
          <AccountSidebar />
          <div className='flex-1'>{children}</div>
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
