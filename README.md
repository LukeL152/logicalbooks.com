# Logical Books Website

A simple, multi-page static website for a bookkeeping firm. It uses a black-and-gold palette for a professional feel, is mobile-first and SEO-friendly, and can be hosted on any free static host.

## Overview
- Pages: `index.html`, `about.html`, `services.html`, `faq.html`, `contact.html`, `intake.html`
- Assets: `assets/css/styles.css`, `assets/js/main.js`, `assets/js/form.js`, `assets/js/intake.js`, `assets/img/favicon.svg`
- Extras: `robots.txt`, `sitemap.xml`

## Customize
- Firm details: Update address, phone, email in the footer of each page and in `index.html` JSON-LD.
- Branding: Change the logo at `assets/img/favicon.svg` and the brand text in the header.
- Palette: Adjust CSS variables in `assets/css/styles.css` under `:root`.
- Copy: Edit the content in each HTML file (plain text, no build step).

## Forms (contact + intake)
Both `contact.html` and `intake.html` use lightweight client‑side handlers that open the visitor’s email client with a prefilled message via `mailto:`:

- Contact: `assets/js/form.js`
- Intake: `assets/js/intake.js`

Default recipient is `info@logicalbooks.com`. Update in both files if needed.

If you prefer to capture submissions without relying on the visitor’s mail client, replace these handlers with your provider (e.g., Formspree, Netlify Forms) and set a proper `action` + `method`. Netlify Forms also works without JS by adding `netlify` attributes on the `<form>`.

## Run locally
- Option 1: Double-click `index.html` to open in your browser.
- Option 2: Serve the folder (recommended for testing relative links):
  - Python: `python3 -m http.server 8080`
  - Node (if installed): `npx serve .`

Then visit `http://localhost:8080`.

## Deploy
Any static host works. Popular free options:
- GitHub Pages: Push this folder to a repo, enable Pages (deploy from `main` branch, `/root`).
- Netlify: Drag-and-drop the folder or connect the repo; no build command needed.
- Cloudflare Pages / Vercel: New project → import repo → no build → output directory `/.`.

## SEO notes
- Each page has a unique `<title>` and meta description.
- `index.html` includes Organization schema via JSON-LD.
- `robots.txt` and `sitemap.xml` are included with relative URLs.

## Accessibility
- Semantic headings, labeled controls, focus styles, and a skip link.
- Mobile menu uses `aria-expanded` and supports keyboard interaction.

## License
Content and assets in this repo are provided for your business use. Replace placeholder contact information before going live.
