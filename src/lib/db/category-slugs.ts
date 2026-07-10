import type { SyncCategory } from '../sync/types';

export function categoryKey(cat: SyncCategory): string {
	return cat.id ?? `${cat.parentId ?? cat.parentSlug ?? ''}:${cat.slug}:${cat.sortOrder ?? 0}:${cat.name}`;
}

function leafSegment(slug: string): string {
	const trimmed = slug.trim();
	const index = trimmed.lastIndexOf('/');
	return index >= 0 ? trimmed.slice(index + 1) : trimmed;
}

function normalizeParentId(cat: SyncCategory): string | null {
	const parentId = cat.parentId?.trim();
	return parentId || null;
}

function allocateSlug(
	base: string,
	used: Set<string>,
	parentFinalSlug: string | null,
): string {
	const segment = leafSegment(base);
	const candidates: string[] = [];

	if (parentFinalSlug) {
		candidates.push(`${parentFinalSlug}/${segment}`);
	}
	candidates.push(segment);

	for (let index = 2; index < 100; index++) {
		candidates.push(parentFinalSlug ? `${parentFinalSlug}/${segment}-${index}` : `${segment}-${index}`);
	}

	for (const candidate of candidates) {
		if (!used.has(candidate)) {
			return candidate;
		}
	}

	return `${parentFinalSlug ? `${parentFinalSlug}/` : ''}${segment}-${Date.now()}`;
}

export interface UniqueCategorySlugsResult {
	categories: SyncCategory[];
	slugByCategoryKey: Map<string, string>;
	slugById: Map<string, string>;
}

/** Build hierarchical slugs strictly from parentId → child id tree. */
function buildSlugsFromParentIds(categories: SyncCategory[]): UniqueCategorySlugsResult {
	const byId = new Map<string, SyncCategory>();
	for (const cat of categories) {
		const id = cat.id?.trim();
		if (id) {
			byId.set(id, cat);
		}
	}

	const slugById = new Map<string, string>();
	const slugByCategoryKey = new Map<string, string>();
	const used = new Set<string>();
	const output: SyncCategory[] = [];

	function assign(cat: SyncCategory): string {
		const id = cat.id!.trim();
		const existing = slugById.get(id);
		if (existing) {
			return existing;
		}

		const parentId = normalizeParentId(cat);
		const parentFull =
			parentId && byId.has(parentId) ? assign(byId.get(parentId)!) : null;

		let leaf = leafSegment(cat.slug);
		let slug = parentFull ? `${parentFull}/${leaf}` : leaf;

		let guard = 0;
		while (used.has(slug) && guard < 100) {
			leaf = `${leafSegment(cat.slug)}-${guard + 2}`;
			slug = parentFull ? `${parentFull}/${leaf}` : leaf;
			guard++;
		}

		used.add(slug);
		slugById.set(id, slug);
		return slug;
	}

	for (const cat of categories) {
		if (cat.id?.trim()) {
			assign(cat);
		}
	}

	for (const cat of categories) {
		const id = cat.id?.trim();
		const slug = id ? (slugById.get(id) ?? cat.slug.trim()) : cat.slug.trim();
		const normalized: SyncCategory = {
			...cat,
			slug,
			parentId: normalizeParentId(cat),
		};

		output.push(normalized);
		slugByCategoryKey.set(categoryKey(cat), slug);
		if (id) {
			slugById.set(id, slug);
		}
	}

	return { categories: output, slugByCategoryKey, slugById };
}

/**
 * Ensure category slugs are unique within a catalog import batch.
 * Womni sync sends ids and parentIds — hierarchy comes only from those ids.
 */
export function ensureUniqueCategorySlugs(
	categories: SyncCategory[],
): UniqueCategorySlugsResult {
	if (!categories.length) {
		return {
			categories: [],
			slugByCategoryKey: new Map(),
			slugById: new Map(),
		};
	}

	const syncedFromWomni = categories.every((cat) => Boolean(cat.id?.trim()));
	if (syncedFromWomni) {
		return buildSlugsFromParentIds(categories);
	}

	const used = new Set<string>();
	const output: SyncCategory[] = [];
	const processed = new Set<string>();
	const slugByCategoryKey = new Map<string, string>();
	const slugById = new Map<string, string>();
	const byId = new Map(
		categories.filter((cat) => cat.id?.trim()).map((cat) => [cat.id!.trim(), cat]),
	);

	const assignCategory = (cat: SyncCategory, parentFinalSlug: string | null): void => {
		const key = categoryKey(cat);
		if (processed.has(key)) {
			return;
		}
		processed.add(key);

		const sourceSlug = cat.slug.trim();
		const slug = allocateSlug(sourceSlug, used, parentFinalSlug);
		used.add(slug);

		const normalized: SyncCategory = {
			...cat,
			slug,
			parentId: normalizeParentId(cat),
		};

		output.push(normalized);
		slugByCategoryKey.set(key, slug);
		if (cat.id) {
			slugById.set(String(cat.id), slug);
		}

		for (const child of categories) {
			if (processed.has(categoryKey(child))) {
				continue;
			}

			const childParentId = normalizeParentId(child);
			const matchesParent =
				(childParentId && cat.id && childParentId === cat.id.trim()) ||
				child.parentSlug?.trim() === sourceSlug ||
				child.parentSlug?.trim() === slug;

			if (matchesParent) {
				assignCategory(child, slug);
			}
		}
	};

	for (const cat of categories) {
		if (processed.has(categoryKey(cat))) {
			continue;
		}

		const parentId = normalizeParentId(cat);
		if (!parentId) {
			assignCategory(cat, null);
			continue;
		}

		const parent = byId.get(parentId);
		if (!parent || processed.has(categoryKey(parent))) {
			continue;
		}
	}

	for (const cat of categories) {
		if (!processed.has(categoryKey(cat))) {
			const parentId = normalizeParentId(cat);
			const parent = parentId ? byId.get(parentId) : null;
			const parentSlug = parent ? slugById.get(parent.id!.trim()) ?? null : cat.parentSlug ?? null;
			assignCategory(cat, parentSlug);
		}
	}

	return { categories: output, slugByCategoryKey, slugById };
}

export function resolveImportedCategorySlug(
	productCategorySlug: string | undefined,
	productCategoryId: string | undefined,
	maps: Pick<UniqueCategorySlugsResult, 'slugById'>,
): string | null {
	if (productCategoryId && maps.slugById.has(productCategoryId)) {
		return maps.slugById.get(productCategoryId)!;
	}
	return productCategorySlug?.trim() || null;
}

export function resolveImportedCategorySlugs(
	product: {
		categorySlug?: string;
		categoryId?: string;
		categorySlugs?: string[];
		categoryIds?: string[];
	},
	maps: Pick<UniqueCategorySlugsResult, 'slugById'>,
): string[] {
	const slugs: string[] = [];
	const seen = new Set<string>();

	const add = (slug: string | null | undefined) => {
		const trimmed = slug?.trim();
		if (trimmed && !seen.has(trimmed)) {
			seen.add(trimmed);
			slugs.push(trimmed);
		}
	};

	for (const id of product.categoryIds ?? []) {
		add(maps.slugById.get(id));
	}
	for (const slug of product.categorySlugs ?? []) {
		add(slug);
	}

	if (!slugs.length) {
		add(resolveImportedCategorySlug(product.categorySlug, product.categoryId, maps));
	}

	return slugs;
}
