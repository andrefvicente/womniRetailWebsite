import type { ProductCombination } from '../../data/types';

/** Normalise a euro amount to 2 decimals for D1 storage (30.99 stays 30.99). */
export function toEuroAmount(value: unknown): number {
	const amount = Number(value);
	if (!Number.isFinite(amount)) {
		return 0;
	}
	return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Read a stored euro amount, normalising to 2 decimals for display/comparisons. */
export function fromEuroAmount(value: unknown): number {
	return toEuroAmount(value);
}

function minPositivePrice(combinations: ProductCombination[]): number | null {
	if (!combinations.length) {
		return null;
	}
	return Math.min(...combinations.map((combo) => combo.price));
}

export function combinationForDisplay(combo: ProductCombination): ProductCombination {
	return {
		...combo,
		price: fromEuroAmount(combo.price),
		originalPrice:
			combo.originalPrice != null ? fromEuroAmount(combo.originalPrice) : undefined,
	};
}

export function resolveProductPrice(
	basePrice: number,
	combinations: ProductCombination[] | undefined,
): {
	price: number;
	originalPrice: number | null;
	promotionStart: string | null;
	promotionEnd: string | null;
} {
	const priced = (combinations ?? []).filter((combo) => combo.price > 0);
	const availablePriced = priced.filter((combo) => combo.available !== false);

	const fromAvailable = minPositivePrice(availablePriced);
	const fromAll = minPositivePrice(priced);
	const price =
		(fromAvailable != null && fromAvailable > 0
			? fromAvailable
			: fromAll != null && fromAll > 0
				? fromAll
				: toEuroAmount(basePrice)) || 0;

	const source =
		availablePriced.find((combo) => combo.price === price) ??
		priced.find((combo) => combo.price === price);

	const originalPrice =
		source?.originalPrice != null && source.originalPrice > price
			? source.originalPrice
			: null;

	const promotionStart =
		source?.promotionStart && source?.promotionEnd ? source.promotionStart : null;
	const promotionEnd =
		source?.promotionStart && source?.promotionEnd ? source.promotionEnd : null;

	return { price, originalPrice, promotionStart, promotionEnd };
}
