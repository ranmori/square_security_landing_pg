import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Serves the hero film with byte-range support.
 *
 * Cloudflare's static assets answer a range request with the whole file, and Safari refuses to
 * start a video it cannot probe that way. The files therefore live in public/media/ and are
 * served from here. Note that `trailingSlash: 'always'` applies to this route too, so the
 * video URLs end in a slash.
 */
const mediaTypes: Record<string, string> = {
  'guard-film.mp4': 'video/mp4',
  'guard-film.webm': 'video/webm',
  'guard-film-mobile.mp4': 'video/mp4',
  'guard-film-mobile.webm': 'video/webm',
};

type AssetFetcher = { fetch: (input: Request) => Promise<Response> };

/** The static-asset binding, which only exists in the Workers runtime. */
async function assetFetcher(): Promise<AssetFetcher | undefined> {
  try {
    const { env } = await import('cloudflare:workers');
    return (env as { ASSETS?: AssetFetcher }).ASSETS;
  } catch {
    // The dev server has no Workers runtime and serves public/ itself.
    return undefined;
  }
}

export const GET: APIRoute = async ({ params, request }) => {
  const file = params.file ?? '';
  const contentType = mediaTypes[file];
  if (!contentType) return new Response('Not found', { status: 404 });

  const source = new Request(new URL(`/media/${file}`, request.url));
  const binding = await assetFetcher();
  const asset = await (binding?.fetch(source) ?? fetch(source));
  if (!asset.ok) return new Response('Not found', { status: 404 });

  const body = await asset.arrayBuffer();
  const total = body.byteLength;
  const headers = new Headers({
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=604800',
  });

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range')?.trim() ?? '');
  const [, rawStart = '', rawEnd = ''] = range ?? [];

  if (range && (rawStart !== '' || rawEnd !== '')) {
    const start = rawStart === '' ? Math.max(total - Number(rawEnd), 0) : Number(rawStart);
    const end = rawStart === '' || rawEnd === '' ? total - 1 : Math.min(Number(rawEnd), total - 1);

    if (start > end || start >= total) {
      headers.set('Content-Range', `bytes */${total}`);
      return new Response(null, { status: 416, headers });
    }

    headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(body.slice(start, end + 1), { status: 206, headers });
  }

  headers.set('Content-Length', String(total));
  return new Response(body, { status: 200, headers });
};
