import type {
	CatalogImportPayload,
	CategoryImportPayload,
	SyncCategory,
	SyncProduct,
	SyncProductCombination,
	SyncProductTranslation,
	SyncVariantOptionGroup,
} from '../sync/types';
import type { BadgeKey } from '../../data/types';
import { defaultLocale } from '../../i18n/config';
import { mapWomniLocaleToSite, resolveSiteLocale } from '../sync/locales';
import { parseFeatures, parseOptionGroups } from './types';
import { ensureUniqueCategorySlugs, resolveImportedCategorySlug } from './category-slugs';
import { listCombinationsByProductSlugs } from './combinations';
import { resolveProductPrice, toEuroAmount } from './prices';
import { normalizeOptionGroups as parseSyncOptionGroups } from '../variants';
import type { SyncProductFeature } from '../sync/types';

/** Legacy NOT NULL columns — kept empty for synced products. */
const LEGACY_DB = {
	sizes: '[]',
	colors: '[]',
	material: '',
	style: '',
	room: '',
	rating: 0,
	reviewCount: 0,
	care: '',
};

function catalogIdFromPayload(payload: { catalogId?: string }) {
	return payload.catalogId ? String(payload.catalogId) : '1';
}

async function upsertCatalogMeta(
	db: D1Database,
	catalogId: string,
	catalogName?: string,
) {
	await db
		.prepare(
			`INSERT INTO catalogs (id, name, updated_at)
			VALUES (?, ?, datetime('now'))
			ON CONFLICT(id) DO UPDATE SET
				name = excluded.name,
				updated_at = datetime('now')`,
		)
		.bind(catalogId, catalogName?.trim() || 'Catalog')
		.run();
}

function sortCategoriesForImport(categories: SyncCategory[]): SyncCategory[] {
	const byId = new Map(
		categories.filter((cat) => cat.id?.trim()).map((cat) => [cat.id!.trim(), cat]),
	);

	const depth = (cat: SyncCategory, seen = new Set<string>()): number => {
		const parentId = cat.parentId?.trim();
		if (!parentId) {
			return 0;
		}
		if (seen.has(parentId)) {
			return 0;
		}
		seen.add(parentId);
		const parent = byId.get(parentId);
		if (!parent) {
			return 0;
		}
		return 1 + depth(parent, seen);
	};

	return [...categories].sort((a, b) => depth(a) - depth(b));
}

function dedupeCategoriesByExternalId(categories: SyncCategory[]): SyncCategory[] {
	const byExternalId = new Map<string, SyncCategory>();
	const withoutExternalId: SyncCategory[] = [];

	for (const cat of categories) {
		const externalId = cat.id?.trim();
		if (externalId) {
			byExternalId.set(externalId, cat);
		} else {
			withoutExternalId.push(cat);
		}
	}

	return [...byExternalId.values(), ...withoutExternalId];
}

/** Free `slug` for the incoming row without deleting other synced identities. */
async function releaseCategorySlug(
	db: D1Database,
	catalogId: string,
	slug: string,
	ownerExternalId: string | null,
): Promise<void> {
	if (ownerExternalId) {
		await db
			.prepare(
				`UPDATE categories
				SET slug = slug || '__migrated__' || COALESCE(external_id, rowid),
				    updated_at = datetime('now')
				WHERE catalog_id = ?
					AND slug = ?
					AND (external_id IS NULL OR external_id != ?)`,
			)
			.bind(catalogId, slug, ownerExternalId)
			.run();
		return;
	}

	await db
		.prepare(
			`DELETE FROM categories
			WHERE catalog_id = ? AND slug = ? AND external_id IS NULL`,
		)
		.bind(catalogId, slug)
		.run();
}

