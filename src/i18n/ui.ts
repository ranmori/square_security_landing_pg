import { de } from './de';
import { en } from './en';

export const languages = { de: 'Deutsch', en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'de';

const dictionaries = { de, en };

export function useTranslations(lang: Lang) {
  return dictionaries[lang];
}

/** Language-independent service identifiers. The order of the pages comes from the content files. */
export const serviceKeys = ['event', 'property', 'refugee', 'patrol', 'personal'] as const;
export type ServiceKey = (typeof serviceKeys)[number];

export const serviceSlugs: Record<ServiceKey, Record<Lang, string>> = {
  event: { de: 'veranstaltungsschutz', en: 'event-security' },
  property: { de: 'objektschutz', en: 'property-protection' },
  refugee: { de: 'fluechtlingsunterkuenfte', en: 'refugee-accommodation-security' },
  patrol: { de: 'streifendienst', en: 'patrol-service' },
  personal: { de: 'personenschutz', en: 'personal-protection' },
};

export const pageRoutes = {
  home: { de: '/', en: '/en/' },
  services: { de: '/leistungen/', en: '/en/services/' },
  contact: { de: '/kontakt/', en: '/en/contact/' },
  imprint: { de: '/impressum/', en: '/en/legal-notice/' },
  privacy: { de: '/datenschutz/', en: '/en/privacy/' },
} as const satisfies Record<string, Record<Lang, string>>;
export type PageKey = keyof typeof pageRoutes;

/** The same page in every language, used for hreflang and the language switcher. */
export type Alternates = Record<Lang, string>;

export function pagePath(page: PageKey, lang: Lang): string {
  return pageRoutes[page][lang];
}

export function servicePath(key: ServiceKey, lang: Lang): string {
  return `${pageRoutes.services[lang]}${serviceSlugs[key][lang]}/`;
}

export function pageAlternates(page: PageKey): Alternates {
  return { ...pageRoutes[page] };
}

export function serviceAlternates(key: ServiceKey): Alternates {
  return { de: servicePath(key, 'de'), en: servicePath(key, 'en') };
}
