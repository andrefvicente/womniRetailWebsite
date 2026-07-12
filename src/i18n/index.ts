import pt from './pt';
import type { UiDictionary } from './types';
import type { Locale } from './config';
import { defaultLocale, isLocale } from './config';
import type { Product, ProductBase } from '../data/types';
import { products as staticProductCatalog } from '../data/products';
import { getDatabase, hasDatabase } from '../lib/db/bindings';
import { getLocalizedProductFromDb, listLocalizedProducts } from '../lib/db/products';

const dictionaries: Record<Locale, UiDictionary> = { pt };

export function useTranslations(locale?: string): UiDictionary {
	if (locale && isLocale(locale)) {
		return dictionaries[locale];
	}

	const short = locale?.split(/[-_]/)[0]?.toLowerCase();
	if (short && isLocale(short)) {
		return dictionaries[short as Locale];
	}

	return dictionaries[defaultLocale];
}

export function localizeProduct(base: ProductBase, locale?: string): Product {
	const t = useTranslations(locale);
	const copy = t.products[base.slug];
	if (!copy) {
		throw new Error(`Missing product copy for slug: ${base.slug}`);
	}
	return { ...base, ...copy };
}

/** Lista produtos: D1 via `cloudflare:workers` env, senão fallback estático. */
export async function getLocalizedProducts(locale?: string): Promise<Product[]> {
	if (hasDatabase()) {
		const db = getDatabase();
		return listLocalizedProducts(db, locale ?? defaultLocale);
	}
	return staticProductCatalog.map((p) => localizeProduct(p, locale));
}

export async function getLocalizedProduct(slug: string, locale?: string): Promise<Product | undefined> {
	if (hasDatabase()) {
		const db = getDatabase();
		const product = await getLocalizedProductFromDb(db, slug, locale ?? defaultLocale);
		return product ?? undefined;
	}
	const base = staticProductCatalog.find((p) => p.slug === slug);
	return base ? localizeProduct(base, locale) : undefined;
}

export function formatPrice(amount: number, locale?: string): string {
	const loc = locale && isLocale(locale) ? locale : defaultLocale;
	const intlLocale = loc === 'pt' ? 'pt-PT' : loc;
	return new Intl.NumberFormat(intlLocale, {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export { defaultLocale, locales, isLocale } from './config';
export type { Locale } from './config';
export type { UiDictionary } from './types';
