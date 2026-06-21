// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	build: {
		inlineStylesheets: 'always',
	},
	// Loja não usa Astro Sessions — evita auto-criação de KV SESSION no deploy (erro 10014)
	session: {
		driver: {
			entrypoint: 'unstorage/drivers/null',
		},
	},
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
		imageService: 'compile',
	}),
	i18n: {
		defaultLocale: 'pt',
		locales: ['pt'],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	image: {
		remotePatterns: [{ protocol: 'https' }],
	},
});
