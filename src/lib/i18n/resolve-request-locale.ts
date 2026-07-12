import { defaultLocale } from '../../i18n/config';

/** Resolve locale from ?lang= / ?locale= (editor preview) or Astro i18n. */
export function resolveRequestLocale(
	url: URL,
	astroLocale?: string | null,
): string {
	const fromQuery = url.searchParams.get('lang') ?? url.searchParams.get('locale');
	if (fromQuery?.trim()) {
		const short = fromQuery.trim().split(/[-_]/)[0]?.toLowerCase();
		return short || fromQuery.trim().toLowerCase();
	}

	if (astroLocale?.trim()) {
		const short = astroLocale.trim().split(/[-_]/)[0]?.toLowerCase();
		return short || astroLocale.trim().toLowerCase();
	}

	return defaultLocale;
}
