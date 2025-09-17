export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const corsOk = !origin || allowed.length === 0 || allowed.includes(origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, corsOk) });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, origin, corsOk);
    }

    if (!request.headers.get('Content-Type')?.includes('application/json')) {
      return json({ ok: false, error: 'Unsupported content type' }, 415, origin, corsOk);
    }

    // Optional bearer auth
    if (env.AUTH_TOKEN) {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.AUTH_TOKEN}`) {
        return json({ ok: false, error: 'Unauthorized' }, 401, origin, corsOk);
      }
    }

    let payload;
    try {
      payload = await request.json();
    } catch (_) {
      return json({ ok: false, error: 'Invalid JSON' }, 400, origin, corsOk);
    }

    const path = url.pathname.replace(/\/$/, '');
    const now = new Date().toISOString();
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ua = request.headers.get('User-Agent') || '';
    const ref = request.headers.get('Referer') || '';

    // Basic validation
    function missing(fields) {
      return fields.filter(k => !String(payload[k] ?? '').trim());
    }

    if (path.endsWith('/contact')) {
      const reqMissing = missing(['name', 'email', 'message']);
      if (reqMissing.length) return json({ ok: false, error: `Missing: ${reqMissing.join(', ')}` }, 400, origin, corsOk);

      const record = {
        type: 'contact',
        ts: now,
        ip, ua, ref, origin,
        ...sanitize(payload)
      };
      const result = await handleSubmission(record, env);
      // Also create a Lead in Zoho CRM if configured
      if (hasZoho(env)) {
        try {
          const lead = await createZohoLead(record, env);
          // Optionally create a Note with full details for contact too
          if (lead?.id && env.ZOHO_CREATE_NOTE === 'true') {
            await createZohoNote(lead.id, record, env);
          }
        } catch (e) {
          console.error('Zoho lead error (contact):', e);
        }
      }
      return json(result, 200, origin, corsOk);
    }

    if (path.endsWith('/intake')) {
      const reqMissing = missing(['name', 'email', 'challenges', 'goals']);
      if (reqMissing.length) return json({ ok: false, error: `Missing: ${reqMissing.join(', ')}` }, 400, origin, corsOk);

      const record = {
        type: 'intake',
        ts: now,
        ip, ua, ref, origin,
        ...sanitize(payload)
      };
      const result = await handleSubmission(record, env);
      if (hasZoho(env)) {
        try {
          const lead = await createZohoLead(record, env);
          if (lead?.id) {
            await createZohoNote(lead.id, record, env);
          }
        } catch (e) {
          console.error('Zoho lead error (intake):', e);
        }
      }
      return json(result, 200, origin, corsOk);
    }

    return json({ ok: false, error: 'Not found' }, 404, origin, corsOk);
  }
};

function corsHeaders(origin, ok) {
  const h = new Headers();
  if (ok && origin) h.set('Access-Control-Allow-Origin', origin);
  h.set('Vary', 'Origin');
  h.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  h.set('Access-Control-Max-Age', '86400');
  return h;
}

function json(data, status = 200, origin = '', corsOk = false) {
  const headers = corsHeaders(origin, corsOk);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { status, headers });
}

function sanitize(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (typeof v === 'string') {
      out[k] = v.toString().slice(0, 4000);
    } else if (Array.isArray(v)) {
      out[k] = v.map(x => String(x).slice(0, 400)).slice(0, 100);
    } else if (v == null) {
      // skip
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function handleSubmission(record, env) {
  // Persist to KV if bound
  try {
    if (env.SUBMISSIONS && typeof env.SUBMISSIONS.put === 'function') {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await env.SUBMISSIONS.put(id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 180 }); // 180 days
    }
  } catch (e) {
    // log only
    console.error('KV error', e);
  }

  // Send email via MailChannels (optional)
  try {
    if (env.DEST_EMAIL && env.FROM_EMAIL) {
      await sendMailChannels(record, env);
    }
  } catch (e) {
    console.error('Mail error', e);
  }

  return { ok: true };
}

// ===== Zoho CRM integration =====
function hasZoho(env) {
  return !!(env.ZOHO_CLIENT_ID && env.ZOHO_CLIENT_SECRET && env.ZOHO_REFRESH_TOKEN);
}

async function getZohoAccessToken(env) {
  const dc = (env.ZOHO_DC || 'com').trim();
  const base = `https://accounts.zoho.${dc}`;
  const params = new URLSearchParams({
    refresh_token: env.ZOHO_REFRESH_TOKEN,
    client_id: env.ZOHO_CLIENT_ID,
    client_secret: env.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });
  const resp = await fetch(`${base}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const text = await resp.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) { /* non-JSON error */ }
  if (!resp.ok || data.error) {
    throw new Error(`Zoho token error: ${resp.status} ${text}`);
  }
  if (!data.access_token) throw new Error('Zoho token missing access_token');
  return data.access_token;
}

function splitName(full) {
  const s = String(full || '').trim();
  if (!s) return { first: '', last: '' };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { first: '', last: parts[0] };
  const last = parts.pop();
  return { first: parts.join(' '), last };
}

function buildDescription(record) {
  const lines = [];
  lines.push(`Submitted: ${record.ts || ''}`);
  if (record.type) lines.push(`Type: ${record.type}`);
  if (record.service) lines.push(`Service interest: ${record.service}`);
  if (record.message) lines.push(`Message: ${record.message}`);
  if (record.challenges) lines.push(`Challenges: ${record.challenges}`);
  if (record.goals) lines.push(`Goals: ${record.goals}`);
  if (record.services) lines.push(`Services (intake): ${Array.isArray(record.services) ? record.services.join(', ') : record.services}`);
  if (record.software) lines.push(`Software: ${record.software}`);
  if (record.transactions) lines.push(`Transactions: ${record.transactions}`);
  if (record.budget) lines.push(`Budget: ${record.budget}`);
  if (record.timeline) lines.push(`Timeline: ${record.timeline}`);
  if (record.referrer) lines.push(`Heard about us: ${record.referrer}`);
  if (record.source) lines.push(`Source URL: ${record.source}`);
  if (record.origin) lines.push(`Origin: ${record.origin}`);
  if (record.ip) lines.push(`IP: ${record.ip}`);
  if (record.ua) lines.push(`UA: ${record.ua}`);
  return lines.join('\n');
}

function mapLead(record, env) {
  const { first, last } = splitName(record.name);
  const company = record.company || 'Individual';
  const lead = {
    Last_Name: last || (record.name || 'Unknown'),
    First_Name: first || undefined,
    Company: company,
    Email: record.email || undefined,
    Phone: record.phone || undefined,
    Lead_Source: 'Website',
    Description: buildDescription(record),
    Website: record.website || undefined,
    Industry: record.industry || undefined,
    // Title can carry a short context like service interest
    Title: record.service ? `Interested in ${record.service}` : undefined,
    Lead_Status: env.ZOHO_LEAD_STATUS || undefined,
  };
  // Assign owner if provided
  if (env.ZOHO_OWNER_ID) lead.Owner = { id: env.ZOHO_OWNER_ID };
  return Object.fromEntries(Object.entries(lead).filter(([,v]) => v !== undefined && v !== null));
}

async function createZohoLead(record, env) {
  const token = await getZohoAccessToken(env);
  const dc = (env.ZOHO_DC || 'com').trim();
  const base = `https://www.zohoapis.${dc}`;
  const lead = mapLead(record, env);
  const payload = { data: [lead], trigger: [] };
  const resp = await fetch(`${base}/crm/v2/Leads`, {
    method: 'POST',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Zoho lead create error: ${resp.status} ${text}`);
  let data;
  try { data = JSON.parse(text); } catch (_) { data = {}; }
  const entry = Array.isArray(data?.data) ? data.data[0] : null;
  const id = entry?.details?.id;
  return { id, raw: data };
}

async function createZohoNote(leadId, record, env) {
  const token = await getZohoAccessToken(env);
  const dc = (env.ZOHO_DC || 'com').trim();
  const base = `https://www.zohoapis.${dc}`;
  const content = buildDescription(record);
  const note = {
    Note_Title: record.type === 'intake' ? 'Intake Details' : 'Contact Details',
    Note_Content: content.slice(0, 100000),
    Parent_Id: leadId,
    se_module: 'Leads'
  };
  const resp = await fetch(`${base}/crm/v2/Notes`, {
    method: 'POST',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [note] })
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Zoho note create error: ${resp.status} ${t}`);
  }
}

async function sendMailChannels(record, env) {
  const subject = record.type === 'contact' ?
    'New Contact Request – Logical Books' :
    'New Intake Submission – Logical Books';
  const plain = Object.entries(record).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
  const body = {
    personalizations: [
      { to: [{ email: env.DEST_EMAIL }] }
    ],
    from: { email: env.FROM_EMAIL, name: 'Logical Books Website' },
    subject,
    content: [
      { type: 'text/plain', value: plain }
    ]
  };
  const resp = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`MailChannels error: ${resp.status} ${t}`);
  }
}
