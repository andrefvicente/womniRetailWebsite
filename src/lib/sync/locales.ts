import { defaultLocale, isLocale, locales } from '../../i18n/config';

/** Womni locale ids → site locale keys (see src/i18n/config.ts). */
const WOMNI_TO_SITE: Record<string, string> = {
	'pt-pt': 'pt',
	pt: 'pt',
	'en-us': 'en',
	en: 'en',
	'es-es': 'es',
	es: 'es',
};

export function mapWomniLocaleToSite(womniLocale: string | undefined | null): string | null {
	if (!womniLocale) {
		return null;
	}
	const key = String(womniLocale).trim().toLowerCase();
	const mapped = WOMNI_TO_SITE[key] ?? key.split('-')[0];
	return isLocale(mapped) ? mapped : null;
}

export function supportedSiteLocales(): readonly string[] {
	return locales;
}

export function resolveSiteLocale(womniLocale?: string | null): string {
	return mapWomniLocaleToSite(womniLocale) ?? defaultLocale;
}
