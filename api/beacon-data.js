import { createClient } from '@vercel/kv';

// BEACON — the dashboard's single data-fetch endpoint. Aggregates across
// Supabase (LEDGER invoices), HubSpot (deals), and Klaviyo (recent nurture
// activity) for one client, identified via a verified session token — never
// a raw client_slug from the browser (see beacon-auth-verify.js).
//
// EACH SECTION FAILS INDEPENDENTLY. A HubSpot outage or a missing custom
// property must not take down the invoices section too — the architecture
// mandate here is "what happens if a downstream call fails halfway
// through", and the answer is: that one card shows an error state, nothing
// else breaks. Never let one Promise.all reject sink the whole response.

const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

async function verifySession(sessionToken) {
  if (!kv || !sessionToken) return null;
  return (await kv.get(`beacon_session:${sessionToken}`)) || null;
}

async function getInvoices(clientSlug) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: 'not_configured' };
  try {
    const res = await fetch(
      `${url}/rest/v1/forge_invoices?client_slug=eq.${encodeURIComponent(clientSlug)}&order=created_at.desc&limit=50`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return { ok: false, error: 'fetch_failed' };
    const rows = await res.json();
    const outstandingPence = rows.filter(r => r.status === 'outstanding').reduce((s, r) => s + r.amount_pence, 0);
    return { ok: true, invoices: rows, outstandingPence };
  } catch (err) {
    console.error('[BEACON] Invoices fetch failed:', err.message);
    return { ok: false, error: 'exception' };
  }
}

async function getHubspotDeals(clientSlug) {
  // Requires a custom HubSpot deal property tagging which client each lead
  // belongs to — the shared-portal multi-tenancy pattern documented in
  // hubspot-setup/SKILL.md. If that property isn't set up for this client
  // yet, this returns an empty (not broken) result.
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return { ok: false, error: 'not_configured' };
  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'forge_client_slug', operator: 'EQ', value: clientSlug }] }],
        properties: ['dealname', 'dealstage', 'amount', 'createdate'],
        limit: 25,
        sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
      }),
    });
    if (!res.ok) return { ok: false, error: 'fetch_failed' };
    const data = await res.json();
    return { ok: true, deals: (data.results || []).map(d => d.properties) };
  } catch (err) {
    console.error('[BEACON] HubSpot fetch failed:', err.message);
    return { ok: false, error: 'exception' };
  }
}

async function getPulseActivity(clientSlug) {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  if (!apiKey) return { ok: false, error: 'not_configured' };
  try {
    // UNVERIFIED (flagged during the 1 Jul 2026 Scale dry run): Klaviyo's
    // Events API filter DSL is documented to support metric_id/profile_id/
    // datetime reliably; filtering on a nested custom `properties.X` field
    // like this has not been confirmed against a live account (no MCP path
    // exists to test it from a session, and the site isn't deployed with
    // real KLAVIYO_PRIVATE_API_KEY access yet). If this filter syntax is
    // wrong, Klaviyo returns a 400, which the !res.ok check below already
    // catches safely (this card just shows "not connected" instead of
    // crashing the dashboard) — but confirm this against a live account
    // before assuming the activity card actually works.
    const res = await fetch(
      `https://a.klaviyo.com/api/events?filter=equals(properties.client_slug,"${clientSlug}")&sort=-datetime&page[size]=10`,
      { headers: { Authorization: `Klaviyo-API-Key ${apiKey}`, revision: '2025-04-15' } }
    );
    if (!res.ok) return { ok: false, error: 'fetch_failed' };
    const data = await res.json();
    return { ok: true, events: (data.data || []).map(e => ({ metric: e.attributes?.metric?.data?.attributes?.name, at: e.attributes?.datetime })) };
  } catch (err) {
    console.error('[BEACON] Klaviyo fetch failed:', err.message);
    return { ok: false, error: 'exception' };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sessionToken = (req.body || {}).sessionToken;
  const clientSlug = await verifySession(sessionToken);
  if (!clientSlug) {
    return res.status(401).json({ error: 'Session expired or invalid — request a new dashboard link' });
  }

  // Independent, never let one rejection take the others down.
  const [invoices, deals, pulse] = await Promise.all([
    getInvoices(clientSlug),
    getHubspotDeals(clientSlug),
    getPulseActivity(clientSlug),
  ]);

  return res.status(200).json({ clientSlug, invoices, deals, pulse, generatedAt: new Date().toISOString() });
}
