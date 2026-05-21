// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
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
