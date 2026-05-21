/** Locales ativos no site. Adicione 'en', 'es', etc. quando houver traduções. */
export const locales = ['pt'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pt';

export function isLocale(value: string): value is Locale {
	return (locales as readonly string[]).includes(value);
}
