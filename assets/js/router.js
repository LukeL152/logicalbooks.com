// Simple hash-based SPA router that swaps page content into <main id="main">
(function () {
  const routes = {
    '/': 'home.html',
    '/about': 'about.html',
    '/services': 'services.html',
    '/faq': 'faq.html',
    '/contact': 'contact.html',
    '/intake': 'intake.html',
    '/thanks': 'thanks.html',
    '/privacy': 'privacy.html',
    '/terms': 'terms.html',
    '/testimonials': 'testimonials.html',
    '/insights': 'insights.html',
    '/insights/cash-vs-accrual': 'post-cash-vs-accrual.html',
    '/insights/when-to-hire-a-bookkeeper': 'post-when-to-hire.html',
    '/insights/cash-runway-forecast': 'post-cash-runway.html',
    '/insights/read-your-p-and-l': 'post-read-p-and-l.html',
    '/insights/pay-yourself-correctly': 'post-pay-yourself.html'
  };

  const titles = {
    '/': 'Logical Books | Professional Bookkeeping & Small Business Accounting',
    '/about': 'About | Logical Books',
    '/services': 'Services | Logical Books',
    '/faq': 'FAQs | Logical Books',
    '/contact': 'Contact | Logical Books',
    '/intake': 'Client Intake | Logical Books',
    '/thanks': 'Thank You | Logical Books',
    '/privacy': 'Privacy Policy | Logical Books',
    '/terms': 'Terms of Service | Logical Books',
    '/testimonials': 'Testimonials | Logical Books',
    '/insights': 'Insights | Logical Books',
    '/insights/cash-vs-accrual': 'Cash vs. Accrual Accounting | Insights | Logical Books',
    '/insights/when-to-hire-a-bookkeeper': 'When to Hire a Bookkeeper | Insights | Logical Books',
    '/insights/cash-runway-forecast': 'Build a Cash Runway Forecast | Insights | Logical Books',
    '/insights/read-your-p-and-l': 'How to Read Your P&L and Balance Sheet | Insights | Logical Books',
    '/insights/pay-yourself-correctly': 'Pay Yourself the Right Way | Insights | Logical Books'
  };

  const descriptions = {
    '/': 'Logical Books helps small businesses with accurate bookkeeping, decision-ready financial insights, and year‑end ready records.',
    '/about': 'Learn about Logical Books, our approach to bookkeeping, and how we support small business owners.',
    '/services': 'Monthly bookkeeping, catch-up projects, and decision-ready financial reporting tailored to your business.',
    '/faq': 'Common questions about pricing, onboarding, software, working with your CPA, and catch‑up projects.',
    '/contact': 'Get in touch with Logical Books for a free consultation or to ask a question.',
    '/intake': 'Share details about your business so we can recommend the right bookkeeping plan.',
    '/thanks': 'Thanks for reaching out to Logical Books. We will get back to you shortly.',
    '/privacy': 'Read Logical Books’ privacy policy covering data collection, use, and your choices.',
    '/terms': 'Read the terms of service for using Logical Books’ website and services.',
    '/testimonials': 'See what clients say about Logical Books and the impact of our bookkeeping.',
    '/insights': 'Practical bookkeeping tips and small business finance guides from Logical Books.',
    '/insights/cash-vs-accrual': 'Understand the difference between cash and accrual accounting and which is right for your business.',
    '/insights/when-to-hire-a-bookkeeper': 'Key signs it’s time to bring on a professional bookkeeper.',
    '/insights/cash-runway-forecast': 'Four steps to estimate your months of cash and extend runway.',
    '/insights/read-your-p-and-l': 'A founder’s guide to reading your P&L and balance sheet with confidence.',
    '/insights/pay-yourself-correctly': 'Owner draw vs salary vs distributions—keep compensation clean and compliant.'
  };

  const images = {
    '/': 'assets/img/social-default.svg',
    '/about': 'assets/img/social-default.svg',
    '/services': 'assets/img/social-default.svg',
    '/faq': 'assets/img/insights-faq.svg',
    '/contact': 'assets/img/social-default.svg',
    '/intake': 'assets/img/social-default.svg',
    '/thanks': 'assets/img/social-default.svg',
    '/privacy': 'assets/img/social-default.svg',
    '/terms': 'assets/img/social-default.svg',
    '/testimonials': 'assets/img/insights-testimonials.svg',
    '/insights': 'assets/img/insights-default.svg',
    '/insights/cash-vs-accrual': 'assets/img/insights-cash-vs-accrual.svg',
    '/insights/when-to-hire-a-bookkeeper': 'assets/img/insights-when-to-hire.svg',
    '/insights/cash-runway-forecast': 'assets/img/insights-cash-runway.svg',
    '/insights/read-your-p-and-l': 'assets/img/insights-read-p-and-l.svg',
    '/insights/pay-yourself-correctly': 'assets/img/insights-pay-yourself.svg'
  };

  const main = document.getElementById('main');
  if (!main) return;

  async function load(route) {
    const file = routes[route] || routes['/'];
    try {
      // Start loading state and show a lightweight skeleton
      main.classList.add('is-loading');
      main.innerHTML = skeletonFor(route);
      if (location.protocol === 'file:') {
        throw new Error('Local file protocol detected. Please serve over http://localhost to load templates.');
      }
      const res = await fetch(`assets/templates/${file}`, { cache: 'no-cache' });
      const html = await res.text();
      // Inject content
      main.innerHTML = html;
      // Update document title
      document.title = titles[route] || titles['/'];
      // Update meta description for SEO
      setMetaDescription(descriptions[route] || descriptions['/']);
      // Update social meta (Open Graph / Twitter)
      setSocialMeta({
        title: titles[route] || titles['/'],
        description: descriptions[route] || descriptions['/'],
        image: toAbsolute(images[route] || images['/'])
      });
      // Send GA4 page_view for SPA navigation
      sendPageView(route);
      // Highlight nav link
      highlight(route);
      // Attach form handlers if available
      if (typeof window.attachContactFormHandler === 'function') window.attachContactFormHandler();
      if (typeof window.attachIntakeFormHandler === 'function') window.attachIntakeFormHandler();
      // Focus first heading for accessibility
      const heading = main.querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      // Dispatch a hook for any other initializers
      document.dispatchEvent(new CustomEvent('spa:navigated', { detail: { route } }));
      // Scroll to top on navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Simple fade in
      setTimeout(() => main.classList.remove('is-loading'), 60);
    } catch (e) {
      console.error('Failed to load route', route, e);
      main.innerHTML = `
        <section class="section">
          <div class="container">
            <h2>Unable to load content</h2>
            <p>To view the SPA locally, please run a local server (for example: <code>python3 -m http.server 8080</code>) and open <code>http://localhost:8080/</code>. Directly opening <code>index.html</code> from the file system blocks template loading.</p>
            <p>If this is on production and you still see this, please check network requests to <code>assets/templates/*</code>.</p>
          </div>
        </section>`;
      main.classList.remove('is-loading');
    }
  }

  function parseRoute() {
    const hash = location.hash || '#/';
    const path = hash.replace(/^#/, '');
    return path.split('?')[0];
  }

  function highlight(route) {
    document.querySelectorAll('#site-nav a').forEach(a => a.classList.remove('active'));
    const sel = `#site-nav a[href="#${route}"]`;
    const link = document.querySelector(sel) || document.querySelector('#site-nav a[href="#/"]');
    if (link) link.classList.add('active');
  }

  window.addEventListener('hashchange', () => load(parseRoute()));
  // Initial load
  load(parseRoute());

  // Prefetch other routes to improve perceived performance
  window.addEventListener('load', () => {
    Object.entries(routes).forEach(([r, f]) => {
      // Skip current route
      if (r === parseRoute()) return;
      fetch(`assets/templates/${f}`).catch(() => {});
    });
  });

  // Very small skeleton generator for perceived performance
  function skeletonFor(route) {
    const cards = `
      <div class="grid-3">
        <div class="card skeleton-card"></div>
        <div class="card skeleton-card"></div>
        <div class="card skeleton-card"></div>
      </div>`;
    const lines = `
      <div class="skeleton-line" style="width: 60%"></div>
      <div class="skeleton-line" style="width: 90%"></div>
      <div class="skeleton-line" style="width: 80%"></div>`;
    const hero = `
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="skeleton-line" style="height: 2.2rem; width: 55%"></div>
            <div class="skeleton-line" style="width: 70%"></div>
            <div class="skeleton-line" style="width: 40%"></div>
          </div>
        </div>
      </section>`;
    const section = `
      <section class="section">
        <div class="container">
          ${lines}
          <div style="height: 12px"></div>
          ${cards}
        </div>
      </section>`;
    return hero + section;
  }

  function setMetaDescription(text) {
    if (!text) return;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', text);
  }

  function setSocialMeta({ title, description, image }) {
    setOrCreate('meta[property="og:title"]', 'property', 'og:title', 'content', title);
    setOrCreate('meta[property="og:description"]', 'property', 'og:description', 'content', description);
    setOrCreate('meta[property="og:image"]', 'property', 'og:image', 'content', image);
    setOrCreate('meta[name="twitter:title"]', 'name', 'twitter:title', 'content', title);
    setOrCreate('meta[name="twitter:description"]', 'name', 'twitter:description', 'content', description);
    setOrCreate('meta[name="twitter:image"]', 'name', 'twitter:image', 'content', image);
  }

  function setOrCreate(selector, keyName, keyValue, valueName, value) {
    let tag = document.querySelector(selector);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(keyName, keyValue);
      document.head.appendChild(tag);
    }
    if (value) tag.setAttribute(valueName, value);
  }

  function toAbsolute(url) {
    try {
      return new URL(url, location.origin).toString();
    } catch (_) {
      return url;
    }
  }

  function sendPageView(route) {
    const title = titles[route] || titles['/'];
    const prettyPath = route; // Use clean path (no hash)
    const locationUrl = new URL(prettyPath.replace(/^\/?/, '/'), location.origin).toString();
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: locationUrl,
        page_path: prettyPath
      });
    }
  }
})();
