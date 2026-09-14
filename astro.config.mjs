// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://square-security.de',
  trailingSlash: 'always',
  // Keep HTML-aware whitespace handling so inline text keeps its spaces.
  compressHTML: true,

  adapter: cloudflare({
    // Images are optimised at build time; no Cloudflare Images binding needed.
    imageService: 'compile',
  }),

  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],

  security: {
    // Job applications upload CVs (max 5 MB of files); Astro's default action limit is 1 MB.
    actionBodySizeLimit: 6 * 1024 * 1024,
  },

  vite: {
    plugins: [tailwindcss()],
  },

  // Old WordPress URLs
  redirects: {
    '/online-booking-big': { status: 301, destination: '/kontakt/' },
    '/about-us': { status: 301, destination: '/' },
  },

  env: {
    schema: {
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        default: 'info@square-security.de',
      }),
      CONTACT_FROM_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        default: 'Square Security Website <website@square-security.de>',
      }),
    },
  },
});
