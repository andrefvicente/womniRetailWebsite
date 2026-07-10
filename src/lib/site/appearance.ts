import { hasDatabase, getDatabase } from '../db/bindings';

export const DEFAULT_ACCENT = '#987933';
export const DEFAULT_ACCENT_HOVER = '#7a6129';

const APPEARANCE_KEYS = {
	accent: 'BUTTON_BACKGROUND_COLOR',
	accentHover: 'BUTTON_HOVER_COLOR',
} as const;

export interface SiteAppearance {
	accentColor: string;
	accentHoverColor: string;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function normalizeColor(value: string | undefined, fallback: string): string {
	const trimmed = value?.trim() ?? '';
	return HEX_COLOR.test(trimmed) ? trimmed : fallback;
}

export async function loadSiteAppearance(): Promise<SiteAppearance> {
	const defaults: SiteAppearance = {
		accentColor: DEFAULT_ACCENT,
		accentHoverColor: DEFAULT_ACCENT_HOVER,
	};

	if (!hasDatabase()) {
		return defaults;
	}

	try {
		const db = getDatabase();
		const rows = await db
			.prepare('SELECT key, value FROM site_settings WHERE key IN (?, ?)')
			.bind(APPEARANCE_KEYS.accent, APPEARANCE_KEYS.accentHover)
			.all<{ key: string; value: string }>();

		const map = new Map((rows.results ?? []).map((row) => [row.key, row.value]));

		return {
			accentColor: normalizeColor(map.get(APPEARANCE_KEYS.accent), DEFAULT_ACCENT),
			accentHoverColor: normalizeColor(
				map.get(APPEARANCE_KEYS.accentHover),
				DEFAULT_ACCENT_HOVER,
			),
		};
	} catch {
		return defaults;
	}
}

export function appearanceStyleTag(appearance: SiteAppearance): string {
	return `:root{--color-accent:${appearance.accentColor};--color-accent-hover:${appearance.accentHoverColor}}`;
}
