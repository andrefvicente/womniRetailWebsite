import type { BadgeKey } from '../../data/types';

export interface SyncCategory {
	/** Womni catalog category id — stable identity when names/slugs repeat. */
	id?: string;
	slug: string;
	name: string;
	sortOrder?: number;
	active?: boolean;
	parentId?: string | null;
	/** @deprecated Use parentId — kept for legacy imports. */
	parentSlug?: string | null;
	image?: string | null;
}

export interface SyncProductTranslation {
	locale: string;
	name: string;
	description?: string;
	care?: string;
}

export interface SyncProductFeature {
	name: string;
	value: string;
}

export interface SyncVariantOptionValue {
	/** Womni Attribute.id */
	id: string;
	name: string;
	color?: string | null;
	texture?: string | null;
	position?: number;
}

export interface SyncVariantOptionGroup {
	/** Womni AttributeGroup.id */
	id: string;
	/** Stable key: g{attributeGroupId} */
	key: string;
	groupType: 'size' | 'color' | 'select';
	name: string;
	position?: number;
	values: SyncVariantOptionValue[];
}

export interface SyncProductCombination {
	/** Womni ProductAttribute.id */
	id: string;
	/** Womni Attribute ids (ProductAttributeCombination.attributes) */
	attributeIds?: string[];
	/** groupKey → AttributeI18n.name */
	options: Record<string, string>;
	/** groupKey → Attribute.id */
	selections?: Record<string, string>;
	price: number;
	originalPrice?: number | null;
	promotionStart?: string | null;
	promotionEnd?: string | null;
	reference?: string | null;
	quantity?: number;
	available?: boolean;
	image?: string | null;
	images?: string[];
}

export interface SyncProduct {
	slug: string;
	name: string;
	description?: string;
	care?: string;
	locale?: string;
	/** Optional per-locale copy (Womni ProductI18n → product_translations). */
	translations?: SyncProductTranslation[];
	price: number;
	originalPrice?: number;
	promotionStart?: string | null;
	promotionEnd?: string | null;
	image: string;
	images?: string[];
	features?: SyncProductFeature[];
	optionGroups?: SyncVariantOptionGroup[];
	combinations?: SyncProductCombination[];
	badge?: BadgeKey;
	categorySlug?: string;
	/** Womni catalog category id — preferred when names/slugs repeat. */
	categoryId?: string;
	/** All category slugs this product belongs to. */
	categorySlugs?: string[];
	/** All Womni catalog category ids this product belongs to. */
	categoryIds?: string[];
	available?: boolean;
}

export interface CatalogImportPayload {
	catalogId?: string;
	catalogName?: string;
	categories?: SyncCategory[];
	products: SyncProduct[];
	/** When true (default on full catalog import), remove products not in payload. */
	replaceProducts?: boolean;
	/** When true, remove categories not in payload. */
	replaceCategories?: boolean;
}

export interface CategoryImportPayload {
	catalogId?: string;
	catalogName?: string;
	category?: SyncCategory;
	categories?: SyncCategory[];
	replaceCategories?: boolean;
}

export interface SiteConfigImportPayload {
	appearance?: Record<string, string>;
}

export interface CatalogExportPayload {
	catalogs: { id: string; name: string }[];
	catalogName?: string;
	categories: SyncCategory[];
	products: (SyncProduct & { price: number; modifierGroups?: unknown[] })[];
}
