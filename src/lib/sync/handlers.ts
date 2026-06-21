import { getDatabase } from '../db/products';
import { exportCatalog, importCatalog, importCategories } from '../db/sync';
import type { CatalogImportPayload, CategoryImportPayload } from './types';
import { verifySyncAuth } from './auth';

const jsonHeaders = { 'Content-Type': 'application/json' };

function unauthorized() {
	return new Response(JSON.stringify({ error: 'Unauthorized' }), {
		status: 401,
		headers: jsonHeaders,
	});
}

function badRequest(message: string) {
	return new Response(JSON.stringify({ error: message }), {
		status: 400,
		headers: jsonHeaders,
	});
}

function serverError(error: unknown) {
	const message = error instanceof Error ? error.message : 'Request failed';
	return new Response(JSON.stringify({ error: message }), {
		status: 500,
		headers: jsonHeaders,
	});
}

/** GET /api/sync/catalog — list catalogs or export one (?catalog=id). */
export async function handleCatalogExport(request: Request, url: URL): Promise<Response> {
	if (!verifySyncAuth(request)) {
		return unauthorized();
	}

	const catalogId = url.searchParams.get('catalog') ?? '1';

	try {
		const db = getDatabase();
		const payload = await exportCatalog(db, catalogId);

		if (url.searchParams.has('catalog')) {
			return new Response(
				JSON.stringify({
					catalogName: payload.catalogName,
					categories: payload.categories,
					products: payload.products.map((product) => ({
						...product,
						modifierGroups: [],
					})),
				}),
				{
					status: 200,
					headers: { ...jsonHeaders, 'Cache-Control': 'no-store' },
				},
			);
		}

		return new Response(JSON.stringify({ catalogs: payload.catalogs }), {
			status: 200,
			headers: { ...jsonHeaders, 'Cache-Control': 'no-store' },
		});
	} catch (error) {
		return serverError(error);
	}
}

/** POST /api/sync/catalog — import catalog payload into D1. */
export async function handleCatalogImport(request: Request): Promise<Response> {
	if (!verifySyncAuth(request)) {
		return unauthorized();
	}

	let payload: CatalogImportPayload;
	try {
		payload = (await request.json()) as CatalogImportPayload;
	} catch {
		return badRequest('Invalid JSON body');
	}

	const hasProducts = Array.isArray(payload.products) && payload.products.length > 0;
	const hasCategories = Array.isArray(payload.categories) && payload.categories.length > 0;

	if (!hasProducts && !hasCategories) {
		return badRequest('products or categories array is required');
	}

	if (!Array.isArray(payload.products)) {
		payload.products = [];
	}

	try {
		const db = getDatabase();
		const result = await importCatalog(db, payload);
		return new Response(JSON.stringify({ ok: true, ...result }), {
			status: 200,
			headers: jsonHeaders,
		});
	} catch (error) {
		return serverError(error);
	}
}

/** POST /api/sync/catalog/category — upsert one or more categories without touching products. */
export async function handleCategoryImport(request: Request): Promise<Response> {
	if (!verifySyncAuth(request)) {
		return unauthorized();
	}

	let payload: CategoryImportPayload;
	try {
		payload = (await request.json()) as CategoryImportPayload;
	} catch {
		return badRequest('Invalid JSON body');
	}

	const hasCategories =
		(Array.isArray(payload.categories) && payload.categories.length > 0) ||
		Boolean(payload.category);

	if (!hasCategories) {
		return badRequest('category or categories is required');
	}

	try {
		const db = getDatabase();
		const result = await importCategories(db, payload);
		return new Response(JSON.stringify({ ok: true, ...result }), {
			status: 200,
			headers: jsonHeaders,
		});
	} catch (error) {
		return serverError(error);
	}
}
