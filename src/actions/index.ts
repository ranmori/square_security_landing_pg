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

async function sendEmail(tag: string, email: Record<string, unknown>, logSummary: string) {
  if (!RESEND_API_KEY) {
    if (import.meta.env.DEV) {
      console.info(`[${tag}] RESEND_API_KEY not set – email not sent.\n${logSummary}`);
      return;
    }
    throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email service not configured' });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: CONTACT_FROM_EMAIL, to: [CONTACT_TO_EMAIL], ...email }),
  });

  if (!res.ok) {
    console.error(`[${tag}] Resend error`, res.status, await res.text());
    throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email could not be sent' });
  }
}

// Job applications
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const isAllowedFile = (file: File) => allowedFileTypes.includes(file.type);
const employmentLabels: Record<string, string> = {
  fulltime: 'Vollzeit',
  parttime: 'Teilzeit',
  minijob: 'Minijob',
  weekends: 'Nur am Wochenende',
};
const qualificationLabels: Record<string, string> = {
  exam: 'Sachkundeprüfung § 34a GewO',
  instruction: 'Unterrichtung § 34a GewO',
  none: 'Noch nicht – Schulung gewünscht',
};

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const safeFileName = (name: string) => name.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'datei';

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

      await sendEmail('contact', { reply_to: input.email, subject, text }, `Subject: ${subject}\n${text}`);
      return { ok: true };
    },
  }),

  application: defineAction({
    accept: 'form',
    input: z.object({
      lang: z.enum(['de', 'en']).default('de'),
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(200),
      phone: z.string().trim().min(5).max(60),
      position: z.string().trim().max(80).optional(),
      startDate: z.string().trim().max(20).optional(),
      employmentType: z.enum(['fulltime', 'parttime', 'minijob', 'weekends']),
      qualification: z.enum(['exam', 'instruction', 'none']),
      licence: z.enum(['yes', 'no']),
      languages: z.string().trim().max(200).optional(),
      message: z.string().trim().max(3000).optional(),
      cv: z.instanceof(File).refine((file) => file.size > 0 && isAllowedFile(file), { message: 'CV (PDF, JPG or PNG) required' }),
      // Browsers send an empty file when nothing is selected.
      certificates: z
        .array(z.instanceof(File))
        .optional()
        .refine((files) => (files ?? []).every((file) => file.size === 0 || isAllowedFile(file)), {
          message: 'Only PDF, JPG or PNG files',
        }),
      privacy: z.boolean().refine((accepted) => accepted, { message: 'Consent required' }),
      website: z.string().optional(),
      'cf-turnstile-response': z.string().optional(),
    }),
    handler: async (input) => {
      if (input.website) return { ok: true };

      if (!(await verifyTurnstile(input['cf-turnstile-response']))) {
        throw new ActionError({ code: 'FORBIDDEN', message: 'Spam check failed' });
      }

      const files = [input.cv, ...(input.certificates ?? [])].filter((file) => file.size > 0);
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      if (totalBytes > MAX_UPLOAD_BYTES) {
        throw new ActionError({ code: 'CONTENT_TOO_LARGE', message: 'Files exceed 5 MB' });
      }

      const position = input.position && input.position !== 'open' ? input.position : 'Initiativbewerbung';
      const subject = `Bewerbung: ${singleLine(position)} – ${singleLine(input.name)}`;
      const text = [
        `Neue Bewerbung über die Karriereseite der Website (Sprache: ${input.lang.toUpperCase()})`,
        '',
        `Name:          ${input.name}`,
        `E-Mail:        ${input.email}`,
        `Telefon:       ${input.phone}`,
        `Stelle:        ${position}`,
        `Eintritt ab:   ${input.startDate || '–'}`,
        `Anstellung:    ${employmentLabels[input.employmentType]}`,
        `§ 34a GewO:    ${qualificationLabels[input.qualification]}`,
        `Führerschein:  ${input.licence === 'yes' ? 'Ja (Klasse B)' : 'Nein'}`,
        `Sprachen:      ${input.languages || '–'}`,
        '',
        'Nachricht:',
        input.message || '–',
        '',
        `Anhänge: ${files.map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`).join(', ')}`,
      ].join('\n');

      const attachments = await Promise.all(
        files.map(async (file) => ({ filename: safeFileName(file.name), content: toBase64(await file.arrayBuffer()) })),
      );

      await sendEmail('application', { reply_to: input.email, subject, text, attachments }, `Subject: ${subject}\n${text}`);
      return { ok: true };
    },
  }),
};
