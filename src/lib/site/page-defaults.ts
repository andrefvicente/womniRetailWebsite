import type { PageBlock, PageConfig } from './page-types';

export const HOME_DEFAULT_LOCALE = 'pt';

const BLOCK_TYPES = new Set(['hero', 'product-grid', 'promo']);

function defaultHomeSections(): PageBlock[] {
	const locales = {
		[HOME_DEFAULT_LOCALE]: {
			eyebrow: 'Coleção primavera 2026',
			title: 'Tapetes que transformam cada divisão',
			lead:
				'De flatweave em lã a polipropileno para exterior — selecionados para a vida moderna, com entrega grátis e devoluções sem complicações.',
			shopAll: 'Ver todos os tapetes',
			viewSale: 'Ver promoções',
			heroImageAlt: 'Sala de estar com tapete neutro em lã',
			bestSellersSale: 'Mais vendidos e promoções',
			seeMore: 'Ver mais →',
			sizeGuideTitle: 'Não sabe qual o tamanho?',
			sizeGuideLead:
				'Use o nosso guia de tamanhos para encontrar a medida ideal para sofás, camas e mesas de jantar.',
			sizeGuideCta: 'Guia de tamanhos',
			sizeTips: [
				{ room: 'Sala de estar', tip: '200×300 cm ou maior' },
				{ room: 'Quarto', tip: '160×230 cm sob cama queen' },
				{ room: 'Corredor', tip: 'Passadeiras 60×90 ou 80×150 cm' },
				{ room: 'Jantar', tip: 'Tapete 60 cm além da mesa' },
			],
			newArrivals: 'Novidades',
		},
	};

	return [
		{
			id: 'hero-1',
			type: 'hero',
			visible: true,
			props: {
				image: 'https://picsum.photos/seed/womni-hero/900/1125',
				locales,
			},
		},
		{
			id: 'product-grid-featured',
			type: 'product-grid',
			visible: true,
			props: {
				query: { variant: 'featured', limit: 4 },
				seeMoreQuery: 'badge=bestseller',
				locales: {
					[HOME_DEFAULT_LOCALE]: {
						title: locales[HOME_DEFAULT_LOCALE].bestSellersSale,
						seeMore: locales[HOME_DEFAULT_LOCALE].seeMore,
					},
				},
			},
		},
		{
			id: 'promo-size-guide',
			type: 'promo',
			visible: true,
			props: {
				anchorId: 'size-guide',
				locales,
			},
		},
		{
			id: 'product-grid-new-arrivals',
			type: 'product-grid',
			visible: true,
			props: {
				query: { variant: 'new-arrivals', limit: 4 },
				seeMoreQuery: 'sort=new',
				locales: {
					[HOME_DEFAULT_LOCALE]: {
						title: locales[HOME_DEFAULT_LOCALE].newArrivals,
						seeMore: locales[HOME_DEFAULT_LOCALE].seeMore,
					},
				},
			},
		},
	];
}

function normalizeBlock(block: PageBlock, index: number): PageBlock | null {
	if (!BLOCK_TYPES.has(block.type)) {
		return null;
	}

	return {
		...block,
		visible: block.visible !== false,
		position: typeof block.position === 'number' ? block.position : index,
		props: block.props && typeof block.props === 'object' ? block.props : {},
	};
}

export function defaultPageConfig(slug: string): PageConfig {
	if (slug === 'home') {
		return { sections: defaultHomeSections() };
	}

	return { sections: [] };
}

export function mergePageConfig(slug: string, remote: PageConfig | null): PageConfig {
	const defaults = defaultPageConfig(slug);
	if (!remote?.sections?.length) {
		return defaults;
	}

	const sections = remote.sections
		.map((block, index) => normalizeBlock(block, index))
		.filter((block): block is PageBlock => Boolean(block));

	return sections.length ? { sections } : defaults;
}
