import type { APIRoute } from 'astro';
import { CONTACT_TO_EMAIL, PUBLIC_TURNSTILE_SITE_KEY, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';

export const prerender = false;

/**
 * Deployment check: which build is live and whether the form keys reached it.
 * Reports only whether a key exists, never its value.
 */
export const GET: APIRoute = () =>
  new Response(
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
