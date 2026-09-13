import type { Lang } from '../i18n/ui';

export const company = {
  legalName: 'Square Security GmbH',
  ceo: 'Adan Mohamed',
  street: 'Euerbacher Str. 2',
  postalCode: '97424',
  city: 'Schweinfurt',
  region: 'Bayern',
  country: 'DE',
  phoneE164: '+4915901697207',
  phoneDisplay: '0159 01697207',
  phoneDisplayIntl: '+49 159 01697207',
  email: 'info@square-security.de',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Euerbacher+Str.+2%2C+97424+Schweinfurt',
} as const;

export function phoneLabel(lang: Lang): string {
  return lang === 'de' ? company.phoneDisplay : company.phoneDisplayIntl;
}
