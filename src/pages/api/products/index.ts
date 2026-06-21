import type { APIRoute } from 'astro';
import { defaultLocale, isLocale } from '../../../i18n/config';
import {
	getDatabase,
	listLocalizedProducts,
	listProductRows,
	parseProductFiltersFromUrl,
	parseProductSort,
} from '../../../lib/db/products';
import { handleCatalogExport, handleCatalogImport } from '../../../lib/sync/handlers';
import { verifySyncAuth } from '../../../lib/sync/auth';

export const prerender = false;

/** Womni channel sync: GET ?womniSync=catalog (list) or ?womniSync=catalog&catalog=id (export). */
export const GET: APIRoute = async ({ request, url }) => {
	if (url.searchParams.get('womniSync') === 'catalog') {
		if (!verifySyncAuth(request)) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		return handleCatalogExport(request, url);
	}

	try {
		const db = getDatabase();
		const localeParam = url.searchParams.get('locale') ?? defaultLocale;
		const locale = isLocale(localeParam) ? localeParam : defaultLocale;
		const filters = parseProductFiltersFromUrl(url);
		const sort = parseProductSort(url);
		const maxPrice = Number(url.searchParams.get('maxPrice') ?? 0);

		let products = await listLocalizedProducts(db, locale, filters, sort);

		if (maxPrice > 0) {
			products = products.filter((product) => product.price <= maxPrice);
		}

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

/** Womni channel sync: POST catalog import (Bearer token required). */
export const POST: APIRoute = async ({ request }) => {
	if (!verifySyncAuth(request)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return handleCatalogImport(request);
};
