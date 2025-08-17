(function () {
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!isLocal) return;
  try {
    const es = new EventSource('/__livereload');
    es.onmessage = function (ev) {
      if (ev.data === 'reload') {
        // Avoid losing hash route (SPA) on reload
        const hash = location.hash;
        location.reload();
        if (hash) location.hash = hash;
      }
    };
  } catch (e) {
    // noop
  }
})();

