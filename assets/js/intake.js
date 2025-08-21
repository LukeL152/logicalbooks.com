// Intake form handler: composes a mailto: with structured details
window.attachIntakeFormHandler = function attachIntakeFormHandler() {
  const form = document.getElementById('intake-form');
  if (!form) return;
  if (form.__attached) return;
  form.__attached = true;
  const status = form.querySelector('.form-status');
  const SUBJECT_TAG = '[Logical Books Intake]';

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

    if (!name || !email || !challenges || !goals || !consent) {
      if (status) status.textContent = 'Please complete required fields.';
      return;
    }

    // Submit to Netlify Forms via fetch (AJAX)
    const payload = new URLSearchParams();
    payload.set('form-name', 'intake');
    const fields = {
      name, email, phone, company, website, industry, stage, team,
      services: services.join(', '), software, transactions, challenges, goals, budget, timeline, referrer,
      consent: consent ? 'yes' : 'no'
    };
    Object.entries(fields).forEach(([k, v]) => payload.append(k, v || ''));

    if (status) status.textContent = 'Sending…';
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: payload.toString()
    }).then((resp) => {
      if (resp.ok) {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', {
            form_name: 'intake',
            method: 'Netlify Forms'
          });
        }
        form.reset();
        location.hash = '#/thanks?form=intake';
      } else if ((resp.status === 501 || resp.status === 405) && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        // Local Python server returns 501/405 for POST. Simulate success in dev.
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', {
            form_name: 'intake',
            method: 'dev-simulated'
          });
        }
        form.reset();
        location.hash = '#/thanks?form=intake&dev=1';
      } else {
        throw new Error('Network response not ok');
      }
    }).catch(() => {
      if (status) status.textContent = 'Sorry, something went wrong. Please email info@logicalbooks.com.';
    });
  });
};

// Initialize on initial load
window.attachIntakeFormHandler();
