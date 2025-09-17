// Lightweight client-side handler that supports Netlify Forms and a custom endpoint
window.attachContactFormHandler = function attachContactFormHandler() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  if (form.__attached) return; // avoid duplicate listeners
  form.__attached = true;
  const status = form.querySelector('.form-status');
  const SUBJECT_TAG = '[Logical Books Contact]';
  const cfg = (window.APP_CONFIG && window.APP_CONFIG.FORMS) || {};

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    const service = (data.get('service') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();
    const botField = (data.get('bot-field') || '').toString().trim();

    if (!name || !email || !message) {
      if (status) status.textContent = 'Please complete required fields.';
      return;
    }

    // Honeypot: if filled, silently succeed
    if (botField) {
      form.reset();
      location.hash = '#/thanks?form=contact&ok=1';
      return;
    }

    if (status) status.textContent = 'Sending…';

    const provider = (cfg.provider || 'netlify').toLowerCase();

    if (provider === 'netlify') {
      // Submit to Netlify Forms via fetch (AJAX)
      const payload = new URLSearchParams();
      payload.set('form-name', 'contact');
      for (const [k, v] of data.entries()) {
        payload.append(k, String(v));
      }
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: payload.toString()
      }).then((resp) => {
        if (resp.ok) {
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'generate_lead', { form_name: 'contact', method: 'Netlify Forms' });
          }
          form.reset();
          location.hash = '#/thanks?form=contact';
        } else if ((resp.status === 501 || resp.status === 405) && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
          // Local Python server returns 501/405 for POST. Simulate success in dev.
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'generate_lead', { form_name: 'contact', method: 'dev-simulated' });
          }
          form.reset();
          location.hash = '#/thanks?form=contact&dev=1';
        } else {
          throw new Error('Network response not ok');
        }
      }).catch(() => {
        if (status) status.textContent = 'Sorry, something went wrong. Please email info@logicalbooks.com.';
      });
      return;
    }

    // Custom provider (JSON POST)
    const endpoint = (cfg.FORM_ENDPOINT || '').replace(/\/$/, '');
    if (!endpoint) {
      // If not configured, simulate success in local dev; otherwise show error
      const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
      if (isLocal) {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { form_name: 'contact', method: 'dev-simulated' });
        }
        form.reset();
        location.hash = '#/thanks?form=contact&dev=1';
      } else {
        if (status) status.textContent = 'Form endpoint not configured.';
      }
      return;
    }

    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (cfg.AUTH_HEADER && cfg.AUTH_VALUE) headers[cfg.AUTH_HEADER] = cfg.AUTH_VALUE;
    const payload = {
      form: 'contact',
      name, email, phone, service, message,
      source: location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    fetch(`${endpoint}/contact`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }).then(async (resp) => {
      if (resp.ok) {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { form_name: 'contact', method: 'custom' });
        }
        form.reset();
        location.hash = '#/thanks?form=contact';
      } else {
        throw new Error(await resp.text().catch(() => 'Network response not ok'));
      }
    }).catch(() => {
      if (status) status.textContent = 'Sorry, something went wrong. Please email info@logicalbooks.com.';
    });
  });
};

// Initialize on initial page load
window.attachContactFormHandler();
