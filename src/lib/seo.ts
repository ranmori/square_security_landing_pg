import { company } from '../data/company';

export interface Crumb {
  label: string;
  href?: string;
}

/** BreadcrumbList from the same crumbs PageHero renders; the last crumb points to the current page. */
export function breadcrumbJsonLd(crumbs: Crumb[], site: URL, currentPath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: new URL(crumb.href ?? currentPath, site).href,
    })),
  };
}

interface JobData {
  title: string;
  summary: string;
  tasks: string[];
  requirements: string[];
  offer: string[];
  employmentTypes: string[];
  datePosted: Date;
}

const list = (items: string[]) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;

/** JobPosting for Google for Jobs. */
export function jobPostingJsonLd(job: JobData, site: URL, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: `<p>${job.summary}</p>${list(job.tasks)}${list(job.requirements)}${list(job.offer)}`,
    datePosted: job.datePosted.toISOString().slice(0, 10),
    employmentType: job.employmentTypes,
    directApply: true,
    url: new URL(url, site).href,
    hiringOrganization: {
      '@type': 'Organization',
      name: company.legalName,
      sameAs: site.origin,
      logo: new URL('/brand/logo-light-bg.png', site).href,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: company.street,
        postalCode: company.postalCode,
        addressLocality: company.city,
        addressRegion: company.region,
        addressCountry: company.country,
      },
    },
  };
}
