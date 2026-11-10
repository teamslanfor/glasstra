#!/usr/bin/env node
/**
 * Make a FLAT copy of the built site (no sub-folders): every page, stylesheet, script and image sits
 * side by side in one folder. This is the simplest possible layout for GitHub + Vercel / Netlify / cPanel.
 *
 *   node flatten.js            -> writes ./website/
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'public');
const OUT = path.join(__dirname, 'website');

const pages = {
  'index.html': 'index.html',
  'about/index.html': 'about.html',
  'services/index.html': 'services.html',
  'portfolio/index.html': 'gallery.html',
  'contact/index.html': 'contact.html',
  '404.html': '404.html',
};
const folderToPage = { about: 'about.html', services: 'services.html', portfolio: 'gallery.html', contact: 'contact.html' };

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Rewrite any internal reference to its flat name.
function flatRef(ref) {
  let r = ref.replace(/^(\.\.\/)+/, '');
  const m = r.match(/^([^?#]*)(.*)$/); let file = m[1]; const tail = m[2];
  if (file.startsWith('assets/')) file = path.basename(file);
  else if (file === '' || file === 'index.html') file = 'index.html';
  else {
    const folder = file.split('/')[0];
    if (folderToPage[folder] && /\/(index\.html)?$/.test(file.slice(folder.length) || '/')) file = folderToPage[folder];
  }
  return file + tail;
}

for (const [from, to] of Object.entries(pages)) {
  let html = fs.readFileSync(path.join(SRC, from), 'utf8');
  html = html.replace(/(\s(?:href|src)=")([^"]*)"/g, (all, attr, ref) => {
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(ref)) return all;
    return attr + flatRef(ref) + '"';
  });
  html = html.replace(/window\.SITE_BASE = "[^"]*";/, 'window.SITE_BASE = "";');
  // absolute URLs used for SEO / social sharing
  html = html.replace(/(https:\/\/[^"]+?)\/assets\/img\//g, '$1/')
    .replace(/(https:\/\/[^"]+?)\/(about|services|portfolio|contact)\/"/g, (a, host, f) => `${host}/${folderToPage[f]}"`);
  fs.writeFileSync(path.join(OUT, to), html);
}

// Assets (css, js, images) -> top level
for (const dir of ['assets/css', 'assets/js', 'assets/img']) {
  for (const f of fs.readdirSync(path.join(SRC, dir))) {
    if (f === 'icons.svg') continue; // icons are inlined into every page
    let data = fs.readFileSync(path.join(SRC, dir, f));
    if (f === 'chatbot.js') data = Buffer.from(data.toString().replace(/services\/index\.html#/g, 'services.html#').replace(/portfolio\/index\.html/g, 'gallery.html').replace(/contact\/index\.html/g, 'contact.html').replace(/about\/index\.html/g, 'about.html'));
    fs.writeFileSync(path.join(OUT, f), data);
  }
}

// Drop images no page uses
const used = new Set();
for (const f of fs.readdirSync(OUT).filter((x) => x.endsWith('.html'))) {
  for (const m of fs.readFileSync(path.join(OUT, f), 'utf8').matchAll(/(?:href|src)="([^"#?:]+\.(?:webp|jpg|png|svg))"/g)) used.add(m[1]);
}
used.add('og-image.jpg'); // used by social sharing previews
for (const f of fs.readdirSync(OUT)) if (/\.(webp|jpg|png|svg)$/.test(f) && !used.has(f)) fs.rmSync(path.join(OUT, f));

// Root files
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'site.webmanifest'), 'utf8'));
manifest.icons = manifest.icons.map((i) => ({ ...i, src: path.basename(i.src) }));
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify(manifest) + '\n');
fs.writeFileSync(path.join(OUT, 'robots.txt'), fs.readFileSync(path.join(SRC, 'robots.txt')));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), fs.readFileSync(path.join(SRC, 'sitemap.xml'), 'utf8')
  .replace(/\/(about|services|portfolio|contact)\/</g, (a, f) => `/${folderToPage[f]}<`));

console.log('flat site written to', path.relative(process.cwd(), OUT), '-', fs.readdirSync(OUT).length, 'files');
