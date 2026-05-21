import type { ProductBase } from '../../data/types';
import { defaultLocale } from '../../i18n/config';
import type { ProductFilters, ProductRow, ProductSort, ProductTranslationRow } from './types';
import { rowToProductBase } from './types';

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
	if (filters?.room?.length) {
		clauses.push(`p.room IN (${filters.room.map(() => '?').join(', ')})`);
		binds.push(...filters.room);
	}
	if (filters?.material?.length) {
		clauses.push(`p.material IN (${filters.material.map(() => '?').join(', ')})`);
		binds.push(...filters.material);
	}
	if (filters?.style?.length) {
		clauses.push(`p.style IN (${filters.style.map(() => '?').join(', ')})`);
		binds.push(...filters.style);
	}
	if (filters?.color?.length) {
		for (const color of filters.color) {
			clauses.push(`p.colors LIKE ?`);
			binds.push(`%"${color}"%`);
		}
	}
	if (filters?.q) {
		clauses.push('(t.name LIKE ? OR p.material LIKE ? OR p.style LIKE ?)');
		const term = `%${filters.q}%`;
		binds.push(term, term, term);
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
		case 'rating':
			return 'ORDER BY p.rating DESC, p.review_count DESC';
		case 'new':
			return "ORDER BY CASE WHEN p.badge = 'new' THEN 0 ELSE 1 END, p.created_at DESC";
		default:
			return "ORDER BY p.rating DESC, CASE WHEN p.badge = 'bestseller' THEN 0 ELSE 1 END, p.review_count DESC";
	}
}

export async function listProductRows(
	db: D1Database,
	locale: string = defaultLocale,
	filters?: ProductFilters,
	sort: ProductSort = 'popular',
): Promise<ProductRow[]> {
	const { sql: whereSql, binds } = buildWhere(filters);
	const query = `
		SELECT p.*
		FROM products p
		INNER JOIN product_translations t ON t.slug = p.slug AND t.locale = ?
		${whereSql}
		${orderByClause(sort)}
	`;
	const result = await db
		.prepare(query)
		.bind(locale, ...binds)
		.all<ProductRow>();
	return result.results ?? [];
}

export async function getProductRow(
	db: D1Database,
	slug: string,
	locale: string = defaultLocale,
): Promise<ProductRow | null> {
	const row = await db
		.prepare(
			`SELECT p.* FROM products p
			 INNER JOIN product_translations t ON t.slug = p.slug AND t.locale = ?
			 WHERE p.slug = ?`,
		)
		.bind(locale, slug)
		.first<ProductRow>();
	return row ?? null;
}

export async function getProductTranslation(
	db: D1Database,
	slug: string,
	locale: string = defaultLocale,
): Promise<ProductTranslationRow | null> {
	const row = await db
		.prepare('SELECT * FROM product_translations WHERE slug = ? AND locale = ?')
		.bind(slug, locale)
		.first<ProductTranslationRow>();
	return row ?? null;
}

export async function listProductsBase(
	db: D1Database,
	locale?: string,
	filters?: ProductFilters,
	sort?: ProductSort,
): Promise<ProductBase[]> {
	const rows = await listProductRows(db, locale, filters, sort);
	return rows.map(rowToProductBase);
}

export async function getProductBase(
	db: D1Database,
	slug: string,
	locale?: string,
): Promise<ProductBase | null> {
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
	for (const key of ['room', 'material', 'style'] as const) {
		const val = url.searchParams.get(key);
		if (val) filters[key] = val.split(',') as ProductFilters[typeof key];
	}
	const color = url.searchParams.get('color');
	if (color) filters.color = color.split(',') as ProductFilters['color'];
	return filters;
}

export function parseProductSort(url: URL): ProductSort {
	const sort = url.searchParams.get('sort');
	if (sort === 'price-asc' || sort === 'price-desc' || sort === 'new' || sort === 'rating') {
		return sort;
	}
	return 'popular';
}
