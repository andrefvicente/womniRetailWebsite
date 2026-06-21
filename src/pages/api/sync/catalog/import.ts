import type { APIRoute } from 'astro';
import { handleCatalogImport } from '../../../../lib/sync/handlers';

export const prerender = false;

/** Legacy path — prefer POST /api/sync/catalog */
export const POST: APIRoute = async ({ request }) => handleCatalogImport(request);