async function upsertCategoryRow(
	db: D1Database,
	catalogId: string,
	cat: SyncCategory,
): Promise<void> {
	const externalId = cat.id?.trim() || null;
	const parentExternalId = cat.parentId?.trim() || null;
	const parentSlug = cat.parentSlug ?? null;
	const image = cat.image ?? null;
	const sortOrder = cat.sortOrder ?? 0;

	await releaseCategorySlug(db, catalogId, cat.slug, externalId);

	if (externalId) {
		const existing = await db
			.prepare(
				`SELECT slug FROM categories WHERE catalog_id = ? AND external_id = ?`,
			)
			.bind(catalogId, externalId)
			.first<{ slug: string }>();

		if (existing) {
			if (existing.slug !== cat.slug) {
				await releaseCategorySlug(db, catalogId, cat.slug, externalId);
			}

			await db
				.prepare(
					`UPDATE categories
					SET slug = ?, name = ?, sort_order = ?, parent_external_id = ?, parent_slug = ?, image = ?, active = 1, updated_at = datetime('now')
					WHERE catalog_id = ? AND external_id = ?`,
				)
				.bind(
					cat.slug,
					cat.name,
					sortOrder,
					parentExternalId,
					parentSlug,
					image,
					catalogId,
					externalId,
				)
				.run();
			return;
		}

		await db
			.prepare(
				`INSERT INTO categories (slug, catalog_id, name, sort_order, parent_external_id, parent_slug, image, external_id, active, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
			)
			.bind(
				cat.slug,
				catalogId,
				cat.name,
				sortOrder,
				parentExternalId,
				parentSlug,
				image,
				externalId,
			)
			.run();
		return;
	}

	await db
		.prepare(
			`INSERT INTO categories (slug, catalog_id, name, sort_order, parent_external_id, parent_slug, image, external_id, active, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1, datetime('now'))
			ON CONFLICT(slug) DO UPDATE SET
				catalog_id = excluded.catalog_id,
				name = excluded.name,
				sort_order = excluded.sort_order,
				parent_external_id = excluded.parent_external_id,
				parent_slug = excluded.parent_slug,
				image = excluded.image,
				active = 1,
				updated_at = datetime('now')`,
		)
		.bind(cat.slug, catalogId, cat.name, sortOrder, parentExternalId, parentSlug, image)
		.run();
}

async function deleteCategoryRow(
	db: D1Database,
	catalogId: string,
	cat: SyncCategory,
): Promise<void> {
	if (cat.id?.trim()) {
		await db
			.prepare(`DELETE FROM categories WHERE catalog_id = ? AND external_id = ?`)
			.bind(catalogId, cat.id.trim())
			.run();
		return;
	}

	await db
		.prepare(`DELETE FROM categories WHERE catalog_id = ? AND slug = ?`)
		.bind(catalogId, cat.slug)
		.run();
}

export async function importCategories(
	db: D1Database,
	payload: CategoryImportPayload,
) {
	const catalogId = catalogIdFromPayload(payload);
	const normalized = ensureUniqueCategorySlugs(
		sortCategoriesForImport(payload.categories ?? (payload.category ? [payload.category] : [])),
	);
	const categories = dedupeCategoriesByExternalId(normalized.categories);

	if (!categories.length) {
		return { upserted: 0, catalogId, slugById: normalized.slugById };
	}

	await upsertCatalogMeta(db, catalogId, payload.catalogName);

	if (payload.replaceCategories && categories.some((cat) => cat.active !== false)) {
		const activeExternalIds = categories
			.filter((cat) => cat.active !== false && cat.id?.trim())
			.map((cat) => cat.id!.trim());
		const activeSlugs = categories
			.filter((cat) => cat.active !== false && cat.slug)
			.map((cat) => cat.slug);

		if (activeExternalIds.length) {
			const placeholders = activeExternalIds.map(() => '?').join(', ');
			await db
				.prepare(
					`DELETE FROM categories
					WHERE catalog_id = ?
						AND external_id IS NOT NULL
						AND external_id NOT IN (${placeholders})`,
				)
				.bind(catalogId, ...activeExternalIds)
				.run();
		}

		if (activeSlugs.length) {
			const placeholders = activeSlugs.map(() => '?').join(', ');
			await db
				.prepare(
					`DELETE FROM categories
					WHERE catalog_id = ?
						AND external_id IS NULL
						AND slug NOT IN (${placeholders})`,
				)
				.bind(catalogId, ...activeSlugs)
				.run();
		}
	}

	let upserted = 0;

	for (const cat of categories) {
		if (!cat.slug || !cat.name) {
			continue;
		}

		if (cat.active === false) {
			await deleteCategoryRow(db, catalogId, cat);
			continue;
		}

		await upsertCategoryRow(db, catalogId, cat);
		upserted++;
	}

	if (payload.replaceCategories) {
		await db
			.prepare(
				`DELETE FROM categories
				WHERE catalog_id = ? AND INSTR(slug, '__migrated__') > 0`,
			)
			.bind(catalogId)
			.run();
	}

	return { upserted, catalogId, slugById: normalized.slugById };
}

function normalizeTranslations(product: SyncProduct): SyncProductTranslation[] {
	const seen = new Set<string>();
	const rows: SyncProductTranslation[] = [];

	for (const row of product.translations ?? []) {
		const locale = mapWomniLocaleToSite(row.locale) ?? resolveSiteLocale(row.locale);
		if (seen.has(locale)) {
			continue;
		}
		seen.add(locale);
		rows.push({
			locale,
			name: row.name,
			description: row.description ?? '',
			care: row.care ?? DEFAULTS.care,
		});
	}

	if (rows.length === 0) {
		const locale = resolveSiteLocale(product.locale);
		rows.push({
			locale,
			name: product.name,
			description: product.description ?? '',
			care: product.care ?? DEFAULTS.care,
		});
	}

	return rows;
}

function normalizeCombinations(
	combinations: SyncProductCombination[] | undefined,
): SyncProductCombination[] {
	if (!combinations?.length) {
		return [];
	}

	return combinations
		.filter((combo) => combo.id?.trim())
		.map((combo) => {
			const selections = combo.selections ?? {};
			const attributeIds =
				combo.attributeIds?.length
					? combo.attributeIds.map(String)
					: Object.values(selections);

			return {
				id: combo.id.trim(),
				attributeIds,
				options: combo.options ?? {},
				selections,
				price: toEuroAmount(combo.price),
				originalPrice:
					combo.originalPrice != null && combo.originalPrice > combo.price
						? toEuroAmount(combo.originalPrice)
						: null,
				promotionStart: combo.promotionStart?.trim() || null,
				promotionEnd: combo.promotionEnd?.trim() || null,
				reference: combo.reference?.trim() || null,
				quantity: combo.quantity ?? 0,
				available: combo.available !== false,
			};
		});
}

function resolveImportOptionGroups(
	product: SyncProduct,
	combinations: SyncProductCombination[],
): SyncVariantOptionGroup[] {
	if (product.optionGroups?.length) {
		return parseSyncOptionGroups(product.optionGroups);
	}

	const groups = new Map<string, SyncVariantOptionGroup>();
	for (const combo of combinations) {
		for (const [key, label] of Object.entries(combo.options ?? {})) {
			if (!groups.has(key)) {
				groups.set(key, {
					id: key.replace(/^g/, '') || key,
					key,
					groupType: 'select',
					name: key,
					position: groups.size,
					values: [],
				});
			}
			const group = groups.get(key)!;
			const attributeId =
				combo.selections?.[key] ??
				combo.attributeIds?.find((id) => !group.values.some((value) => value.id === id)) ??
				String(group.values.length);
			if (!group.values.some((value) => value.id === attributeId)) {
				group.values.push({
					id: attributeId,
					name: label,
					position: group.values.length,
				});
			}
		}
	}
	return [...groups.values()];
}

function normalizeFeatures(features: SyncProductFeature[] | undefined): SyncProductFeature[] {
	if (!features?.length) {
		return [];
	}

	return features
		.filter((item) => item.name?.trim())
		.map((item) => ({
			name: item.name.trim(),
			value: (item.value ?? item.name).trim(),
		}));
}

async function importProductCombinations(
	db: D1Database,
	productSlug: string,
	combinations: SyncProductCombination[],
): Promise<void> {
	await db
		.prepare(`DELETE FROM product_combinations WHERE product_slug = ?`)
		.bind(productSlug)
		.run();

	if (!combinations.length) {
		return;
	}

	const statements = combinations.map((combo) =>
		db
		.prepare(
			`INSERT INTO product_combinations (
					product_slug, external_id, options, attribute_ids, selections, size, color, price, original_price, promotion_start, promotion_end, reference, quantity, available, updated_at
				) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
		)
		.bind(
			productSlug,
			combo.id,
			JSON.stringify(combo.options ?? {}),
			JSON.stringify(combo.attributeIds ?? []),
			JSON.stringify(combo.selections ?? {}),
			combo.price,
			combo.originalPrice,
			combo.promotionStart,
			combo.promotionEnd,
			combo.reference,
			combo.quantity ?? 0,
			combo.available === false ? 0 : 1,
		),
	);

	await db.batch(statements);
}

