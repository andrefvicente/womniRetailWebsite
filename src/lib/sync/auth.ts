import { env } from 'cloudflare:workers';

export function verifySyncAuth(request: Request): boolean {
	const secret = env.WOMNI_SYNC_SECRET;
	if (!secret) {
		return false;
	}
	const header = request.headers.get('Authorization') ?? '';
	const match = header.match(/^Bearer\s+(.+)$/i);
	return Boolean(match && match[1] === secret);
}
