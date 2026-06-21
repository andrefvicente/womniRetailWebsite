import type { APIRoute } from 'astro';
import { handleCategoryImport } from '../../../../lib/sync/handlers';

export const prerender = false;

/** Upsert catalog categories from Womni (does not modify products). */
export const POST: APIRoute = async ({ request }) => handleCategoryImport(request);
