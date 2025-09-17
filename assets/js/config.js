// Basic configuration for forms provider
// provider: 'netlify' | 'custom'
// - 'netlify': uses Netlify Forms (current behavior)
// - 'custom': posts JSON to FORM_ENDPOINT
//
// To switch away from Netlify, set provider to 'custom' and set FORM_ENDPOINT
// to your serverless endpoint (e.g., Cloudflare Worker URL).
window.APP_CONFIG = Object.assign(window.APP_CONFIG || {}, {
  FORMS: {
    // Switch to custom provider (Cloudflare Worker)
    provider: 'custom',
    // Worker base URL (no trailing slash beyond /forms)
    FORM_ENDPOINT: 'https://logical-books-forms.biollogics.workers.dev/forms',
    // Optional bearer token header. If you set AUTH_TOKEN as a secret in the Worker,
    // uncomment the next two lines and paste the token value.
    AUTH_HEADER: '', // e.g., 'Authorization'
    AUTH_VALUE: ''   // e.g., 'Bearer <token>'
  }
});
