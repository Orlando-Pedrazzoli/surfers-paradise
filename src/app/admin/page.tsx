import { Suspense } from 'react';
import DashboardClient from '@/components/admin/DashboardClient';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
