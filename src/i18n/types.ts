import type { MaterialKey, RoomKey, StyleKey, ColorKey } from '../data/types';

export type BadgeKey = 'sale' | 'new' | 'bestseller';

export interface ProductCopy {
	name: string;
	description: string;
	care: string;
}

export interface UiDictionary {
	brand: string;
	meta: {
		defaultDescription: string;
		titleSuffix: string;
	};
	aria: {
		mainNav: string;
		openMenu: string;
		search: string;
		searchRugs: string;
		account: string;
		cart: string;
		breadcrumb: string;
		stars: (rating: number) => string;
	};
	trust: string[];
	nav: {
		rugs: string;
		byRoom: string;
		runners: string;
		outdoor: string;
		sale: string;
	};
	searchPlaceholder: string;
	footer: {
		tagline: string;
		shop: string;
		customerCare: string;
		about: string;
		rights: string;
		links: {
			allRugs: string;
			newArrivals: string;
			bestSellers: string;
			sale: string;
			sizeGuide: string;
			shipping: string;
			returns: string;
			contact: string;
			ourStory: string;
			sustainability: string;
			careGuide: string;
		};
	};
	newsletter: {
		title: string;
		description: string;
		emailLabel: string;
		placeholder: string;
		subscribe: string;
	};
	home: {
		metaDescription: string;
		eyebrow: string;
		title: string;
		lead: string;
		shopAll: string;
		viewSale: string;
		heroImageAlt: string;
		shopByRoom: string;
		viewAll: string;
		rugCount: (n: number) => string;
		bestSellersSale: string;
		seeMore: string;
		sizeGuideTitle: string;
		sizeGuideLead: string;
		sizeGuideCta: string;
		sizeTips: { room: string; tip: string }[];
		newArrivals: string;
	};
	catalog: {
		metaDescription: string;
		title: string;
		productCount: string;
		filters: string;
		sortLabel: string;
		sort: Record<string, string>;
		filterTitle: string;
		clearAll: string;
		room: string;
		material: string;
		style: string;
		color: string;
		maxPrice: string;
		priceUpTo: (max: number) => string;
		empty: string;
	};
	product: {
		save: (pct: number) => string;
		reviews: (rating: number, count: number) => string;
		sizeLegend: string;
		colorLegend: string;
		quantity: string;
		addToCart: string;
		addedToCart: string;
		trust: string[];
		description: string;
		care: string;
		deliveryReturns: string;
		deliveryText: string;
		related: string;
		fromSize: string;
	};
	cart: {
		metaDescription: string;
		title: string;
		loading: string;
		summary: string;
		subtotal: string;
		shipping: string;
		shippingCalc: string;
		shippingFree: string;
		total: string;
		freeShippingNote: string;
		checkout: string;
		continueShopping: string;
		empty: string;
		shopRugs: string;
		size: string;
		color: string;
		qty: string;
		remove: string;
	};
	badges: Record<BadgeKey, string>;
	materials: Record<MaterialKey, string>;
	styles: Record<StyleKey, string>;
	rooms: Record<RoomKey, string>;
	colors: Record<ColorKey, string>;
	categoryTiles: Record<string, { title: string; count?: number }>;
	products: Record<string, ProductCopy>;
}
