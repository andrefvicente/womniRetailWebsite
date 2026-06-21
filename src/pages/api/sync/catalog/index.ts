import type { APIRoute } from 'astro';
import { handleCatalogExport, handleCatalogImport } from '../../../../lib/sync/handlers';

export const prerender = false;

/** Canonical sync endpoint used by the Womni womnisite channel. */
export const GET: APIRoute = async ({ request, url }) => handleCatalogExport(request, url);

export const POST: APIRoute = async ({ request }) => handleCatalogImport(request);
