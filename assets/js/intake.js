// Intake form handler: composes a mailto: with structured details
(function () {
  const form = document.getElementById('intake-form');
  if (!form) return;
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

    const subjectDetails = [name || '', company ? `@ ${company}` : ''].filter(Boolean).join(' ');
    const subject = encodeURIComponent(`${SUBJECT_TAG}${subjectDetails ? ' — ' + subjectDetails : ''}`);
    const lines = [
      '— Contact —',
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : '',
      company ? `Company: ${company}` : '',
      website ? `Website: ${website}` : '',
      '',
      '— Business —',
      industry ? `Industry: ${industry}` : '',
      stage ? `Stage: ${stage}` : '',
      team ? `Team size: ${team}` : '',
      services.length ? `Services: ${services.join(', ')}` : '',
      software ? `Software: ${software}` : '',
      transactions ? `Monthly tx volume: ${transactions}` : '',
      '',
      '— Needs —',
      `Challenges:\n${challenges}`,
      '',
      `Goals:\n${goals}`,
      '',
      '— Scope —',
      budget ? `Budget: ${budget}` : '',
      timeline ? `Timeline: ${timeline}` : '',
      referrer ? `Heard about us: ${referrer}` : '',
    ].filter(Boolean);

    const body = encodeURIComponent(lines.join('\n'));
    const mail = `mailto:info@logicalbooks.com?subject=${subject}&body=${body}`;

    // Open the user's email client
    window.location.href = mail;
    if (status) status.textContent = 'Thanks! Your email client should open. If not, email info@logicalbooks.com.';
    form.reset();
  });
})();
