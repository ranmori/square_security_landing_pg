import type { ServiceKey } from '../i18n/ui';

/** Inner SVG markup for 24×24 stroke icons. */
export const icons = {
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M9 14.5 8 22l4-2 4 2-1-7.5"/>',
  building:
    '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10"/><path d="M3 21h18"/><path d="M8 7h4M8 11h4M8 15h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chat: '<path d="M4 5h9v7H8l-4 3V5z"/><path d="M13 9h7v9l-3-2h-4v-3"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  home: '<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  mapPin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  phone:
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
  shieldCheck: '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"/><path d="m9 12 2 2 4-4"/>',
  sliders:
    '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  userCheck:
    '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-7 7-7 1.8 0 3.4.7 4.7 1.8"/><path d="m15 18 2 2 4-4"/>',
  userShield:
    '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 16.5c.8-1.8 2-2.7 3.5-2.7s2.7.9 3.5 2.7"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c3 .3 5.5 2.7 5.5 5.8"/>',
} as const;

export type IconName = keyof typeof icons;

export const serviceIcons = {
  event: 'users',
  property: 'building',
  refugee: 'home',
  patrol: 'route',
  personal: 'userShield',
} as const satisfies Record<ServiceKey, IconName>;
