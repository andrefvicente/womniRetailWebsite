/** Resize picsum placeholder URLs to the rendered dimensions. */
export function optimizeRemoteImageSrc(src: string, width: number, height: number): string {
	const match = src.match(/^(https:\/\/picsum\.photos\/seed\/[^/]+)\/\d+\/\d+$/);
	if (match) {
		return `${match[1]}/${width}/${height}`;
	}
	return src;
}
