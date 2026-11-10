# Glasstra Group LLC – website

## Quick start (no tools needed)
The `website/` folder is the full site, with every file at the top level and no sub-folders:
index.html, about.html, services.html, gallery.html, contact.html, 404.html,
styles.css, main.js, chatbot.js, site-config.js, the images, site.webmanifest, robots.txt and sitemap.xml.

- **Open locally:** double-click `index.html`.
- **GitHub + Vercel:** upload ALL files from `website/` (or the WEBSITE zip) to the TOP of the repository, not inside a folder. In Vercel choose Framework Preset "Other", with no build command and no output directory.
- **Netlify:** drag the `website` folder onto app.netlify.com/drop.
- **cPanel:** upload all files into `public_html`.

## Contact form
The form sends to info@glasstra.com through FormSubmit. The first time it is used, FormSubmit sends an
activation email to info@glasstra.com, and you must click "Activate" once. To change the address, edit `site-config.js`.

## Please confirm with the client
- The photos and logo come from glasstrapr.com. Confirm that Glasstra owns them and approves their use.
- The site says "registered federal contractor" only. If they hold WOSB, 8(a), HUBZone or other certifications, add them on about.html.
- The NAICS codes are listed on about.html; check that they are current.
- The domain is assumed to be www.glasstrapr.com. If it is different, update the canonical, sitemap and robots URLs.
- A Spanish version can be added on request.

## Editing (optional, needs Node.js)
Sources are in `src/` (pages, site.config.js, services-data.js) and `public/assets/`.
Run `npm run build` and then `node flatten.js` to regenerate `website/`. The `server.js` file adds an optional live AI chat (needs ANTHROPIC_API_KEY).
