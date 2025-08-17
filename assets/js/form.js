// Lightweight client-side handler that opens a mailto: with the form data
window.attachContactFormHandler = function attachContactFormHandler() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  if (form.__attached) return; // avoid duplicate listeners
  form.__attached = true;
  const status = form.querySelector('.form-status');
  const SUBJECT_TAG = '[Logical Books Contact]';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    const service = (data.get('service') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    if (!name || !email || !message) {
      if (status) status.textContent = 'Please complete required fields.';
      return;
    }

    // Submit to Netlify Forms via fetch (AJAX)
    const payload = new URLSearchParams();
    payload.set('form-name', 'contact');
    for (const [k, v] of data.entries()) {
      payload.append(k, String(v));
    }

    if (status) status.textContent = 'Sending…';
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString()
    }).then((resp) => {
      if (resp.ok) {
        if (status) status.textContent = 'Thanks! We’ll be in touch soon.';
        form.reset();
      } else {
        throw new Error('Network response not ok');
      }
    }).catch(() => {
      if (status) status.textContent = 'Sorry, something went wrong. Please email info@logicalbooks.com.';
    });
  });
};

// Initialize on initial page load
window.attachContactFormHandler();
