import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';

// Enquiries are read by German-speaking staff, so labels are always German.
const serviceLabels: Record<string, string> = {
  event: 'Veranstaltungsschutz',
  property: 'Werk- und Objektschutz',
  refugee: 'Flüchtlingsunterkünfte',
  patrol: 'Streifen- und Revierdienst',
  personal: 'Personenschutz',
  other: 'Sonstiges / individuelle Lösung',
};

async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  // Without a secret the check can only be skipped during local development.
  if (!TURNSTILE_SECRET_KEY) return import.meta.env.DEV;
  if (!token) return false;

  const body = new FormData();
  body.append('secret', TURNSTILE_SECRET_KEY);
  body.append('response', token);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!res.ok) return false;
  const result = (await res.json()) as { success?: boolean };
  return result.success === true;
}

const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ');

export const server = {
  contact: defineAction({
    accept: 'form',
    input: z.object({
      lang: z.enum(['de', 'en']).default('de'),
      name: z.string().trim().min(2).max(120),
      company: z.string().trim().max(160).optional(),
      email: z.string().trim().email().max(200),
      phone: z.string().trim().max(60).optional(),
      service: z.string().trim().max(40).optional(),
      message: z.string().trim().min(10).max(5000),
      privacy: z.boolean().refine((accepted) => accepted, { message: 'Consent required' }),
      website: z.string().optional(),
      'cf-turnstile-response': z.string().optional(),
    }),
    handler: async (input) => {
      // Honeypot filled in: pretend success so bots learn nothing.
      if (input.website) return { ok: true };

      if (!(await verifyTurnstile(input['cf-turnstile-response']))) {
        throw new ActionError({ code: 'FORBIDDEN', message: 'Spam check failed' });
      }

      const service = (input.service && serviceLabels[input.service]) || 'Keine Angabe';
      const subject = `Kontaktanfrage: ${service} – ${singleLine(input.name)}`;
      const text = [
        `Neue Anfrage über das Kontaktformular der Website (Sprache: ${input.lang.toUpperCase()})`,
        '',
        `Name:     ${input.name}`,
        `Firma:    ${input.company || '–'}`,
        `E-Mail:   ${input.email}`,
        `Telefon:  ${input.phone || '–'}`,
        `Leistung: ${service}`,
        '',
        'Nachricht:',
        input.message,
      ].join('\n');

      if (!RESEND_API_KEY) {
        if (import.meta.env.DEV) {
          console.info(`[contact] RESEND_API_KEY not set – email not sent.\nSubject: ${subject}\n${text}`);
          return { ok: true };
        }
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email service not configured' });
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: CONTACT_FROM_EMAIL,
          to: [CONTACT_TO_EMAIL],
          reply_to: input.email,
          subject,
          text,
        }),
      });

      if (!res.ok) {
        console.error('[contact] Resend error', res.status, await res.text());
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email could not be sent' });
      }

      return { ok: true };
    },
  }),
};
