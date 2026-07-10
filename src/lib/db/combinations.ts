import type { ProductCombination, VariantOptionGroup } from '../../data/types';
import {
	buildOptionGroupsFromCombinations,
	parseAttributeIds,
	parseSelections,
	resolveCombinationSelections,
	selectionsMatch,
} from '../variants';

export function enrichProductCombinations(
	combinations: ProductCombination[],
	optionGroups?: VariantOptionGroup[],
): ProductCombination[] {
	return combinations.map((combo) => {
		const selections = resolveCombinationSelections(combo, optionGroups);
		return {
			...combo,
			selections,
			attributeIds:
				combo.attributeIds.length > 0
					? combo.attributeIds
					: Object.values(selections),
		};
	});
}

type CombinationRow = {
	external_id: string;
	options: string;
	attribute_ids: string;
	selections: string;
	size?: string | null;
	color?: string | null;
	price: number;
	original_price: number | null;
	promotion_start: string | null;
	promotion_end: string | null;
	reference: string | null;
	quantity: number;
	available: number;
	image: string | null;
	images: string;
};

function parseOptions(raw: string | null | undefined): Record<string, string> {
	if (!raw) {
		return {};
	}
	try {
		const parsed = JSON.parse(raw) as Record<string, string>;
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

function parseImages(raw: string | null | undefined): string[] {
	if (!raw) {
		return [];
	}
	try {
		const parsed = JSON.parse(raw) as string[];
		return Array.isArray(parsed) ? parsed.filter((url) => typeof url === 'string' && url.trim()) : [];
	} catch {
		return [];
	}
}

function mapCombinationRow(row: CombinationRow): ProductCombination {
	const options = parseOptions(row.options);
	if (!Object.keys(options).length) {
		if (row.size) {
			options.size = row.size;
		}
		if (row.color) {
			options.color = row.color;
		}
	}

	const images = parseImages(row.images);
	const image = row.image?.trim() || images[0];

	return {
		id: row.external_id,
		attributeIds: parseAttributeIds(row.attribute_ids),
		options,
		selections: parseSelections(row.selections),
		price: row.price,
		originalPrice: row.original_price ?? undefined,
		promotionStart: row.promotion_start ?? undefined,
		promotionEnd: row.promotion_end ?? undefined,
		reference: row.reference ?? undefined,
		quantity: row.quantity,
		available: row.available === 1,
		image,
		images: images.length ? images : image ? [image] : undefined,
	};
}

export async function listProductCombinations(
	db: D1Database,
	productSlug: string,
): Promise<ProductCombination[]> {
	const result = await db
		.prepare(
			`SELECT external_id, options, attribute_ids, selections, size, color, price, original_price, promotion_start, promotion_end, reference, quantity, available, image, images
			FROM product_combinations
			WHERE product_slug = ?
			ORDER BY price ASC, external_id ASC`,
		)
		.bind(productSlug)
		.all<CombinationRow>();

	return (result.results ?? []).map(mapCombinationRow);
}

export async function listCombinationsByProductSlugs(
	db: D1Database,
	slugs: string[],
): Promise<Map<string, ProductCombination[]>> {
	const map = new Map<string, ProductCombination[]>();
	if (!slugs.length) {
		return map;
	}

	const placeholders = slugs.map(() => '?').join(', ');
	const result = await db
		.prepare(
			`SELECT product_slug, external_id, options, attribute_ids, selections, size, color, price, original_price, promotion_start, promotion_end, reference, quantity, available, image, images
			FROM product_combinations
			WHERE product_slug IN (${placeholders})
			ORDER BY product_slug ASC, price ASC, external_id ASC`,
		)
		.bind(...slugs)
		.all<CombinationRow & { product_slug: string }>();

	for (const row of result.results ?? []) {
		const list = map.get(row.product_slug) ?? [];
		list.push(mapCombinationRow(row));
		map.set(row.product_slug, list);
	}

	return map;
}

export function findMatchingCombination(
	combinations: ProductCombination[] | undefined,
	selected: Record<string, string>,
): ProductCombination | null {
	if (!combinations?.length) {
		return null;
	}

	const exact = combinations.find(
		(combo) => combo.available && selectionsMatch(combo, selected),
	);
	if (exact) {
		return exact;
	}

	return combinations.find((combo) => combo.available) ?? combinations[0] ?? null;
}

export { buildOptionGroupsFromCombinations, selectionsMatch };