function normalizeProduct(
	product: SyncProduct,
	categorySlugById: Map<string, string>,
) {
	const images = product.images?.length ? product.images : [product.image];
	const translations = normalizeTranslations(product);
	const primary =
		translations.find((t) => t.locale === defaultLocale) ?? translations[0];
	const combinations = normalizeCombinations(product.combinations);
	const optionGroups = resolveImportOptionGroups(product, combinations);
	const { price, originalPrice: resolvedOriginalPrice, promotionStart: comboPromotionStart, promotionEnd: comboPromotionEnd } =
		resolveProductPrice(product.price, combinations);
	const originalPrice =
		resolvedOriginalPrice ??
		(product.originalPrice != null && product.originalPrice > price
			? toEuroAmount(product.originalPrice)
			: null);
	const promotionStart =
		comboPromotionStart ?? product.promotionStart?.trim() ?? null;
	const promotionEnd = comboPromotionEnd ?? product.promotionEnd?.trim() ?? null;
	const badge =
		product.available === false
			? null
			: originalPrice != null && originalPrice > price
				? ('sale' as BadgeKey)
				: (product.badge ?? null);

	return {
		slug: product.slug,
		categorySlug: resolveImportedCategorySlug(
			product.categorySlug,
			product.categoryId,
			{ slugById: categorySlugById },
		),
		price,
		originalPrice,
		promotionStart,
		promotionEnd,
		image: product.image,
		images: JSON.stringify(images),
		optionGroups: JSON.stringify(optionGroups),
		features: JSON.stringify(normalizeFeatures(product.features)),
		sizes: LEGACY_DB.sizes,
		colors: LEGACY_DB.colors,
		combinations,
		material: LEGACY_DB.material,
		style: LEGACY_DB.style,
		room: LEGACY_DB.room,
		rating: LEGACY_DB.rating,
		reviewCount: LEGACY_DB.reviewCount,
		badge,
		name: primary.name,
		description: primary.description,
		care: primary.care,
		locale: primary.locale,
		translations,
	};
}

