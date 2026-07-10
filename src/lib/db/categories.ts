import { rugImages } from '../../data/images';

const DEFAULT_CATALOG_ID = '1';

export async function resolveCatalogId(db: D1Database): Promise<string> {
	const row = await db
		.prepare(`SELECT id FROM catalogs ORDER BY updated_at DESC LIMIT 1`)
		.first<{ id: string }>();

	return row?.id ?? DEFAULT_CATALOG_ID;
}

const tileFallbackImages = [
	rugImages.living,
	rugImages.bedroom,
	rugImages.hallway,
	rugImages.outdoor,
] as const;

export interface SiteCategory {
	slug: string;
	name: string;
	sortOrder: number;
	parentExternalId: string | null;
	parentSlug: string | null;
	image: string | null;
	catalogId: string;
	externalId: string | null;
}

type CategoryRow = {
	slug: string;
	name: string;
	sort_order: number;
	parent_external_id: string | null;
	parent_slug: string | null;
	image: string | null;
	catalog_id: string;
	external_id: string | null;
};

function mapRow(row: CategoryRow): SiteCategory {
	return {
		slug: row.slug,
		name: row.name,
		sortOrder: row.sort_order,
		parentExternalId: row.parent_external_id?.trim() || null,
		parentSlug: row.parent_slug?.trim() || null,
		image: row.image,
		catalogId: row.catalog_id,
		externalId: row.external_id?.trim() || null,
	};
}

function isChildOf(child: SiteCategory, parent: SiteCategory): boolean {
	if (child.parentExternalId && parent.externalId) {
		return child.parentExternalId === parent.externalId;
	}
	return child.parentSlug === parent.slug;
}

export async function listCategories(
	db: D1Database,
	catalogId?: string,
): Promise<SiteCategory[]> {
	const resolvedCatalogId = catalogId ?? (await resolveCatalogId(db));
	const result = await db
		.prepare(
			`SELECT slug, name, sort_order, parent_external_id, parent_slug, image, catalog_id, external_id
			FROM categories
			WHERE catalog_id = ? AND active = 1
			ORDER BY sort_order ASC, name ASC`,
		)
		.bind(resolvedCatalogId)
		.all<CategoryRow>();

	return (result.results ?? []).map(mapRow);
}

export async function getCategoryBySlug(
	db: D1Database,
	slug: string,
	catalogId?: string,
): Promise<SiteCategory | null> {
	if (catalogId) {
		const scoped = await db
			.prepare(
				`SELECT slug, name, sort_order, parent_external_id, parent_slug, image, catalog_id, external_id
				FROM categories
				WHERE slug = ? AND catalog_id = ? AND active = 1`,
			)
			.bind(slug, catalogId)
			.first<CategoryRow>();

		if (scoped) {
			return mapRow(scoped);
		}
	}

	const row = await db
		.prepare(
			`SELECT slug, name, sort_order, parent_external_id, parent_slug, image, catalog_id, external_id
			FROM categories
			WHERE slug = ? AND active = 1`,
		)
		.bind(slug)
		.first<CategoryRow>();

	return row ? mapRow(row) : null;
}

export function listTopLevelCategories(categories: SiteCategory[]): SiteCategory[] {
	const externalIds = new Set(
		categories.map((cat) => cat.externalId).filter(Boolean) as string[],
	);
	const slugs = new Set(categories.map((cat) => cat.slug));

	return categories.filter((cat) => {
		if (cat.parentExternalId) {
			return !externalIds.has(cat.parentExternalId);
		}
		return !cat.parentSlug || !slugs.has(cat.parentSlug);
	});
}

function buildNavNode(
	categories: SiteCategory[],
	category: SiteCategory,
): NavCategoryLink {
	const children = categories
		.filter((cat) => isChildOf(cat, category))
		.map((child) => buildNavNode(categories, child));

	return {
		label: category.name,
		slug: category.slug,
		href: categoryHref(category.slug),
		...(children.length ? { children } : {}),
	};
}

export function listChildCategories(
	categories: SiteCategory[],
	parentSlug: string,
): SiteCategory[] {
	const parent = categories.find((cat) => cat.slug === parentSlug);
	if (!parent) {
		return categories.filter((cat) => cat.parentSlug === parentSlug);
	}
	return categories.filter((cat) => isChildOf(cat, parent));
}

