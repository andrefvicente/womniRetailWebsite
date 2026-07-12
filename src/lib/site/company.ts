import { hasDatabase, getDatabase } from '../db/bindings';

export const COMPANY_BUSINESS_NAME_KEY = 'COMPANY_BUSINESS_NAME';
export const COMPANY_NAME_KEY = 'COMPANY_NAME';
export const COMPANY_VAT_NUMBER_KEY = 'COMPANY_VAT_NUMBER';

export interface SiteCompany {
	businessName: string;
	companyName: string;
	vatNumber: string;
}

function trim(value: string | undefined): string {
	return value?.trim() ?? '';
}

export async function loadSiteCompany(): Promise<SiteCompany | null> {
	if (!hasDatabase()) {
		return null;
	}

	try {
		const db = getDatabase();
		const rows = await db
			.prepare('SELECT key, value FROM site_settings WHERE key IN (?, ?, ?)')
			.bind(COMPANY_BUSINESS_NAME_KEY, COMPANY_NAME_KEY, COMPANY_VAT_NUMBER_KEY)
			.all<{ key: string; value: string }>();

		const map = new Map((rows.results ?? []).map((row) => [row.key, row.value]));
		const businessName = trim(map.get(COMPANY_BUSINESS_NAME_KEY));
		const companyName = trim(map.get(COMPANY_NAME_KEY));
		const vatNumber = trim(map.get(COMPANY_VAT_NUMBER_KEY));

		if (!businessName && !companyName && !vatNumber) {
			return null;
		}

		return { businessName, companyName, vatNumber };
	} catch {
		return null;
	}
}

export function formatFooterLegal(
	company: SiteCompany,
	year: number,
	rights: string,
): string {
	const parts = [
		company.businessName,
		[company.companyName, company.vatNumber].filter(Boolean).join(' - '),
	]
		.filter(Boolean)
		.join(' | ');

	return `© ${year} ${parts}. ${rights}`;
}
