import type { BadgeKey, Product, ProductBase, ProductFeature, VariantOptionGroup } from '../../data/types';
import { normalizeOptionGroups } from '../variants';

export interface ProductRow {
	slug: string;
	price: number;
	original_price: number | null;
	promotion_start: string | null;
	promotion_end: string | null;
	image: string;
	images: string;
	option_groups: string;
	features: string;
	sizes: string;
	colors: string;
	material: string;
	style: string;
	room: string;
	rating: number;
	review_count: number;
	badge: BadgeKey | null;
	category_slug: string | null;
}

export interface ProductTranslationRow {
	slug: string;
	locale: string;
	name: string;
	description: string;
	care: string;
}

export interface ProductFilters {
	sale?: boolean;
	badge?: BadgeKey;
	q?: string;
	categorySlugs?: string[];
}

export type ProductSort = 'popular' | 'price-asc' | 'price-desc' | 'new';

export interface ProductRowWithTranslation extends ProductRow {
	locale: string;
	name: string;
	description: string;
	care: string;
}

export function parseOptionGroups(raw: string | null | undefined): VariantOptionGroup[] {
	return normalizeOptionGroups(
		raw
			? (() => {
					try {
						return JSON.parse(raw);
					} catch {
						return [];
					}
				})()
			: [],
	);
}

export function parseFeatures(raw: string | null | undefined): ProductFeature[] {
	if (!raw) {
		return [];
	}
	try {
		const parsed = JSON.parse(raw) as ProductFeature[];
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed
			.filter((item) => item?.name?.trim())
			.map((item) => ({
				name: item.name.trim(),
				value: (item.value ?? item.name).trim(),
			}));
	} catch {
		return [];
	}
}

export function rowToProductBase(row: ProductRow): ProductBase {
	return {
		slug: row.slug,
		price: row.price,
		originalPrice: row.original_price ?? undefined,
		promotionStart: row.promotion_start ?? undefined,
		promotionEnd: row.promotion_end ?? undefined,
		image: row.image,
		images: JSON.parse(row.images) as string[],
		features: parseFeatures(row.features),
		optionGroups: parseOptionGroups(row.option_groups),
		badge: row.badge ?? undefined,
		categorySlug: row.category_slug ?? undefined,
	};
}

export function rowToProduct(row: ProductRowWithTranslation): Product {
	return {
		...rowToProductBase(row),
		name: row.name,
		description: row.description,
		care: row.care,
	};
}
