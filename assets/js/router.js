// Simple hash-based SPA router that swaps page content into <main id="main">
(function () {
  const routes = {
    '/': 'home.html',
    '/about': 'about.html',
    '/services': 'services.html',
    '/faq': 'faq.html',
    '/contact': 'contact.html',
    '/intake': 'intake.html'
  };

  const titles = {
    '/': 'Logical Books | Professional Bookkeeping & Small Business Accounting',
    '/about': 'About | Logical Books',
    '/services': 'Services | Logical Books',
    '/faq': 'FAQs | Logical Books',
    '/contact': 'Contact | Logical Books',
    '/intake': 'Client Intake | Logical Books'
  };

  const main = document.getElementById('main');
  if (!main) return;

  async function load(route) {
    const file = routes[route] || routes['/'];
    try {
      // Simple fade out
      main.classList.add('is-loading');
      const res = await fetch(`assets/templates/${file}`, { cache: 'no-cache' });
      const html = await res.text();
      // Inject content
      main.innerHTML = html;
      // Update document title
      document.title = titles[route] || titles['/'];
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
})();
