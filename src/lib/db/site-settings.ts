export async function upsertSiteSettings(
	db: D1Database,
	settings: Record<string, string>,
): Promise<number> {
	const entries = Object.entries(settings).filter(([key, value]) => key.trim() && value != null);
	if (!entries.length) {
		return 0;
	}

	const statements = entries.map(([key, value]) =>
		db
			.prepare(
				`INSERT INTO site_settings (key, value, updated_at)
				 VALUES (?, ?, datetime('now'))
				 ON CONFLICT(key) DO UPDATE SET
				   value = excluded.value,
				   updated_at = excluded.updated_at`,
			)
			.bind(key.trim(), String(value)),
	);

	await db.batch(statements);
	return entries.length;
}
