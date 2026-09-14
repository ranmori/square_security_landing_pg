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

const jobs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/jobs' }),
  schema: z.object({
    lang: z.enum(['de', 'en']),
    /** Language-independent id, shared by the DE and EN posting */
    key: z.string(),
    order: z.number().default(1),
    title: z.string(),
    location: z.string(),
    /** schema.org JobPosting employmentType values */
    employmentTypes: z.array(z.enum(['FULL_TIME', 'PART_TIME', 'TEMPORARY', 'CONTRACTOR', 'OTHER'])),
    employmentLabel: z.string(),
    datePosted: z.coerce.date(),
    summary: z.string(),
    tasks: z.array(z.string()),
    requirements: z.array(z.string()),
    offer: z.array(z.string()),
  }),
});

export const collections = { services, jobs };
