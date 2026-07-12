import type { Product } from '../../data/types';
import type { ProductGridQuery } from './page-types';

export function resolveProductGrid(
	products: Product[],
	query: ProductGridQuery | undefined,
): Product[] {
	const limit = query?.limit && query.limit > 0 ? query.limit : 4;

	if (query?.variant === 'new-arrivals') {
		const fresh = products.filter((product) => product.badge === 'new');
		return (fresh.length ? fresh : products).slice(0, limit);
	}

	return products
		.filter((product) => product.badge === 'bestseller' || product.badge === 'sale')
		.slice(0, limit);
}

export function buildSeeMoreHref(
	defaultCatalogHref: string,
	seeMoreQuery: string | undefined,
): string {
	if (!seeMoreQuery?.trim()) {
		return defaultCatalogHref;
	}

	const separator = defaultCatalogHref.includes('?') ? '&' : '?';
	return `${defaultCatalogHref}${separator}${seeMoreQuery.trim()}`;
}
