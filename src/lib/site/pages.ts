import { hasDatabase, getDatabase } from '../db/bindings';
import type { PageBlock, PageConfig } from './page-types';

export const PAGE_HOME_KEY = 'PAGE_HOME';
export const PAGE_HOME_DRAFT_KEY = 'PAGE_HOME_DRAFT';

export interface LoadPageConfigOptions {
	editMode?: boolean;
}

function parsePageConfig(raw: string | undefined): PageConfig | null {
	if (!raw?.trim()) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return null;
		}

		const sections = (parsed as { sections?: unknown }).sections;
		if (!Array.isArray(sections)) {
			return null;
		}

		const blocks: PageBlock[] = [];
		for (const entry of sections) {
			if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
				continue;
			}

			const block = entry as PageBlock;
			if (
				typeof block.id !== 'string' ||
				!block.id.trim() ||
				typeof block.type !== 'string' ||
				!block.type.trim()
			) {
				continue;
			}

			blocks.push({
				id: block.id.trim(),
				type: block.type.trim() as PageBlock['type'],
				visible: block.visible !== false,
				position: typeof block.position === 'number' ? block.position : blocks.length,
				props:
					block.props && typeof block.props === 'object' && !Array.isArray(block.props)
						? { ...block.props }
						: {},
			});
		}

		return blocks.length ? { sections: blocks } : null;
	} catch {
		return null;
	}
}

function pageSettingKey(slug: string, editMode = false): string {
	const safeSlug = slug.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
	const suffix = editMode ? '_DRAFT' : '';
	return `PAGE_${safeSlug}${suffix}`;
}

export async function loadPageConfig(
	slug: string,
	options: LoadPageConfigOptions = {},
): Promise<PageConfig | null> {
	if (!hasDatabase()) {
		return null;
	}

	try {
		const db = getDatabase();
		const keys = options.editMode
			? [pageSettingKey(slug, true), pageSettingKey(slug, false)]
			: [pageSettingKey(slug, false)];

		const row = await db
			.prepare(
				`SELECT key, value FROM site_settings WHERE key IN (${keys.map(() => '?').join(', ')})`,
			)
			.bind(...keys)
			.all<{ key: string; value: string }>();

		const map = new Map((row.results ?? []).map((entry) => [entry.key, entry.value]));

		if (options.editMode) {
			return (
				parsePageConfig(map.get(pageSettingKey(slug, true))) ??
				parsePageConfig(map.get(pageSettingKey(slug, false)))
			);
		}

		return parsePageConfig(map.get(pageSettingKey(slug, false)));
	} catch {
		return null;
	}
}

export function resolveLocaleCopy<T extends Record<string, unknown>>(
	locale: string | undefined,
	locales: Record<string, T> | undefined,
	defaults: T,
): T {
	if (!locales) {
		return defaults;
	}

	const short = locale?.split(/[-_]/)[0]?.toLowerCase();
	const entries = locales ? Object.entries(locales) : [];
	const custom =
		(locale && locales?.[locale]) ||
		(short && locales?.[short]) ||
		entries.find(([key]) => key.split(/[-_]/)[0]?.toLowerCase() === short)?.[1];

	if (!custom) {
		return defaults;
	}

	const merged = { ...defaults };
	for (const [key, value] of Object.entries(custom)) {
		if (value == null) {
			continue;
		}
		if (typeof value === 'string' && !value.trim()) {
			continue;
		}
		(merged as Record<string, unknown>)[key] = value;
	}

	return merged;
}
