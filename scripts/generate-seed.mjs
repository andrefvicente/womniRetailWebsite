/**
 * Gera migrations/0002_seed.sql a partir dos dados em src/data/products.ts e src/i18n/pt.ts
 * Executar: node scripts/generate-seed.mjs
 */
import { writeFileSync } from 'node:fs';
import { products } from '../src/data/products.ts';
import pt from '../src/i18n/pt.ts';

function sqlString(value) {
	return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
	return sqlString(JSON.stringify(value));
}

const productStatements = products.map((p) => {
	const cols = [
		'slug',
		'price',
		'original_price',
		'image',
		'images',
		'sizes',
		'colors',
		'material',
		'style',
		'room',
		'rating',
		'review_count',
		'badge',
	];
	const vals = [
		sqlString(p.slug),
		p.price,
		p.originalPrice ?? 'NULL',
		sqlString(p.image),
		sqlJson(p.images),
		sqlJson(p.sizes),
		sqlJson(p.colors),
		sqlString(p.material),
		sqlString(p.style),
		sqlString(p.room),
		p.rating,
		p.reviewCount,
		p.badge ? sqlString(p.badge) : 'NULL',
	];
	return `INSERT OR REPLACE INTO products (${cols.join(', ')}) VALUES (${vals.join(', ')});`;
});

const translationStatements = products.map((p) => {
	const copy = pt.products[p.slug];
	if (!copy) throw new Error(`Missing PT copy for ${p.slug}`);
	return `INSERT OR REPLACE INTO product_translations (slug, locale, name, description, care) VALUES (${sqlString(p.slug)}, 'pt', ${sqlString(copy.name)}, ${sqlString(copy.description)}, ${sqlString(copy.care)});`;
});

const sql = [
	'-- Seed gerado por scripts/generate-seed.mjs',
	'DELETE FROM product_translations;',
	'DELETE FROM products;',
	...productStatements,
	...translationStatements,
].join('\n');

writeFileSync(new URL('../migrations/0002_seed.sql', import.meta.url), sql + '\n');
console.log(`Wrote ${products.length} products to migrations/0002_seed.sql`);
