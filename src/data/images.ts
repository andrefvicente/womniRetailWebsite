/** Stable placeholder rug/interior images (picsum seeds) for build-time optimization */
const base = 'https://picsum.photos/seed';

export const rugImages = {
	neutral: `${base}/womni-neutral/800/1000`,
	warm: `${base}/womni-warm/800/1000`,
	jute: `${base}/womni-jute/800/1000`,
	geometric: `${base}/womni-geo/800/1000`,
	persian: `${base}/womni-persian/800/1000`,
	outdoor: `${base}/womni-outdoor/800/1000`,
	kids: `${base}/womni-kids/800/1000`,
	luxury: `${base}/womni-luxury/800/1000`,
	shag: `${base}/womni-shag/800/1000`,
	runner: `${base}/womni-runner/800/1000`,
	minimal: `${base}/womni-minimal/800/1000`,
	moroccan: `${base}/womni-moroccan/800/1000`,
	living: `${base}/womni-living/600/450`,
	bedroom: `${base}/womni-bedroom/600/450`,
	hallway: `${base}/womni-hallway/600/450`,
	hero: `${base}/womni-hero/900/1125`,
} as const;
