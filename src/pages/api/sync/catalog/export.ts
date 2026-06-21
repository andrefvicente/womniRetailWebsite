import type { APIRoute } from 'astro';
import { handleCatalogExport } from '../../../../lib/sync/handlers';

export const prerender = false;

/** Legacy path — prefer GET /api/sync/catalog */
export const GET: APIRoute = async ({ request, url }) => handleCatalogExport(request, url);
