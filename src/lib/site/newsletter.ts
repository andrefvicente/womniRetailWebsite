import { hasDatabase, getDatabase } from '../db/bindings';

export const NEWSLETTER_ENABLED_KEY = 'NEWSLETTER_ENABLED';
export const NEWSLETTER_LOCALES_KEY = 'NEWSLETTER_LOCALES';

export interface NewsletterLocaleCopy {
	title?: string;
	description?: string;
	emailLabel?: string;
	placeholder?: string;
	subscribe?: string;
}

export interface SiteNewsletter {
	enabled: boolean;
	locales: Record<string, NewsletterLocaleCopy>;
}

function parseBool(value: string | undefined): boolean | null {
	if (value == null || value === '') {
		return null;
	}
	const normalized = value.trim().toLowerCase();
	if (normalized === 'true' || normalized === '1') {
		return true;
	}
	if (normalized === 'false' || normalized === '0') {
		return false;
	}
	return null;
}

function parseLocales(raw: string | undefined): Record<string, NewsletterLocaleCopy> {
	if (!raw?.trim()) {
		return {};
	}

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return {};
		}

		const locales: Record<string, NewsletterLocaleCopy> = {};
		for (const [locale, copy] of Object.entries(parsed as Record<string, unknown>)) {
			if (!locale.trim() || !copy || typeof copy !== 'object' || Array.isArray(copy)) {
				continue;
			}
			locales[locale] = { ...(copy as NewsletterLocaleCopy) };
		}
		return locales;
	} catch {
		return {};
	}
}

/** Missing DB key keeps the legacy default (visible). Explicit false hides the block. */
export async function loadSiteNewsletter(): Promise<SiteNewsletter> {
	const defaults: SiteNewsletter = { enabled: true, locales: {} };

	if (!hasDatabase()) {
		return defaults;
	}

	try {
		const db = getDatabase();
		const rows = await db
			.prepare('SELECT key, value FROM site_settings WHERE key IN (?, ?)')
			.bind(NEWSLETTER_ENABLED_KEY, NEWSLETTER_LOCALES_KEY)
			.all<{ key: string; value: string }>();

		const map = new Map((rows.results ?? []).map((row) => [row.key, row.value]));
		const enabledSetting = parseBool(map.get(NEWSLETTER_ENABLED_KEY));

		return {
			enabled: enabledSetting ?? defaults.enabled,
			locales: parseLocales(map.get(NEWSLETTER_LOCALES_KEY)),
		};
	} catch {
		return defaults;
	}
}

export function resolveNewsletterCopy(
	locale: string | undefined,
	defaults: NewsletterLocaleCopy,
	locales: Record<string, NewsletterLocaleCopy>,
): NewsletterLocaleCopy {
	const short = locale?.split(/[-_]/)[0]?.toLowerCase();
	const custom =
		(short && locales[short]) ||
		(locale && locales[locale]) ||
		(short && locales[locale ?? '']) ||
		{};

	return {
		title: custom.title?.trim() || defaults.title,
		description: custom.description?.trim() || defaults.description,
		emailLabel: custom.emailLabel?.trim() || defaults.emailLabel,
		placeholder: custom.placeholder?.trim() || defaults.placeholder,
		subscribe: custom.subscribe?.trim() || defaults.subscribe,
	};
}
