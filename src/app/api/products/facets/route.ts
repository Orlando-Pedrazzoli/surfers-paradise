import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Brand from '@/lib/models/Brand';
import Category from '@/lib/models/Category';
import Supplier from '@/lib/models/Supplier';

const _deps = [Brand, Category, Supplier];
void _deps;

const LOW_STOCK_THRESHOLD = 3;

export async function GET() {
  try {
    await connectDB();

    const [
      total,
      complete,
      partial,
      incomplete,
      inStore,
      online,
      outOfStock,
      lowStock,
      inStock,
      brandsAgg,
      suppliersAgg,
      categoriesAgg,
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ completionStatus: 'complete' }),
      Product.countDocuments({ completionStatus: 'partial' }),
      Product.countDocuments({ completionStatus: 'incomplete' }),
      Product.countDocuments({ isAvailableInStore: true }),
      Product.countDocuments({ isPublishedOnline: true }),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
      Product.countDocuments({ stock: { $gt: LOW_STOCK_THRESHOLD } }),
      Product.aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'brands',
            localField: '_id',
            foreignField: '_id',
            as: 'brand',
          },
        },
        { $unwind: '$brand' },
        {
          $project: {
            _id: '$brand._id',
            name: '$brand.name',
            count: 1,
          },
        },
        { $sort: { name: 1 } },
      ]),
      Product.aggregate([
        { $match: { supplier: { $ne: null } } },
        { $group: { _id: '$supplier', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'suppliers',
            localField: '_id',
            foreignField: '_id',
            as: 'supplier',
          },
        },
        { $unwind: '$supplier' },
        {
          $project: {
            _id: '$supplier._id',
            name: '$supplier.name',
            count: 1,
          },
        },
        { $sort: { name: 1 } },
      ]),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $project: {
            _id: '$category._id',
            name: '$category.name',
            count: 1,
          },
        },
        { $sort: { name: 1 } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      facets: {
        total,
        status: {
          complete,
          partial,
          incomplete,
        },
        channel: {
          inStore,
          online,
        },
        stock: {
          outOfStock,
          lowStock,
          inStock,
        },
        brands: brandsAgg,
        suppliers: suppliersAgg,
        categories: categoriesAgg,
      },
    });
  } catch (error) {
    console.error('GET facets error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar facets';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
