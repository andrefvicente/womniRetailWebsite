import { hasDatabase, getDatabase } from '../db/bindings';

export const TRUST_BAR_KEY = 'TRUST_BAR';
export const TRUST_BAR_DRAFT_KEY = 'TRUST_BAR_DRAFT';

export interface TrustBarItem {
	icon: string;
	text: string;
	visible?: boolean;
}

export interface TrustBarLocaleCopy {
	items: TrustBarItem[];
}

export interface SiteTrustBar {
	enabled: boolean;
	showText: boolean;
	backgroundColor: string;
	textColor: string;
	locales: Record<string, TrustBarLocaleCopy>;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_BACKGROUND = '#987933';
const DEFAULT_TEXT = '#ffffff';

function parseBoolean(value: unknown, fallback: boolean): boolean {
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'number') {
		if (value === 1) return true;
		if (value === 0) return false;
	}
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true' || normalized === '1') return true;
		if (normalized === 'false' || normalized === '0') return false;
	}
	return fallback;
}

function normalizeColor(value: string | undefined, fallback: string): string {
	const trimmed = value?.trim() ?? '';
	return HEX_COLOR.test(trimmed) ? trimmed : fallback;
}

function parseTrustBar(raw: string | undefined): SiteTrustBar | null {
	if (!raw?.trim()) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return null;
		}

		const data = parsed as Partial<SiteTrustBar>;
		const locales: Record<string, TrustBarLocaleCopy> = {};

		if (data.locales && typeof data.locales === 'object' && !Array.isArray(data.locales)) {
			for (const [locale, entry] of Object.entries(data.locales)) {
				if (!locale.trim() || !entry || typeof entry !== 'object' || Array.isArray(entry)) {
					continue;
				}

				const items = Array.isArray(entry.items)
					? entry.items
							.filter((item) => item && typeof item === 'object')
							.map((item) => ({
								icon: typeof item.icon === 'string' ? item.icon : '•',
								text: typeof item.text === 'string' ? item.text : '',
								visible: item.visible !== false,
							}))
					: [];

				if (items.length) {
					locales[locale] = { items };
				}
			}
		}

		return {
			enabled: parseBoolean(data.enabled, true),
			showText: parseBoolean(data.showText, true),
			backgroundColor: normalizeColor(data.backgroundColor, DEFAULT_BACKGROUND),
			textColor: normalizeColor(data.textColor, DEFAULT_TEXT),
			locales,
		};
	} catch {
		return null;
	}
}

export interface LoadTrustBarOptions {
	editMode?: boolean;
}

export async function loadSiteTrustBar(
	options: LoadTrustBarOptions = {},
): Promise<SiteTrustBar | null> {
	if (!hasDatabase()) {
		return null;
	}

	try {
		const db = getDatabase();
		const keys = options.editMode
			? [TRUST_BAR_DRAFT_KEY, TRUST_BAR_KEY]
			: [TRUST_BAR_KEY];

		const rows = await db
			.prepare(
				`SELECT key, value FROM site_settings WHERE key IN (${keys.map(() => '?').join(', ')})`,
			)
			.bind(...keys)
			.all<{ key: string; value: string }>();

		const map = new Map((rows.results ?? []).map((row) => [row.key, row.value]));

		if (options.editMode) {
			const draftRaw = map.get(TRUST_BAR_DRAFT_KEY);
			if (draftRaw !== undefined) {
				return parseTrustBar(draftRaw);
			}
			return parseTrustBar(map.get(TRUST_BAR_KEY));
		}

		return parseTrustBar(map.get(TRUST_BAR_KEY));
	} catch {
		return null;
	}
}

export function resolveTrustBarItems(
	locale: string | undefined,
	defaults: string[],
	locales: Record<string, TrustBarLocaleCopy>,
	showText: boolean,
): TrustBarItem[] {
	const short = locale?.split(/[-_]/)[0]?.toLowerCase();
	const custom =
		(locale && locales[locale]?.items) ||
		(short && locales[short]?.items) ||
		[];

	const icons = ['🚚', '↩', '✓', '★'];

	if (custom.length) {
		return custom.map((item, index) => ({
			icon: item.icon?.trim() || icons[index] || '•',
			text: item.text?.trim() || defaults[index] || '',
			visible: item.visible !== false,
		}));
	}

	return defaults.map((text, index) => ({
		icon: icons[index] || '•',
		text,
		visible: true,
	}));
}
