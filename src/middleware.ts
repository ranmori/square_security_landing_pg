import type { MiddlewareHandler } from 'astro';

/**
 * Security headers for server-rendered responses.
 *
 * public/_headers only covers static files, so without this the pages that carry the forms
 * (/kontakt/, /karriere/) would be served without any of these. Keep both lists in step.
 */
const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "media-src 'self'",
    "connect-src 'self' https://challenges.cloudflare.com",
    'frame-src https://challenges.cloudflare.com',
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; '),
};

export const onRequest: MiddlewareHandler = async (_context, next) => {
  const response = await next();
  for (const [name, value] of Object.entries(securityHeaders)) {
    if (!response.headers.has(name)) response.headers.set(name, value);
  }
  return response;
};
