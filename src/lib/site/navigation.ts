import { hasDatabase, getDatabase } from '../db/bindings';
import {
	buildCategoryTiles,
	buildMainNav,
	categoryHref,
	countProductsByCategorySlug,
	getDefaultCatalogHref,
	listCategories,
	listTopLevelCategories,
	resolveCatalogId,
	type CategoryTile,
	type NavCategoryLink,
} from '../db/categories';

export interface SiteNavigation {
	mainNav: NavCategoryLink[];
	categoryTiles: CategoryTile[];
	footerShop: { label: string; href: string }[];
	defaultCatalogHref: string;
}

const emptyNavigation: SiteNavigation = {
	mainNav: [],
	categoryTiles: [],
	footerShop: [],
	defaultCatalogHref: '/',
};

export async function loadSiteNavigation(): Promise<SiteNavigation> {
	if (!hasDatabase()) {
		return emptyNavigation;
	}

	const db = getDatabase();
	const catalogId = await resolveCatalogId(db);
	const categories = await listCategories(db, catalogId);
	const defaultCatalogHref = await getDefaultCatalogHref(db, catalogId);

	if (!categories.length) {
		return { ...emptyNavigation, defaultCatalogHref };
	}

	const productCounts = await countProductsByCategorySlug(
		db,
		categories.map((cat) => cat.slug),
	);

	const mainNav = buildMainNav(categories);
	const categoryTiles = buildCategoryTiles(categories, productCounts);
	const footerShop = listTopLevelCategories(categories).map((cat) => ({
		label: cat.name,
		href: categoryHref(cat.slug),
	}));

	return {
		mainNav,
		categoryTiles,
		footerShop,
		defaultCatalogHref,
	};
}
