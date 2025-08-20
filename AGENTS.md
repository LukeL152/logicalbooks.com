# Agents Guide: Logical Books Site

This repo contains a small static site implemented as a hash‑based SPA. It serves HTML templates from `assets/templates/*` into `<main>` via a client‑side router, with simple, accessible UI and Netlify‑friendly deployment.

## Current Status
- Architecture: Static SPA using hash routes (e.g., `#/about`). Templates live in `assets/templates/`. Navigation and skeleton loading handled in `assets/js/router.js` and `assets/js/main.js`.
- Pages: Home, About, Services, FAQs, Contact, Intake, Thank You (`home.html`, `about.html`, `services.html`, `faq.html`, `contact.html`, `intake.html`, `thanks.html`).
- Forms: Contact and Intake forms use lightweight JS handlers that POST to Netlify Forms endpoints (hidden forms included in `index.html`). In local dev, non‑200 POSTs are treated as success to simulate form handling.
- Styling: Single stylesheet at `assets/css/styles.css` with CSS variables, responsive layout, focus styles, and basic skeleton UI.
- Assets: Minimal SVG favicon, no large media. Social share image not yet defined.
- Dev UX: `dev-server.js` provides a zero‑dep HTTP server with SPA fallback and live reload stub (`assets/js/livereload.js`). NPM scripts: `dev` (Python) and `dev:node` (Node).
- Deployment: Netlify compatible (`netlify.toml`), plus `_redirects` mapping pretty paths (`/about`) to SPA hash routes. Site can be hosted by any static host.
- SEO/Meta: Per‑route titles set by router; `index.html` includes meta description, canonical, JSON‑LD `ProfessionalService`, robots and sitemap present.
- Accessibility: Semantic markup, labeled controls, keyboard‑friendly mobile nav, skip link, and focus management on route change.

## How To Run
- Local: `npm run dev` (Python) or `npm run dev:node` (Node), then open `http://localhost:8080`.
- Note: Opening `index.html` via `file://` will not load templates; use an HTTP server.

## Key Files
- `index.html`: Shell document, metadata, header/footer, hidden Netlify forms.
- `assets/js/router.js`: Hash router, template loader, titles, skeleton UI, and hooks.
- `assets/js/main.js`: Nav toggle, active link handling, footer year.
- `assets/js/form.js` / `assets/js/intake.js`: Contact and intake form handlers posting to Netlify.
- `assets/templates/*`: Page content partials injected into `<main>`.
- `assets/css/styles.css`: Site styles and variables.
- `_redirects`, `netlify.toml`, `robots.txt`, `sitemap.xml`: Hosting and SEO config.

## Assumptions/Decisions
- Keep site purely static for simplicity and cost; prefer Netlify Forms for submissions over bespoke backends.
- Use hash routing to avoid server‑side rewrites on generic static hosts.
- Minimal JS and no build step to ease maintenance.

## Brand Palette
- Primary background: `#003654` (deep navy)
- Panel/background: `#A8DADC` (light teal)
- Primary accent: `#F5BD02` (gold; buttons, highlights)
- Supporting accent: `#E76F51` (coral; subtle shadows/accents)
- Border/secondary: `#3A668C` (cool blue; borders, focus rings)
- Neutral dark: `#303941` (subtle button borders)

Guidelines:
- Buttons: Gold base with a very subtle vertical gradient; coral‑tinted hover shadow for warmth. Text on buttons uses navy for contrast.
- Nav active state: Gold background with navy text.
- Panels: Light teal cards with blue borders on a deep navy body.
- Accessibility: Focus rings use `#3A668C`; body text remains light on dark for contrast.

## Recommended Next Steps
1) Launch Readiness
- Content polish: Finalize copy, services list, pricing signals, and FAQs.
- Legal pages: Add `privacy.html` and `terms.html`; link in footer.
- Contact details: Verify phone, email, and address across templates and JSON‑LD.
- Analytics: Add GA4 or Plausible via a small async script include.
- Social preview: Add an `og:image` and Twitter image; include meta tags.

2) Forms & Lead Capture
- Confirm Netlify Forms submissions are appearing in the dashboard; consider email notifications and spam protection (honeypot is present; optionally add ReCAPTCHA/hCaptcha).
- Add a simple success/error UI state to forms before redirecting to `#/thanks`.
- Optionally switch to a provider like Formspree if not using Netlify.

3) SEO & Schema
- Add FAQPage structured data for the FAQs template.
- Ensure each route has a distinct meta description injected or baked into templates (router sets titles already).
- Create dedicated 404 page (`404.html`) that loads the SPA shell and routes to home.

4) Performance
- Add basic asset minification (CSS/JS) or precompress on deploy if needed; keep zero‑build as a goal, but consider a tiny build step if size grows.
- Optimize images and add additional favicon sizes and a web manifest if targeting PWA features.

5) Accessibility & QA
- Run an a11y pass (Lighthouse/axe) and address color contrast, focus order, and form labeling.
- Add a link checker (e.g., `lychee` or `html-validate`) as a local script to catch broken links.

6) Ops & Workflow
- Set up Netlify (or Pages) CI from the repository for automatic deploys.
- Gate production deploys on a quick check (build‑less, but run link/a11y checks in CI).

7) Future Enhancements
- Testimonials/case studies section and a lightweight blog or “insights” page (can be static templates for now).
- Simple scheduling CTA integration (e.g., Calendly) on Contact and Intake pages.
- Consider prerendering static HTML per route (non‑hash paths) if SEO requires it, with redirects maintained for backwards compatibility.

Questions for the Owner
- Which analytics and form provider do you prefer?
- Do you need a blog or resources section at launch?
- Any geographic focus for `areaServed` in JSON‑LD beyond US?