export async function importCatalog(db: D1Database, payload: CatalogImportPayload) {
	const catalogId = catalogIdFromPayload(payload);
	const incoming = (payload.products ?? []).filter((p) => p.slug && p.name && p.image);
	let categoriesUpserted = 0;
	let categorySlugById = new Map<string, string>();

	if (payload.catalogName || payload.categories?.length) {
		await upsertCatalogMeta(db, catalogId, payload.catalogName);
	}

	if (payload.categories?.length) {
		const categoryResult = await importCategories(db, {
			catalogId,
			catalogName: payload.catalogName,
			categories: payload.categories,
			replaceCategories: payload.replaceCategories,
		});
		categoriesUpserted = categoryResult.upserted;
		categorySlugById = categoryResult.slugById;
	}

	if (!incoming.length) {
		return { upserted: 0, categoriesUpserted, removed: false };
	}

	const slugs = incoming.map((p) => p.slug);
	const statements: D1PreparedStatement[] = [];

	if (payload.replaceProducts !== false) {
		const placeholders = slugs.map(() => '?').join(', ');
		statements.push(
			db
				.prepare(`DELETE FROM product_translations WHERE slug NOT IN (${placeholders})`)
				.bind(...slugs),
			db
				.prepare(`DELETE FROM product_combinations WHERE product_slug NOT IN (${placeholders})`)
				.bind(...slugs),
			db.prepare(`DELETE FROM products WHERE slug NOT IN (${placeholders})`).bind(...slugs),
		);
	}

	let upserted = 0;

	for (const raw of incoming) {
		const product = normalizeProduct(raw, categorySlugById);

		statements.push(
			db
				.prepare(
					`INSERT INTO products (
					slug, price, original_price, promotion_start, promotion_end, image, images, option_groups, features, sizes, colors,
					material, style, room, rating, review_count, badge, category_slug, updated_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
				ON CONFLICT(slug) DO UPDATE SET
					price = excluded.price,
					original_price = excluded.original_price,
					promotion_start = excluded.promotion_start,
					promotion_end = excluded.promotion_end,
					image = excluded.image,
					images = excluded.images,
					option_groups = excluded.option_groups,
					features = excluded.features,
					sizes = excluded.sizes,
					colors = excluded.colors,
					material = excluded.material,
					style = excluded.style,
					room = excluded.room,
					rating = excluded.rating,
					review_count = excluded.review_count,
					badge = excluded.badge,
					category_slug = excluded.category_slug,
					updated_at = datetime('now')`,
				)
				.bind(
					product.slug,
					product.price,
					product.originalPrice,
					product.promotionStart,
					product.promotionEnd,
					product.image,
					product.images,
					product.optionGroups,
					product.features,
					product.sizes,
					product.colors,
					product.material,
					product.style,
					product.room,
					product.rating,
					product.reviewCount,
					product.badge,
					product.categorySlug,
				),
		);

		for (const tr of product.translations) {
			statements.push(
				db
					.prepare(
						`INSERT INTO product_translations (slug, locale, name, description, care)
					VALUES (?, ?, ?, ?, ?)
					ON CONFLICT(slug, locale) DO UPDATE SET
						name = excluded.name,
						description = excluded.description,
						care = excluded.care`,
					)
					.bind(product.slug, tr.locale, tr.name, tr.description, tr.care),
			);
		}

		upserted++;
	}

	if (statements.length) {
		await db.batch(statements);
	}

	for (const raw of incoming) {
		const product = normalizeProduct(raw, categorySlugById);
		await importProductCombinations(db, product.slug, product.combinations);
	}

	return { upserted, categoriesUpserted, removed: payload.replaceProducts !== false };
}

