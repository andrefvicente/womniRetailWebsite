import type { APIRoute } from 'astro';
import { handleSiteConfigImport } from '../../../../lib/sync/handlers';

export const prerender = false;

/** Womni channel sync: POST appearance / site settings into D1. */
export const POST: APIRoute = async ({ request }) => handleSiteConfigImport(request);
