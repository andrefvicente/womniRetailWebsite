import { hasDatabase, getDatabase } from '../db/bindings';

export const CATALOG_MODE_KEY = 'CATALOG_MODE';

export interface SiteFeatures {
	catalogMode: boolean;
}

function parseBool(value: string | undefined): boolean {
	if (!value) {
		return false;
	}
	const normalized = value.trim().toLowerCase();
	return normalized === 'true' || normalized === '1';
}

export async function loadSiteFeatures(): Promise<SiteFeatures> {
	const defaults: SiteFeatures = { catalogMode: false };

	if (!hasDatabase()) {
		return defaults;
	}

	try {
		const db = getDatabase();
		const row = await db
			.prepare('SELECT value FROM site_settings WHERE key = ?')
			.bind(CATALOG_MODE_KEY)
			.first<{ value: string }>();

		return {
			catalogMode: parseBool(row?.value),
		};
	} catch {
		return defaults;
	}
}
