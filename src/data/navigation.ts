import type { CategoryTile } from './types';
import { rugImages } from './images';

export const mainNav = [
	{ key: 'rugs' as const, href: '/c/rugs' },
	{ key: 'byRoom' as const, href: '/c/rugs?room=living-room' },
	{ key: 'runners' as const, href: '/c/rugs?style=runner' },
	{ key: 'outdoor' as const, href: '/c/rugs?style=outdoor' },
	{ key: 'sale' as const, href: '/c/rugs?sale=true' },
];

export const footerLinks = {
	shop: [
		{ key: 'allRugs' as const, href: '/c/rugs' },
		{ key: 'newArrivals' as const, href: '/c/rugs?sort=new' },
		{ key: 'bestSellers' as const, href: '/c/rugs?badge=bestseller' },
		{ key: 'sale' as const, href: '/c/rugs?sale=true' },
	],
	help: [
		{ key: 'sizeGuide' as const, href: '#size-guide' },
		{ key: 'shipping' as const, href: '#' },
		{ key: 'returns' as const, href: '#' },
		{ key: 'contact' as const, href: '#' },
	],
	about: [
		{ key: 'ourStory' as const, href: '#' },
		{ key: 'sustainability' as const, href: '#' },
		{ key: 'careGuide' as const, href: '#' },
	],
};

export const categoryTiles: CategoryTile[] = [
	{ id: 'living-room', href: '/c/rugs?room=living-room', image: rugImages.living, count: 48 },
	{ id: 'bedroom', href: '/c/rugs?room=bedroom', image: rugImages.bedroom, count: 36 },
	{ id: 'runners', href: '/c/rugs?style=runner', image: rugImages.hallway, count: 24 },
	{ id: 'outdoor', href: '/c/rugs?style=outdoor', image: rugImages.outdoor, count: 12 },
];
