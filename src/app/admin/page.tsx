import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await connectDB();

  const [productCount, orderCount, userCount, categoryCount, brandCount] =
    await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Category.countDocuments(),
      Brand.countDocuments(),
    ]);

  const stats = [
    { label: 'Produtos', value: productCount, color: 'bg-blue-500' },
    { label: 'Pedidos', value: orderCount, color: 'bg-green-500' },
    { label: 'Clientes', value: userCount, color: 'bg-purple-500' },
    { label: 'Categorias', value: categoryCount, color: 'bg-orange-500' },
    { label: 'Marcas', value: brandCount, color: 'bg-pink-500' },
  ];

  return (
    <div>
      <h1 className='text-2xl font-bold mb-6'>Dashboard</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4'>
        {stats.map(stat => (
          <div key={stat.label} className='bg-white rounded-lg shadow-sm p-6'>
            <p className='text-sm text-gray-500 mb-1'>{stat.label}</p>
            <p className='text-3xl font-bold'>{stat.value}</p>
            <div className={`h-1 w-12 ${stat.color} rounded mt-3`} />
          </div>
        ))}
      </div>
    </div>
  );
}
