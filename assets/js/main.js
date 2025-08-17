// Mobile nav toggle and active link highlighting
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // SPA: Active link based on hash route
  function setActive() {
    const hash = location.hash || '#/';
    document.querySelectorAll('#site-nav a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`#site-nav a[href='${hash}']`) || document.querySelector(`#site-nav a[href='#/']`);
    if (link) link.classList.add('active');
  }
  window.addEventListener('hashchange', setActive);
  setActive();

  // Year in footer
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
