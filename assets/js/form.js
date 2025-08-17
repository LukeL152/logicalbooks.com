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

    const subject = encodeURIComponent(`${SUBJECT_TAG}${name ? ' — ' + name : ''}`);
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : '',
      service ? `Service: ${service}` : '',
      '',
      message
    ].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join('\n'));
    const mail = `mailto:info@logicalbooks.com?subject=${subject}&body=${body}`;

    window.location.href = mail;
    if (status) status.textContent = 'Thanks! Your email client should open. If not, email info@logicalbooks.com.';
    form.reset();
  });
};

// Initialize on initial page load
window.attachContactFormHandler();
