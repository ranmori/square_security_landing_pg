import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { serviceKeys } from './i18n/ui';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    lang: z.enum(['de', 'en']),
    key: z.enum(serviceKeys),
    order: z.number(),
    /** H1 on the service page */
    title: z.string(),
    /** Short name for navigation and cards */
    navTitle: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
    summary: z.string(),
    highlights: z.array(z.string()),
    audience: z.array(z.string()),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  }),
});

export const collections = { services };
