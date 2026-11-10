/**
 * Business details – Glasstra Group LLC.
 * Sources: details supplied by the client; the company's own website (glasstrapr.com: services, projects, hours,
 * social links, logo and project photos); PR Federal Contracting Center capability statement (since 1978,
 * curtain walls, storefronts, windows, doors, skylights, railings, interior systems; NAICS codes).
 * Edit here, then run `npm run build` and `node flatten.js`. Items marked CONFIRM should be checked with the client.
 */
module.exports = {
  name: 'Glasstra Group LLC',
  shortName: 'Glasstra Group',
  brandSub: 'Architectural Glass & Aluminum',
  logoHeader: '/assets/img/glasstra-mark.png',
  logoFooter: '/assets/img/glasstra-logo.png',
  favicon: '/assets/img/glasstra-mark.png',
  lang: 'en-US',
  locale: 'en_US',
  phoneFormat: 'US',
  url: 'https://www.glasstrapr.com', // their current domain – CONFIRM
  area: 'Puerto Rico & international projects',
  phone: '(787) 788-5658',
  phoneIntl: '+17877885658',
  phoneHref: 'tel:+17877885658',
  fax: '(787) 788-5070',
  whatsapp: '',
  whatsappNumber: '',
  address: { street: 'Carr. 869, Lot 69, Las Palmas Industrial Park', city: 'Cataño', region: 'PR', postcode: '00962', country: 'US' },
  addressLine: 'Carr. 869, Lot 69, Las Palmas Industrial Park, Cataño, PR 00962',
  mapQuery: 'Zona Industrial Las Palmas, Carr 869, Cataño, PR 00962',
  yell: 'https://www.linkedin.com/company/glasstra-llc',
  reviewSiteName: 'LinkedIn',
  hours: [['Monday – Friday', '8:00 AM – 5:00 PM'], ['Saturday – Sunday', 'Closed']],
  openFrom: 8, openTo: 17,
  hoursShort: 'Mon–Fri 8:00 AM – 5:00 PM',
  hoursLabel: 'Monday to Friday, 8 AM to 5 PM',
  openingHoursSchema: 'Mo-Fr 08:00-17:00',
  schemaType: 'GeneralContractor',
  schemaDescription: 'Puerto Rico glass and glazing contractor since 1978: design, manufacture and installation of curtain walls, storefronts, windows, doors, skylights, railings and interior glass systems.',
  footerAbout: 'Glass and glazing contractor in Puerto Rico since 1978. We design, manufacture and install architectural glass and aluminum systems for commercial, industrial, institutional and residential buildings.',
  ctaTitle: 'Have a project in mind?',
  ctaText: 'Send us your plans or specifications and one of our project managers will get in touch.',
  ctaButton: 'Request a proposal',
  headerCta: 'Request a proposal',
  manifestShort: 'Glasstra',
  license: '',
  contactName: 'Julie Martinez',
  nav: { services: 'Products & Services', about: 'About', portfolio: 'Projects' },

  // Proposal requests are emailed here via FormSubmit (formsubmit.co). The FIRST submission sends a one-time
  // activation email to this inbox – click the link in it once.
  email: 'info@glasstra.com',
  email2: 'jamartinez@glasstra.com',
  formEndpoint: null,

  socials: [
    { label: 'Glasstra on Facebook', icon: 'facebook', url: 'https://www.facebook.com/glasstrallc' },
    { label: 'Glasstra on Instagram', icon: 'instagram', url: 'https://www.instagram.com/glasstra.llc' },
    { label: 'Glasstra on LinkedIn', icon: 'linkedin', url: 'https://www.linkedin.com/company/glasstra-llc' },
  ],
};
if (!module.exports.formEndpoint && module.exports.email) {
  module.exports.formEndpoint = 'https://formsubmit.co/ajax/' + module.exports.email;
}
