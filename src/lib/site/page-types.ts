export type PageBlockType = 'hero' | 'product-grid' | 'promo';

export interface SizeTip {
	room: string;
	tip: string;
}

export interface HeroLocaleCopy {
	eyebrow?: string;
	title?: string;
	lead?: string;
	shopAll?: string;
	viewSale?: string;
	heroImageAlt?: string;
}

export interface ProductGridLocaleCopy {
	title?: string;
	seeMore?: string;
}

export interface PromoLocaleCopy {
	sizeGuideTitle?: string;
	sizeGuideLead?: string;
	sizeGuideCta?: string;
	sizeTips?: SizeTip[];
}

export interface HeroBlockProps {
	image?: string;
	locales?: Record<string, HeroLocaleCopy>;
}

export interface ProductGridQuery {
	variant: 'featured' | 'new-arrivals';
	limit?: number;
}

export interface ProductGridBlockProps {
	query?: ProductGridQuery;
	seeMoreQuery?: string;
	locales?: Record<string, ProductGridLocaleCopy>;
}

export interface PromoBlockProps {
	anchorId?: string;
	locales?: Record<string, PromoLocaleCopy & HeroLocaleCopy>;
}

export interface PageBlock {
	id: string;
	type: PageBlockType;
	visible?: boolean;
	position?: number;
	props: HeroBlockProps | ProductGridBlockProps | PromoBlockProps;
}

export interface PageConfig {
	sections: PageBlock[];
}

export interface PageRenderContext {
	defaultCatalogHref: string;
	locale?: string;
}
