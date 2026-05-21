import type { APIRoute } from 'astro';
import { defaultLocale, isLocale } from '../../../i18n/config';
import { localizeProduct } from '../../../i18n';
import {
	getDatabase,
	listProductRows,
	parseProductFiltersFromUrl,
	parseProductSort,
} from '../../../lib/db/products';
import { rowToProductBase } from '../../../lib/db/types';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	try {
		const db = getDatabase();
		const localeParam = url.searchParams.get('locale') ?? defaultLocale;
		const locale = isLocale(localeParam) ? localeParam : defaultLocale;
		const filters = parseProductFiltersFromUrl(url);
		const sort = parseProductSort(url);
		const maxPrice = Number(url.searchParams.get('maxPrice') ?? 0);

		let rows = await listProductRows(db, locale, filters, sort);

		if (maxPrice > 0) {
			rows = rows.filter((row) => row.price <= maxPrice);
		}

		const products = rows.map((row) => localizeProduct(rowToProductBase(row), locale));

		return new Response(
			JSON.stringify({
				locale,
				count: products.length,
				products,
			}),
			{
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Cache-Control': 'public, max-age=60',
				},
			},
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erro ao listar produtos';
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
		});
	}
};