export function findParentCategory(
	categories: SiteCategory[],
	category: SiteCategory,
): SiteCategory | null {
	if (category.parentExternalId) {
		return (
			categories.find((cat) => cat.externalId === category.parentExternalId) ??
			null
		);
	}
	if (category.parentSlug) {
		return categories.find((cat) => cat.slug === category.parentSlug) ?? null;
	}
	return null;
}

export function collectDescendantSlugs(
	categories: SiteCategory[],
	rootSlug: string,
): string[] {
	const root = categories.find((cat) => cat.slug === rootSlug);
	if (!root) {
		return [rootSlug];
	}

	const childrenByParentKey = new Map<string, string[]>();

	for (const cat of categories) {
		const key = cat.parentExternalId || cat.parentSlug;
		if (!key) {
			continue;
		}
		const siblings = childrenByParentKey.get(key) ?? [];
		siblings.push(cat.slug);
		childrenByParentKey.set(key, siblings);
	}

	const rootKey = root.externalId || root.slug;
	const slugs = new Set<string>([rootSlug]);
	const queue = [rootKey];

	while (queue.length) {
		const current = queue.pop()!;
		for (const child of childrenByParentKey.get(current) ?? []) {
			if (!slugs.has(child)) {
				slugs.add(child);
				const childCat = categories.find((cat) => cat.slug === child);
				queue.push(childCat?.externalId || child);
			}
		}
	}

	return [...slugs];
}

export async function countProductsByCategorySlug(
	db: D1Database,
	slugs: string[],
): Promise<Map<string, number>> {
	if (!slugs.length) {
		return new Map();
	}

	const placeholders = slugs.map(() => '?').join(', ');
	const result = await db
		.prepare(
			`SELECT category_slug, COUNT(DISTINCT product_slug) AS total
			FROM product_categories
			WHERE category_slug IN (${placeholders})
			GROUP BY category_slug`,
		)
		.bind(...slugs)
		.all<{ category_slug: string; total: number }>();

	const counts = new Map<string, number>();
	for (const row of result.results ?? []) {
		counts.set(row.category_slug, row.total);
	}
	return counts;
}

export function categoryTileImage(category: SiteCategory, index: number): string {
	return category.image || tileFallbackImages[index % tileFallbackImages.length];
}

export function categoryHref(slug: string): string {
	const normalized = slug.replace(/^\/+|\/+$/g, '');
	return `/c/${normalized}`;
}

/** Join Astro `[...path]` segments into the stored category slug. */
export function categorySlugFromPath(path: string | string[] | undefined): string | null {
	if (!path) {
		return null;
	}
	const segments = Array.isArray(path) ? path : [path];
	const joined = segments.map((part) => part.trim()).filter(Boolean).join('/');
	return joined || null;
}

export async function getDefaultCatalogHref(
	db: D1Database,
	catalogId?: string,
): Promise<string> {
	const categories = await listCategories(db, catalogId);
	const root = listTopLevelCategories(categories)[0];
	return root ? categoryHref(root.slug) : '/';
}

export interface NavCategoryLink {
	label: string;
	slug: string;
	href: string;
	children?: NavCategoryLink[];
}

export function buildMainNav(categories: SiteCategory[]): NavCategoryLink[] {
	return listTopLevelCategories(categories).map((cat) => buildNavNode(categories, cat));
}

export interface CategoryTile {
	slug: string;
	name: string;
	href: string;
	image: string;
	count: number;
}

export function buildCategoryTiles(
	categories: SiteCategory[],
	productCounts: Map<string, number>,
): CategoryTile[] {
	return listTopLevelCategories(categories).map((cat, index) => {
		const descendantSlugs = collectDescendantSlugs(categories, cat.slug);
		const count = descendantSlugs.reduce(
			(sum, slug) => sum + (productCounts.get(slug) ?? 0),
			0,
		);

		return {
			slug: cat.slug,
			name: cat.name,
			href: categoryHref(cat.slug),
			image: categoryTileImage(cat, index),
			count,
		};
	});
}
