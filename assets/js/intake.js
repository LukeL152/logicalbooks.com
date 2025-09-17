// Intake form handler: supports Netlify Forms and a custom endpoint
window.attachIntakeFormHandler = function attachIntakeFormHandler() {
  const form = document.getElementById('intake-form');
  if (!form) return;
  if (form.__attached) return;
  form.__attached = true;
  const status = form.querySelector('.form-status');
  const SUBJECT_TAG = '[Logical Books Intake]';
  const cfg = (window.APP_CONFIG && window.APP_CONFIG.FORMS) || {};

  function getValues(name) {
    return Array.from(form.querySelectorAll(`[name="${name}"]`))
      .filter(el => (el instanceof HTMLInputElement && (el.type !== 'checkbox' || el.checked)) || !(el instanceof HTMLInputElement))
      .map(el => ('value' in el ? String(el.value || '').trim() : ''))
      .filter(Boolean);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);

    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const company = String(data.get('company') || '').trim();
    const website = String(data.get('website') || '').trim();
    const industry = String(data.get('industry') || '').trim();
    const stage = String(data.get('stage') || '').trim();
    const team = String(data.get('team') || '').trim();
    const services = getValues('services');
    const software = String(data.get('software') || '').trim();
    const transactions = String(data.get('transactions') || '').trim();
    const challenges = String(data.get('challenges') || '').trim();
    const goals = String(data.get('goals') || '').trim();
    const budget = String(data.get('budget') || '').trim();
    const timeline = String(data.get('timeline') || '').trim();
    const referrer = String(data.get('referrer') || '').trim();
    const consent = data.get('consent');
    const botField = (data.get('bot-field') || '').toString().trim();

    if (!name || !email || !challenges || !goals || !consent) {
      if (status) status.textContent = 'Please complete required fields.';
      return;
    }

    // Honeypot: if filled, silently succeed
    if (botField) {
      form.reset();
      location.hash = '#/thanks?form=intake&ok=1';
      return;
    }

    const provider = (cfg.provider || 'netlify').toLowerCase();
    if (status) status.textContent = 'Sending…';

    if (provider === 'netlify') {
      // Submit to Netlify Forms via fetch (AJAX)
      const payload = new URLSearchParams();
      payload.set('form-name', 'intake');
      const fields = {
        name, email, phone, company, website, industry, stage, team,
        services: services.join(', '), software, transactions, challenges, goals, budget, timeline, referrer,
        consent: consent ? 'yes' : 'no'
      };
      Object.entries(fields).forEach(([k, v]) => payload.append(k, v || ''));
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: payload.toString()
      }).then((resp) => {
        if (resp.ok) {
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'generate_lead', { form_name: 'intake', method: 'Netlify Forms' });
          }
          form.reset();
          location.hash = '#/thanks?form=intake';
        } else if ((resp.status === 501 || resp.status === 405) && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
          // Local Python server returns 501/405 for POST. Simulate success in dev.
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'generate_lead', { form_name: 'intake', method: 'dev-simulated' });
          }
          form.reset();
          location.hash = '#/thanks?form=intake&dev=1';
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
      const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
      if (isLocal) {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { form_name: 'intake', method: 'dev-simulated' });
        }
        form.reset();
        location.hash = '#/thanks?form=intake&dev=1';
      } else {
        if (status) status.textContent = 'Form endpoint not configured.';
      }
      return;
    }

    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (cfg.AUTH_HEADER && cfg.AUTH_VALUE) headers[cfg.AUTH_HEADER] = cfg.AUTH_VALUE;
    const payload = {
      form: 'intake',
      name, email, phone, company, website, industry, stage, team,
      services,
      software, transactions, challenges, goals, budget, timeline, referrer,
      consent: !!consent,
      source: location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    fetch(`${endpoint}/intake`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }).then(async (resp) => {
      if (resp.ok) {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { form_name: 'intake', method: 'custom' });
        }
        form.reset();
        location.hash = '#/thanks?form=intake';
      } else {
        throw new Error(await resp.text().catch(() => 'Network response not ok'));
      }
    }).catch(() => {
      if (status) status.textContent = 'Sorry, something went wrong. Please email info@logicalbooks.com.';
    });
  });
};

// Initialize on initial load
window.attachIntakeFormHandler();
