import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Admin',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex min-h-screen bg-gray-100'>
      <AdminSidebar />
      <div className='flex-1 flex flex-col'>
        <AdminHeader />
        <main className='flex-1 p-6'>{children}</main>
      </div>
    </div>
  );
}
