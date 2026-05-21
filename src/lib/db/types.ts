import type { BadgeKey, ColorKey, MaterialKey, ProductBase, RoomKey, RugSize, StyleKey } from '../../data/types';

export interface ProductRow {
	slug: string;
	price: number;
	original_price: number | null;
	image: string;
	images: string;
	sizes: string;
	colors: string;
	material: MaterialKey;
	style: StyleKey;
	room: RoomKey;
	rating: number;
	review_count: number;
	badge: BadgeKey | null;
}

export interface ProductTranslationRow {
	slug: string;
	locale: string;
	name: string;
	description: string;
	care: string;
}

export interface ProductFilters {
	room?: RoomKey[];
	material?: MaterialKey[];
	style?: StyleKey[];
	color?: ColorKey[];
	sale?: boolean;
	badge?: BadgeKey;
	q?: string;
}

export type ProductSort = 'popular' | 'price-asc' | 'price-desc' | 'new' | 'rating';

export function rowToProductBase(row: ProductRow): ProductBase {
	return {
		slug: row.slug,
		price: row.price,
		originalPrice: row.original_price ?? undefined,
		image: row.image,
		images: JSON.parse(row.images) as string[],
		sizes: JSON.parse(row.sizes) as RugSize[],
		colors: JSON.parse(row.colors) as ColorKey[],
		material: row.material,
		style: row.style,
		room: row.room,
		rating: row.rating,
		reviewCount: row.review_count,
		badge: row.badge ?? undefined,
	};
}
