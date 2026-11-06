import {
  TERMS_AND_CONDITIONS_SECTION_IDS,
  getTermsSectionsByIds,
} from './termsSections.js';

export const POLICY_PAGES = [
  {
    slug: 'help-faqs',
    aliases: ['help'],
    title: '24/7 Help & FAQs',
    subtitle: 'Booking support, cancellations, refunds, and partner enquiries for TrumiTrip customers.',
    sectionIds: ['help'],
  },
  {
    slug: 'cancellation-refund-policy',
    aliases: ['cancellation', 'refund-policy'],
    title: 'Cancellation & Refund Policy',
    subtitle: 'How cancellations, amendments, and refunds work on TrumiTrip for flights, hotels, and holidays.',
    sectionIds: ['flight-cancellation', 'holiday-cancellation', 'refunds', 'refunds-insolvency'],
  },
  {
    slug: 'terms-and-conditions',
    aliases: ['terms'],
    title: 'Terms & Conditions',
    subtitle: 'These terms apply to bookings and use of www.trumitrip.com, the mobile site, and the TrumiTrip apps.',
    sectionIds: TERMS_AND_CONDITIONS_SECTION_IDS,
    showSectionNav: true,
  },
  {
    slug: 'privacy-policy',
    aliases: ['privacy'],
    title: 'Privacy Policy',
    subtitle: 'How TrumiTrip collects, uses, and protects your personal information.',
    sectionIds: ['privacy'],
  },
];

export const getPolicyPage = (pathname) => {
  const slug = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  return POLICY_PAGES.find(
    (page) => page.slug === slug || (page.aliases || []).includes(slug),
  ) || null;
};

export const getPolicyPageSections = (page) => getTermsSectionsByIds(page.sectionIds);

export const OTHER_POLICY_LINKS = (currentSlug) =>
  POLICY_PAGES.filter((page) => page.slug !== currentSlug);
