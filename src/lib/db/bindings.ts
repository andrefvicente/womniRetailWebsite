import { env } from 'cloudflare:workers';

/** D1 disponível (dev com platformProxy ou Worker em produção). */
export function hasDatabase(): boolean {
	return Boolean(env.DB);
}

export function getDatabase(): D1Database {
	if (!env.DB) {
		throw new Error(
			'D1 binding "DB" não encontrado. Execute `npm run db:migrate:local` e use `npm run dev` com o adapter Cloudflare.',
		);
	}
	return env.DB;
}
