/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
	DB: D1Database;
	/** Bearer token for /api/sync/catalog/* (wrangler secret put WOMNI_SYNC_SECRET) */
	WOMNI_SYNC_SECRET?: string;
}