type ExportProductRow = {
	slug: string;
	price: number;
	original_price: number | null;
	promotion_start: string | null;
	promotion_end: string | null;
	image: string;
	images: string;
	option_groups: string;
	features: string;
	sizes: string;
	colors: string;
	material: string;
	style: string;
	room: string;
	rating: number;
	review_count: number;
	badge: BadgeKey | null;
	category_slug: string | null;
};

type CategoryRow = {
	slug: string;
	name: string;
	sort_order: number;
	active: number;
	parent_external_id: string | null;
	parent_slug: string | null;
	image: string | null;
	external_id: string | null;
};

async function listCategoriesForCatalog(
	db: D1Database,
	catalogId: string,
): Promise<SyncCategory[]> {
	const result = await db
		.prepare(
			`SELECT slug, name, sort_order, active, parent_external_id, parent_slug, image, external_id
			FROM categories
			WHERE catalog_id = ? AND active = 1
			ORDER BY sort_order ASC, name ASC`,
		)
		.bind(catalogId)
		.all<CategoryRow>();

	const rows = result.results ?? [];
	return rows.map((row) => ({
		id: row.external_id ?? undefined,
		slug: row.slug,
		name: row.name,
		sortOrder: row.sort_order,
		active: row.active === 1,
		parentId: row.parent_external_id ?? undefined,
		parentSlug: row.parent_slug,
		image: row.image,
	}));
}

