#!/usr/bin/env node
/**
 * Static-site builder for the "Corporate" template.
 * Each src/pages/*.html file starts with a JSON block inside <!--meta ... --> and is wrapped with the
 * shared layout below. Output goes to public/ with RELATIVE links, so the site works at a domain root,
 * in a sub-folder (e.g. GitHub Pages /repo/) and when opened straight from the folder.
 *
 *   npm run build
 */
const fs = require('fs');
const path = require('path');
const site = require('./src/site.config.js');
const services = require('./src/services-data.js');

const SRC = path.join(__dirname, 'src', 'pages');
const OUT = path.join(__dirname, 'public');

const nav = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/services/', label: (site.nav && site.nav.services) || 'Services', key: 'services' },
  { href: '/about/', label: (site.nav && site.nav.about) || 'About', key: 'about' },
  { href: '/portfolio/', label: (site.nav && site.nav.portfolio) || 'Gallery', key: 'portfolio' },
  { href: '/contact/', label: 'Contact', key: 'contact' },
];

const icon = (name) => `<svg class="i" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const SPRITE = fs.readFileSync(path.join(OUT, 'assets', 'img', 'icons.svg'), 'utf8')
  .replace(/<\?xml[^>]*>/, '').replace(/<symbol id="/g, '<symbol id="i-')
  .replace('<svg ', '<svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden" ');
const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`;

function relativize(html, rel) {
  return html.replace(/(\s(?:href|src)=")\/(?!\/)([^"]*)"/g, (m, attr, p) => {
    const hashAt = p.indexOf('#'); const hash = hashAt >= 0 ? p.slice(hashAt) : ''; const rest = hashAt >= 0 ? p.slice(0, hashAt) : p;
    const qAt = rest.indexOf('?'); const query = qAt >= 0 ? rest.slice(qAt) : ''; let file = qAt >= 0 ? rest.slice(0, qAt) : rest;
    if (file === '' || file.endsWith('/')) file += 'index.html';
    return `${attr}${rel}${file}${query}${hash}"`;
  });
}

