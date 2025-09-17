Forms: Provider Options

Overview
- Default: Netlify Forms (no backend to maintain).
- New option: Custom endpoint via Cloudflare Workers (recommended: free, scalable, flexible; supports CORS and email via MailChannels).
- Alternative: Google Apps Script (free, stores to Google Sheet + emails; CORS caveats for JSON).

How to Switch Frontend
- Edit `assets/js/config.js`:
  - Set `provider: 'custom'`.
  - Set `FORM_ENDPOINT` to your endpoint base URL (no trailing slash), e.g. `https://your-worker.workers.dev/forms`.
  - Optionally set `AUTH_HEADER`/`AUTH_VALUE` for a Bearer token.
- No template changes required. Contact posts to `<ENDPOINT>/contact`, Intake posts to `<ENDPOINT>/intake`.

Cloudflare Workers Backend (Recommended)
1) Copy `serverless/cloudflare/worker.js` into a new Workers project (or use it directly with Wrangler).
2) Create a KV namespace (optional) and bind as `SUBMISSIONS`.
3) Configure `wrangler.toml` similar to `serverless/cloudflare/wrangler.example.toml`:
   - `ALLOWED_ORIGINS` should include your production origin and `http://localhost:8080` for local dev.
   - (Optional) `AUTH_TOKEN` to require `Authorization: Bearer <token>`.
   - (Optional) `FROM_EMAIL` and `DEST_EMAIL` for email notifications via MailChannels.
   - Use `wrangler secret put` for sensitive values (tokens, secrets) instead of committing them in plain text.
4) Deploy, then set `FORM_ENDPOINT` to `https://<your-worker>/forms`.

Zoho CRM Integration (via Worker)
- Purpose: Create Leads in Zoho CRM for both contact and intake while keeping SPA UX.
- Configure in `wrangler.toml` (see example). Store sensitive values using `wrangler secret put`:
  - `ZOHO_DC`: your Zoho data center (`com` for US, `eu`, `in`, `com.au`, `com.cn`).
  - `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`: from your Zoho OAuth app (secret).
  - `ZOHO_REFRESH_TOKEN`: long‑lived token (secret) with scopes like `ZohoCRM.modules.leads.CREATE,ZohoCRM.modules.notes.CREATE` and offline access.
  - Optional: `ZOHO_OWNER_ID` to assign lead owner; `ZOHO_LEAD_STATUS` picklist value; `ZOHO_CREATE_NOTE=true` to attach a full submission note.
- Field mapping:
  - Required: `Last_Name` (derived from full name; fallback to full name), `Company` (`company` or `Individual`).
  - Common: `Email`, `Phone`, `Lead_Source=Website`, `Website`, `Industry`, `Title` (e.g., `Interested in <service>`), `Description` (multi‑line summary).
  - Intake adds depth into `Description` and an optional `Note`.
- How tokens work: Worker exchanges the refresh token for an access token on each request against `https://accounts.zoho.{DC}/oauth/v2/token`, then calls `https://www.zohoapis.{DC}/crm/v2/Leads`.

Generating Zoho OAuth credentials
- In Zoho Accounts → Developer Console, create a Server‑based app (or use Self Client for a quick setup) and get `client_id` and `client_secret`.
- Generate a grant code with scopes (include `offline_access`): for Self Client, enter scopes like `ZohoCRM.modules.leads.CREATE,ZohoCRM.modules.notes.CREATE,ZohoCRM.users.READ,ZohoCRM.org.READ,offline_access`.
- Exchange grant code for a refresh token:
  - POST to `https://accounts.zoho.{DC}/oauth/v2/token` with form fields: `grant_type=authorization_code`, `client_id`, `client_secret`, `redirect_uri` (use any valid URL for Self Client), and `code` (the grant code).
  - Save the `refresh_token`. Put it into the Worker via `wrangler secret put ZOHO_REFRESH_TOKEN`.
  - Put `client_id`/`client_secret` via `wrangler secret put` as well.

Google Apps Script Backend (Alternative)
- Use `serverless/google-apps-script/Code.gs`.
- Deploy as Web App (Execute as: Me, Access: Anyone). Set Script Properties:
  - `SHEET_ID`: target Google Sheet to store submissions.
  - `DEST_EMAIL`: where to send notifications.
- Note: Apps Script web apps have limited CORS control. If you hit CORS with `application/json`, either:
  - Place Apps Script behind a proxy (e.g., a Cloudflare Worker) that adds CORS headers, or
  - Modify the frontend to send `application/x-www-form-urlencoded` to that specific endpoint.

Local Dev
- With `provider: 'custom'` and no endpoint configured, the frontend simulates success on `localhost` so flows can be tested without a backend.
- On production, if `FORM_ENDPOINT` is empty, the form shows a configuration error.

Analytics
- GA4 events use `method: 'custom'` for the custom provider and `method: 'Netlify Forms'` for Netlify.