export async function exportCatalog(
	db: D1Database,
	catalogId = '1',
): Promise<CatalogImportPayload & { catalogs: { id: string; name: string }[] }> {
	const catalogRow = await db
		.prepare('SELECT id, name FROM catalogs WHERE id = ?')
		.bind(catalogId)
		.first<{ id: string; name: string }>();

	const categories = await listCategoriesForCatalog(db, catalogId);
	const defaultCategorySlug =
		categories.find((cat) => !cat.parentId && !cat.parentSlug)?.slug ??
		categories[0]?.slug ??
		null;

	const productRows = await db
		.prepare(`SELECT * FROM products ORDER BY slug ASC`)
		.all<ExportProductRow>();
	const productSlugs = (productRows.results ?? []).map((row) => row.slug);
	const combinationsBySlug = await listCombinationsByProductSlugs(db, productSlugs);

	const translationRows = await db
		.prepare(`SELECT * FROM product_translations ORDER BY slug ASC, locale ASC`)
		.all<{
			slug: string;
			locale: string;
			name: string;
			description: string;
			care: string;
		}>();

	const translationsBySlug = new Map<string, SyncProductTranslation[]>();
	for (const tr of translationRows.results ?? []) {
		const list = translationsBySlug.get(tr.slug) ?? [];
		list.push({
			locale: tr.locale,
			name: tr.name,
			description: tr.description,
			care: tr.care,
		});
		translationsBySlug.set(tr.slug, list);
	}

	return {
		catalogs: [{ id: catalogId, name: catalogRow?.name ?? 'Catalog' }],
		catalogId,
		catalogName: catalogRow?.name ?? 'Catalog',
		categories,
		products: (productRows.results ?? []).map((row) => {
			const translations = translationsBySlug.get(row.slug) ?? [];
			const primary =
				translations.find((t) => t.locale === defaultLocale) ?? translations[0];
			const combinations = combinationsBySlug.get(row.slug) ?? [];
			const optionGroups = parseOptionGroups(row.option_groups);
			const features = parseFeatures(row.features);

			return {
				slug: row.slug,
				name: primary?.name ?? row.slug,
				description: primary?.description ?? '',
				care: primary?.care ?? '',
				locale: primary?.locale ?? defaultLocale,
				translations,
				price: row.price,
				originalPrice: row.original_price ?? undefined,
				promotionStart: row.promotion_start ?? undefined,
				promotionEnd: row.promotion_end ?? undefined,
				image: row.image,
				images: JSON.parse(row.images) as string[],
				features: features.length ? features : undefined,
				optionGroups: optionGroups.length ? optionGroups : undefined,
				combinations: combinations.length
					? combinations.map((combo) => ({
							id: combo.id,
							attributeIds: combo.attributeIds,
							options: combo.options,
							selections: combo.selections,
							price: combo.price,
							originalPrice: combo.originalPrice ?? null,
							promotionStart: combo.promotionStart ?? null,
							promotionEnd: combo.promotionEnd ?? null,
							reference: combo.reference ?? null,
							quantity: combo.quantity,
							available: combo.available,
						}))
					: undefined,
				badge: row.badge ?? undefined,
				categorySlug: row.category_slug ?? defaultCategorySlug ?? undefined,
				available: true,
			};
		}),
	};
}
