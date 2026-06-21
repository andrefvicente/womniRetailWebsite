import type { ProductFilters, ProductRowWithTranslation, ProductSort } from './types';
import { rowToProduct, rowToProductBase } from './types';
import { enrichProductCombinations, listCombinationsByProductSlugs, listProductCombinations } from './combinations';
import { resolveProductPrice } from './prices';
import type { Product } from '../../data/types';
import { defaultLocale } from '../../i18n/config';

export { getDatabase, hasDatabase } from './bindings';

function buildWhere(filters?: ProductFilters): { sql: string; binds: (string | number)[] } {
	const clauses: string[] = [];
	const binds: (string | number)[] = [];

	if (filters?.sale) {
		clauses.push('p.original_price IS NOT NULL');
	}
	if (filters?.badge) {
		clauses.push('p.badge = ?');
		binds.push(filters.badge);
	}
	if (filters?.q) {
		clauses.push('t.name LIKE ?');
		binds.push(`%${filters.q}%`);
	}
	if (filters?.categorySlugs?.length) {
		clauses.push(
			`p.category_slug IN (${filters.categorySlugs.map(() => '?').join(', ')})`,
		);
		binds.push(...filters.categorySlugs);
	}

	const sql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
	return { sql, binds };
}

function orderByClause(sort: ProductSort = 'popular'): string {
	switch (sort) {
		case 'price-asc':
			return 'ORDER BY p.price ASC';
		case 'price-desc':
			return 'ORDER BY p.price DESC';
		case 'new':
			return "ORDER BY CASE WHEN p.badge = 'new' THEN 0 ELSE 1 END, p.created_at DESC";
		default:
			return "ORDER BY CASE WHEN p.badge = 'bestseller' THEN 0 ELSE 1 END, p.created_at DESC, p.slug ASC";
	}
}

export async function listProductRows(
	db: D1Database,
	locale: string = defaultLocale,
	filters?: ProductFilters,
	sort: ProductSort = 'popular',
): Promise<ProductRowWithTranslation[]> {
	const { sql: whereSql, binds } = buildWhere(filters);
	const query = `
		SELECT p.*, t.locale, t.name, t.description, t.care
		FROM products p
		INNER JOIN product_translations t ON t.slug = p.slug AND t.locale = ?
		${whereSql}
		${orderByClause(sort)}
	`;
	const result = await db
		.prepare(query)
		.bind(locale, ...binds)
		.all<ProductRowWithTranslation>();
	return result.results ?? [];
}

export async function listLocalizedProducts(
	db: D1Database,
	locale: string = defaultLocale,
	filters?: ProductFilters,
	sort: ProductSort = 'popular',
): Promise<Product[]> {
	const rows = await listProductRows(db, locale, filters, sort);
	const combinationsBySlug = await listCombinationsByProductSlugs(
		db,
		rows.map((row) => row.slug),
	);

	return rows.map((row) => {
		const baseProduct = rowToProduct(row);
		const combinations = combinationsBySlug.get(row.slug);
		const enriched = combinations?.length
			? enrichProductCombinations(combinations, baseProduct.optionGroups)
			: undefined;
		const { price, originalPrice } = resolveProductPrice(row.price, enriched);
		return {
			...rowToProduct({
				...row,
				price,
				original_price: originalPrice ?? row.original_price,
			}),
			combinations: enriched?.length ? enriched : undefined,
		};
	});
}

export async function getProductRow(
	db: D1Database,
	slug: string,
	locale: string = defaultLocale,
): Promise<ProductRowWithTranslation | null> {
	const row = await db
		.prepare(
			`SELECT p.*, t.locale, t.name, t.description, t.care
			 FROM products p
			 INNER JOIN product_translations t ON t.slug = p.slug AND t.locale = ?
			 WHERE p.slug = ?`,
		)
		.bind(locale, slug)
		.first<ProductRowWithTranslation>();
	return row ?? null;
}

export async function getLocalizedProductFromDb(
	db: D1Database,
	slug: string,
	locale: string = defaultLocale,
): Promise<Product | null> {
	const row = await getProductRow(db, slug, locale);
	if (!row) {
		return null;
	}
	const baseProduct = rowToProduct(row);
	const combinations = await listProductCombinations(db, slug);
	const enriched = combinations.length
		? enrichProductCombinations(combinations, baseProduct.optionGroups)
		: [];
	const { price, originalPrice } = resolveProductPrice(row.price, enriched);
	return {
		...rowToProduct({
			...row,
			price,
			original_price: originalPrice ?? row.original_price,
		}),
		combinations: enriched.length ? enriched : undefined,
	};
}

export async function getProductTranslation(
	db: D1Database,
	slug: string,
	locale: string = defaultLocale,
): Promise<import('./types').ProductTranslationRow | null> {
	const row = await db
		.prepare('SELECT * FROM product_translations WHERE slug = ? AND locale = ?')
		.bind(slug, locale)
		.first<import('./types').ProductTranslationRow>();
	return row ?? null;
}

export async function listProductsBase(
	db: D1Database,
	locale?: string,
	filters?: ProductFilters,
	sort?: ProductSort,
): Promise<import('../../data/types').ProductBase[]> {
	const rows = await listProductRows(db, locale, filters, sort);
	return rows.map(rowToProductBase);
}

export async function getProductBase(
	db: D1Database,
	slug: string,
	locale?: string,
): Promise<import('../../data/types').ProductBase | null> {
	const row = await getProductRow(db, slug, locale);
	return row ? rowToProductBase(row) : null;
}

export function parseProductFiltersFromUrl(url: URL): ProductFilters {
	const filters: ProductFilters = {};
	if (url.searchParams.get('sale') === 'true') filters.sale = true;
	const badge = url.searchParams.get('badge');
	if (badge === 'sale' || badge === 'new' || badge === 'bestseller') {
		filters.badge = badge;
	}
	const q = url.searchParams.get('q');
	if (q) filters.q = q.toLowerCase();
	return filters;
}

export function parseProductSort(url: URL): ProductSort {
	const sort = url.searchParams.get('sort');
	if (sort === 'price-asc' || sort === 'price-desc' || sort === 'new') {
		return sort;
	}
	return 'popular';
}
