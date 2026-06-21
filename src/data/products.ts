import type { ProductBase } from './types';
import { rugImages } from './images';

/** Static demo catalog when D1 is unavailable. */
export const products: ProductBase[] = [
	{
		slug: 'stockholm-wool-flatweave',
		price: 189,
		originalPrice: 249,
		image: rugImages.neutral,
		images: [rugImages.neutral, rugImages.warm],
		badge: 'sale',
	},
	{
		slug: 'oslo-berber-shag',
		price: 279,
		image: rugImages.warm,
		images: [rugImages.warm, rugImages.shag],
		badge: 'bestseller',
	},
	{
		slug: 'copenhagen-jute-natural',
		price: 129,
		image: rugImages.jute,
		images: [rugImages.jute],
		badge: 'new',
	},
	{
		slug: 'helsinki-geometric-wool',
		price: 349,
		originalPrice: 429,
		image: rugImages.geometric,
		images: [rugImages.geometric],
		badge: 'sale',
	},
	{
		slug: 'gothenburg-vintage-persian',
		price: 499,
		image: rugImages.persian,
		images: [rugImages.persian],
	},
	{
		slug: 'malmo-outdoor-polypropylene',
		price: 159,
		image: rugImages.outdoor,
		images: [rugImages.outdoor],
	},
	{
		slug: 'aarhus-kids-play-rug',
		price: 89,
		image: rugImages.kids,
		images: [rugImages.kids],
		badge: 'bestseller',
	},
	{
		slug: 'bergen-silk-viscose',
		price: 599,
		originalPrice: 749,
		image: rugImages.luxury,
		images: [rugImages.luxury],
		badge: 'sale',
	},
	{
		slug: 'tromso-high-pile-shag',
		price: 319,
		image: rugImages.shag,
		images: [rugImages.shag],
	},
	{
		slug: 'uppsala-runner-collection',
		price: 79,
		image: rugImages.runner,
		images: [rugImages.runner],
		badge: 'new',
	},
	{
		slug: 'lund-minimal-flatweave',
		price: 199,
		image: rugImages.minimal,
		images: [rugImages.minimal],
	},
	{
		slug: 'narvik-moroccan-beni',
		price: 429,
		image: rugImages.moroccan,
		images: [rugImages.moroccan],
		badge: 'bestseller',
	},
];
