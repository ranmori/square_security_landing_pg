import type { APIRoute } from 'astro';
import { CONTACT_TO_EMAIL, PUBLIC_TURNSTILE_SITE_KEY, RESEND_API_KEY, STATUS_TOKEN, TURNSTILE_SECRET_KEY } from 'astro:env/server';

export const prerender = false;

/** Length-independent comparison, so the token cannot be guessed from response times. */
function matches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/**
 * Deployment check: which build is live and whether the form keys reached it.
 * Reports only whether a key exists, never its value, and only to whoever holds
 * STATUS_TOKEN – without that secret the route does not exist.
 */
export const GET: APIRoute = ({ url }) => {
  const token = url.searchParams.get('token') ?? '';
  if (!STATUS_TOKEN || !matches(token, STATUS_TOKEN)) return new Response('Not found', { status: 404 });

  return new Response(
    JSON.stringify(
      {
        built: import.meta.env.BUILD_TIME ?? 'unknown',
        turnstileSiteKey: Boolean(PUBLIC_TURNSTILE_SITE_KEY),
        turnstileSecret: Boolean(TURNSTILE_SECRET_KEY),
        resendKey: Boolean(RESEND_API_KEY),
        contactTo: CONTACT_TO_EMAIL,
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
};