/* ---------- Shared components ---------- */
function header(active) {
  const links = nav.map((n) => `<li><a href="${n.href}" class="nav-link${n.key === active ? ' is-active' : ''}"${n.key === active ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('');
  return `
<a class="skip-link" href="#main">Skip to content</a>
<div class="topbar">
  <div class="container topbar-inner">
    <span>${icon('pin')} ${site.addressLine}</span>
    <span class="topbar-right">
      <a href="${site.phoneHref}">${icon('phone')} ${site.phone}</a>
      ${site.hoursShort ? `<span>${icon('clock')} ${site.hoursShort}</span>` : ''}
      ${site.email ? `<a href="mailto:${site.email}">${icon('mail')} ${site.email}</a>` : ''}
    </span>
  </div>
</div>
<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="brand" aria-label="${site.name} – home">
      <img src="${site.logoHeader || '/assets/img/logo-mark.svg'}" alt="" width="44" height="44" style="object-fit:contain">
      <span class="brand-text">${site.shortName}<small>${site.brandSub}</small></span>
    </a>
    <nav aria-label="Main">
      <ul class="nav-links" id="nav-menu">${links}
        <li class="nav-mobile-cta"><a href="${site.phoneHref}" class="btn btn-primary btn-block">${icon('phone')}<span>Call ${site.phone}</span></a></li>
      </ul>
    </nav>
    <div class="header-actions">
      <a href="${site.phoneHref}" class="header-call">${icon('phone')}<span><small>Call us</small>${site.phone}</span></a>
      <a href="${site.headerCtaHref || '/contact/#quote'}" class="btn btn-primary btn-sm header-cta"${site.headerCtaHref ? ' target="_blank" rel="noopener"' : ''}>${site.headerCta || 'Get a quote'}</a>
      <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

function ctaBand() {
  return `
<section class="cta-strip">
  <div class="container cta-strip-inner">
    <div>
      <h2>${site.ctaTitle}</h2>
      <p>${site.ctaText}</p>
    </div>
    <div class="cta-strip-actions">
      <a href="${site.phoneHref}" class="btn btn-white">${icon('phone')}<span>${site.phone}</span></a>
      <a href="/contact/#quote" class="btn btn-outline-white"><span>${site.ctaButton || 'Request a quote'}</span>${icon('arrow')}</a>
    </div>
  </div>
</section>`;
}

function footer() {
  const year = new Date().getFullYear();
  return `
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-about">
      <a href="/" class="brand brand-light">${site.logoFooter ? `<img src="${site.logoFooter}" alt="${site.name}" width="190" height="61" loading="lazy" style="width:190px;height:auto">` : `<img src="/assets/img/logo-mark.svg" alt="" width="40" height="40" loading="lazy"><span class="brand-text">${site.name}<small>${site.brandSub}</small></span>`}</a>
      <p>${site.footerAbout}</p>
      ${site.license ? `<p class="license">${icon('license')} License ${site.license}</p>` : ''}
    </div>
    <div>
      <h3>Company</h3>
      <ul>${nav.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h3>Services</h3>
      <ul>${services.map((s) => `<li><a href="/services/#${s.id}">${s.title}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h3>Contact</h3>
      <ul class="footer-contact">
        <li>${icon('phone')}<a href="${site.phoneHref}">${site.phone}</a></li>
        ${site.email ? `<li>${icon('mail')}<a href="mailto:${site.email}">${site.email}</a></li>` : ''}
        ${site.fax ? `<li>${icon('phone')}<span>Fax ${site.fax}</span></li>` : ''}
        <li>${icon('pin')}<a href="${mapsLink}" target="_blank" rel="noopener">${site.addressLine}</a></li>
        ${site.hoursShort ? `<li>${icon('clock')}<span>${site.hoursShort}</span></li>` : ''}
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <p>© ${year} ${site.name}. All rights reserved.${site.trademarkNote ? `<br><small class="tm">${site.trademarkNote}</small>` : ''}</p>
      <p><a href="${site.yell}" target="_blank" rel="noopener">Find us on ${site.reviewSiteName || 'Yell'}</a> · <a href="#main">Back to top</a></p>
    </div>
  </div>
</footer>
${site.whatsapp ? '' : `<a href="${site.phoneHref}" class="call-fab" aria-label="Call ${site.phone}">${icon('phone')}</a>`}
<div id="chatbot-root"></div>`;
}

function layout(meta, body) {
  const url = site.url + meta.path;
  const img = site.url + '/assets/img/og-image.jpg';
  const ld = {
    '@context': 'https://schema.org', '@type': site.schemaType, name: site.name, description: site.schemaDescription,
    url: site.url, telephone: site.phoneIntl, ...(site.email ? { email: site.email } : {}),
    ...(site.openingHoursSchema ? { openingHours: site.openingHoursSchema } : {}), areaServed: site.area,
    address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, ...(site.address.region ? { addressRegion: site.address.region } : {}), postalCode: site.address.postcode, addressCountry: site.address.country || 'GB' },
    ...(site.license ? { hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: 'license', name: `Texas ACR License ${site.license}` } } : {}),
    image: img, sameAs: site.socials.map((s) => s.url),
  };
  return `<!doctype html>
<html lang="${site.lang || 'en-GB'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#0b1f3a">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="og:locale" content="${site.locale || 'en_GB'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${meta.title}">
<meta name="twitter:description" content="${meta.description}">
<meta name="twitter:image" content="${img}">
<link rel="icon" href="${site.favicon || '/assets/img/logo-mark.svg'}" type="${(site.favicon || '').endsWith('.png') ? 'image/png' : 'image/svg+xml'}">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
${meta.preload ? `<link rel="preload" as="image" href="${meta.preload}">` : ''}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script defer src="/assets/js/site-config.js"></script>
<script defer src="/assets/js/main.js"></script>
<script defer src="/assets/js/chatbot.js"></script>
</head>
<body class="page-${meta.key}">
${SPRITE}
${header(meta.key)}
<main id="main">
${body.trim()}
</main>
${meta.key === 'contact' || meta.key === 'notfound' ? '' : ctaBand()}
${footer()}
</body>
</html>
`;
}

/* ---------- Page snippets ---------- */
const priceTag = (s) => (s.price ? `<span class="price">${s.price}</span>` : '');
const serviceCards = services.map((s) => `
      <article class="svc-card reveal">
        <a href="/services/#${s.id}" class="svc-card-media"><img src="/assets/img/${s.img}.webp" alt="${s.alt}" loading="lazy"></a>
        <div class="svc-card-body">
          <span class="svc-ic">${icon(s.icon)}</span>
          <h3><a href="/services/#${s.id}">${s.title}</a></h3>
          <p>${s.intro}</p>
          <div class="svc-card-foot">${priceTag(s)}<a href="/services/#${s.id}" class="text-link">What’s included ${icon('arrow')}</a></div>
        </div>
      </article>`).join('');
const serviceDetails = services.map((s, i) => `
    <article class="svc-detail reveal" id="${s.id}">
      <div class="svc-detail-media"><img src="/assets/img/${s.img}.webp" alt="${s.alt}" loading="lazy"></div>
      <div class="svc-detail-body">
        <span class="eyebrow">Service ${String(i + 1).padStart(2, '0')}</span>
        <h2>${s.title} ${priceTag(s)}</h2>
        <p class="lead">${s.intro}</p>
        <h3 class="included">What’s included</h3>
        <ul class="checks">${s.points.map((p) => `<li>${icon('check')}${p}</li>`).join('')}</ul>
        <div class="btn-row">
          ${site.bookingUrl ? `<a href="${site.bookingUrl}" target="_blank" rel="noopener" class="btn btn-primary">${icon('calendar')}<span>Book a room</span>${icon('arrow')}</a>` : `<a href="/contact/?service=${s.id}#quote" class="btn btn-primary"><span>Enquire about this</span>${icon('arrow')}</a>`}
          <a href="${site.phoneHref}" class="btn btn-outline">${icon('phone')}<span>${site.phone}</span></a>
        </div>
      </div>
    </article>`).join('');
const serviceOptions = services.map((s) => `<option value="${s.id}">${s.title}</option>`).join('');

function render(str) {
  return str
    .replace(/\{\{serviceCards\}\}/g, serviceCards)
    .replace(/\{\{serviceDetails\}\}/g, serviceDetails)
    .replace(/\{\{serviceOptions\}\}/g, serviceOptions)
    .replace(/\{\{mapsLink\}\}/g, mapsLink)
    .replace(/\{\{icon:([\w-]+)\}\}/g, (_, n) => icon(n))
    .replace(/\{\{site\.(\w+)\}\}/g, (_, k) => site[k]);
}

/* ---------- Build ---------- */
const pages = [];
for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.html'))) {
  const raw = fs.readFileSync(path.join(SRC, file), 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->/);
  if (!m) throw new Error(`Missing meta block in ${file}`);
  const meta = JSON.parse(m[1]);
  const depth = meta.path === '/' || meta.path === '/404' ? 0 : meta.path.split('/').filter(Boolean).length;
  const rel = '../'.repeat(depth);
  const html = relativize(layout(meta, render(raw.slice(m[0].length))), rel)
    .replace('<head>', `<head>\n<script>window.SITE_BASE = ${JSON.stringify(rel)};</script>`);
  const outFile = meta.path === '/' ? path.join(OUT, 'index.html')
    : meta.path === '/404' ? path.join(OUT, '404.html')
    : path.join(OUT, meta.path, 'index.html');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  if (meta.path !== '/404') pages.push(meta);
  console.log('built', path.relative(__dirname, outFile));
}
const today = new Date().toISOString().slice(0, 10);
const order = ['/', '/services/', '/about/', '/portfolio/', '/contact/'];
pages.sort((a, b) => order.indexOf(a.path) - order.indexOf(b.path));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${site.url}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.path === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({ name: site.name, short_name: site.manifestShort || site.shortName, start_url: './', display: 'standalone', background_color: '#ffffff', theme_color: '#0b1f3a', icons: [{ src: (site.favicon || '/assets/img/logo-mark.svg').replace(/^\//, ''), sizes: 'any', type: (site.favicon || '').endsWith('.png') ? 'image/png' : 'image/svg+xml' }] }) + '\n');
fs.writeFileSync(path.join(OUT, 'assets', 'js', 'site-config.js'), `window.SITE = ${JSON.stringify({
  name: site.name, shortName: site.shortName, addressLine: site.addressLine, openFrom: site.openFrom, openTo: site.openTo,
  phone: site.phone, phoneHref: site.phoneHref, email: site.email, whatsapp: site.whatsapp, whatsappNumber: site.whatsappNumber,
  area: site.area, hours: site.hours, hoursLabel: site.hoursLabel, formEndpoint: site.formEndpoint, yell: site.yell, bookingUrl: site.bookingUrl || '', email2: site.email2 || '', contactName: site.contactName || '', fax: site.fax || '',
  services: services.map(({ id, title, intro }) => ({ id, title, short: intro.split(/(?<=[.?!])\s/)[0] })),
}, null, 2)};\n`);
console.log('built sitemap.xml, robots.txt, site.webmanifest, site-config.js');
