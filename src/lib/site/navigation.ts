import { hasDatabase, getDatabase } from '../db/bindings';
import {
	buildMainNav,
	categoryHref,
	getDefaultCatalogHref,
	listCategories,
	listTopLevelCategories,
	resolveCatalogId,
	type NavCategoryLink,
} from '../db/categories';

export interface SiteNavigation {
	mainNav: NavCategoryLink[];
	footerShop: { label: string; href: string }[];
	defaultCatalogHref: string;
}

const emptyNavigation: SiteNavigation = {
	mainNav: [],
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

	const mainNav = buildMainNav(categories);
	const footerShop = listTopLevelCategories(categories).map((cat) => ({
		label: cat.name,
		href: categoryHref(cat.slug),
	}));

	return {
		mainNav,
		footerShop,
		defaultCatalogHref,
	};
}
