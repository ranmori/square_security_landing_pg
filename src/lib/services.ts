import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type ServiceEntry = CollectionEntry<'services'>;

export async function getServices(lang: Lang): Promise<ServiceEntry[]> {
  const services = await getCollection('services', (entry) => entry.data.lang === lang);
  return services.sort((a, b) => a.data.order - b.data.order);
}
