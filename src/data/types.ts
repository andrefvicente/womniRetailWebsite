export type RugSize = '60x90' | '80x150' | '120x170' | '160x230' | '200x300' | '240x340' | '300x400';

export type MaterialKey =
	| 'wool'
	| 'wool-blend'
	| 'jute'
	| 'cotton'
	| 'polypropylene'
	| 'viscose'
	| 'silk-blend'
	| 'polyester';

export type StyleKey =
	| 'scandinavian'
	| 'bohemian'
	| 'natural'
	| 'modern'
	| 'traditional'
	| 'outdoor'
	| 'kids'
	| 'luxury'
	| 'shag'
	| 'runner'
	| 'minimalist'
	| 'moroccan';

export type RoomKey = 'living-room' | 'bedroom' | 'hallway' | 'dining-room' | 'patio' | 'kids-room';

export type ColorKey =
	| 'beige'
	| 'grey'
	| 'ivory'
	| 'sand'
	| 'natural'
	| 'charcoal'
	| 'blue'
	| 'rust'
	| 'navy'
	| 'cream'
	| 'terracotta'
	| 'multi'
	| 'white'
	| 'black'
	| 'stone'
	| 'moss'
	| 'brown'
	| 'champagne'
	| 'sage';

export type BadgeKey = 'sale' | 'new' | 'bestseller';

/** Dados do produto (locale-agnóstico; textos vêm de i18n) */
export interface ProductBase {
	slug: string;
	price: number;
	originalPrice?: number;
	image: string;
	images: string[];
	sizes: RugSize[];
	colors: ColorKey[];
	material: MaterialKey;
	style: StyleKey;
	room: RoomKey;
	rating: number;
	reviewCount: number;
	badge?: BadgeKey;
}

/** Produto com textos já localizados para renderização */
export interface Product extends ProductBase {
	name: string;
	description: string;
	care: string;
}

export interface CategoryTile {
	id: string;
	href: string;
	image: string;
	count?: number;
}
