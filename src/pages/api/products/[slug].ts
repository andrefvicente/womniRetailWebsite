import type { APIRoute } from 'astro';
import { defaultLocale, isLocale } from '../../../i18n/config';
import { localizeProduct } from '../../../i18n';
import { getDatabase, getProductRow } from '../../../lib/db/products';
import { rowToProductBase } from '../../../lib/db/types';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
	const slug = params.slug;
	if (!slug) {
		return new Response(JSON.stringify({ error: 'Slug em falta' }), { status: 400 });
	}

	try {
		const db = getDatabase();
		const localeParam = url.searchParams.get('locale') ?? defaultLocale;
		const locale = isLocale(localeParam) ? localeParam : defaultLocale;
		const row = await getProductRow(db, slug, locale);

		if (!row) {
			return new Response(JSON.stringify({ error: 'Produto não encontrado' }), { status: 404 });
		}

		const product = localizeProduct(rowToProductBase(row), locale);

		return new Response(JSON.stringify({ locale, product }), {
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=60',
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erro ao obter produto';
		return new Response(JSON.stringify({ error: message }), { status: 500 });
	}
};
