import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';

// Importar para forçar registro dos models
const _deps = [Brand];
void _deps;

/**
 * GET /api/products/facets-shop?categorySlug=quilhas
 *
 * Retorna os valores únicos de cada filtro disponível para a
 * categoria atual, com counts em tempo real.
 *
 * Query params:
 *   - categorySlug (opcional): filtra por categoria/subcategoria
 *   - brand, setup, construction, template, size, minPrice, maxPrice
 *     (filtros já aplicados, para counts contextuais)
 *
 * Retorna:
 *   {
 *     success: true,
 *     facets: {
 *       brands: [{ _id, name, count }],
 *       subcategories: [{ _id, name, slug, count }],
 *       setups: [{ value, count }],
 *       constructions: [{ value, count }],
 *       templates: [{ value, count }],
 *       sizes: [{ value, count }],
 *       priceRange: { min, max }
 *     },
 *     total: 78
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('categorySlug') || '';
    const brand = searchParams.get('brand') || '';
    const setup = searchParams.get('setup') || '';
    const construction = searchParams.get('construction') || '';
    const template = searchParams.get('template') || '';
    const size = searchParams.get('size') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // ═══ Base filter: só produtos ativos publicados ═══
    const baseFilter: Record<string, unknown> = {
      isActive: true,
      isPublishedOnline: true,
      isMainVariant: true,
    };

    // ═══ Resolver categoria ═══
    let currentCategory: {
      _id: unknown;
      name: string;
      slug: string;
      level: number;
    } | null = null;
    let subcategoryIds: unknown[] = [];

    if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug }).lean();
      if (cat) {
        currentCategory = {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          level: cat.level || 0,
        };

        if (cat.level === 0) {
          // Categoria raiz: incluir produtos da raiz E de todas subcategorias filhas
          const subcats = await Category.find({ parent: cat._id })
            .select('_id')
            .lean();
          subcategoryIds = subcats.map(s => s._id);
          baseFilter.category = { $in: [cat._id, ...subcategoryIds] };
        } else {
          // Subcategoria: só produtos dessa subcategoria
          baseFilter.subcategory = cat._id;
        }
      }
    }

    // ═══ Filtros aplicados (para counts contextuais) ═══
    const appliedFilter = { ...baseFilter };
    if (brand) appliedFilter.brand = brand;
    if (setup) appliedFilter.setup = setup;
    if (construction) appliedFilter.construction = construction;
    if (template) appliedFilter.template = template;
    if (size) appliedFilter.size = size;
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      appliedFilter.price = priceFilter;
    }

    // ═══ Total de produtos com filtros aplicados ═══
    const total = await Product.countDocuments(appliedFilter);

    // ═══ Helper: agregar campo com counts ═══
    async function aggregateField(
      field: string,
      excludeSelf: boolean = true,
    ): Promise<{ value: string; count: number }[]> {
      // Para counts contextuais: ao calcular counts para "setup", removemos
      // o filtro de setup; assim o user vê os outros setups disponíveis
      // mesmo depois de selecionar um.
      const filter = { ...appliedFilter };
      if (excludeSelf) delete filter[field];

      const result = await Product.aggregate([
        { $match: filter },
        { $match: { [field]: { $ne: '', $exists: true } } },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]);

      return result.map(r => ({
        value: r._id as string,
        count: r.count as number,
      }));
    }

    // ═══ Helper: agregar Brand (precisa lookup) ═══
    async function aggregateBrands() {
      const filter = { ...appliedFilter };
      delete filter.brand;

      const result = await Product.aggregate([
        { $match: filter },
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
            slug: '$brand.slug',
            count: 1,
          },
        },
        { $sort: { name: 1 } },
      ]);

      return result;
    }

    // ═══ Helper: agregar Subcategorias (só se categoria raiz) ═══
    async function aggregateSubcategories() {
      if (!currentCategory || currentCategory.level !== 0) return [];

      const filter = { ...appliedFilter };
      // Não excluir nada — queremos counts reais por subcategoria

      const result = await Product.aggregate([
        { $match: filter },
        { $match: { subcategory: { $ne: null, $exists: true } } },
        { $group: { _id: '$subcategory', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'cat',
          },
        },
        { $unwind: '$cat' },
        {
          $project: {
            _id: '$cat._id',
            name: '$cat.name',
            slug: '$cat.slug',
            count: 1,
          },
        },
        { $sort: { name: 1 } },
      ]);

      return result;
    }

    // ═══ Helper: price range ═══
    async function aggregatePriceRange() {
      const filter = { ...appliedFilter };
      delete filter.price;

      const result = await Product.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            min: { $min: '$price' },
            max: { $max: '$price' },
          },
        },
      ]);

      if (result.length === 0) return { min: 0, max: 0 };
      return { min: result[0].min || 0, max: result[0].max || 0 };
    }

    // ═══ Executar tudo em paralelo ═══
    const [
      brands,
      subcategories,
      setups,
      constructions,
      templates,
      sizes,
      priceRange,
    ] = await Promise.all([
      aggregateBrands(),
      aggregateSubcategories(),
      aggregateField('setup'),
      aggregateField('construction'),
      aggregateField('template'),
      aggregateField('size'),
      aggregatePriceRange(),
    ]);

    return NextResponse.json({
      success: true,
      facets: {
        brands,
        subcategories,
        setups,
        constructions,
        templates,
        sizes,
        priceRange,
      },
      total,
      currentCategory,
    });
  } catch (error) {
    console.error('GET facets-shop error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar facets';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
