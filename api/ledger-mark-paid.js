// LEDGER — mark an invoice paid. Called from BEACON's dashboard, the one
// write action a client-facing surface has into this data. Requires a valid
// BEACON session token, not a raw client_slug — see api/beacon-auth-verify.js
// for how that token gets issued (single-use magic link -> short-lived session).

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifySession(sessionToken) {
  // Sessions are stored in KV by beacon-auth-verify.js: session:{token} -> client_slug
  const { createClient } = await import('@vercel/kv');
  const kv = createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
  const clientSlug = await kv.get(`beacon_session:${sessionToken}`);
  return clientSlug || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ error: 'Storage not configured' });
    }

    const { invoiceId, sessionToken } = req.body || {};
    if (!invoiceId || !sessionToken) {
      return res.status(400).json({ error: 'Missing invoiceId or sessionToken' });
    }

    const clientSlug = await verifySession(sessionToken);
    if (!clientSlug) {
      return res.status(401).json({ error: 'Session expired or invalid — request a new dashboard link' });
    }

    // Fetch the invoice first to confirm it actually belongs to this client's
    // session before writing anything — never trust invoiceId alone, a
    // session for client A must not be able to touch client B's invoice by
    // guessing an ID.
    const lookup = await fetch(
      `${SUPABASE_URL}/rest/v1/forge_invoices?id=eq.${invoiceId}&client_slug=eq.${encodeURIComponent(clientSlug)}&select=id,status`,
      { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
    );
    const rows = await lookup.json();
    if (!lookup.ok || !rows.length) {
      return res.status(404).json({ error: 'Invoice not found for this client' });
    }
    if (rows[0].status === 'paid') {
      return res.status(200).json({ received: true, status: 'already_paid' });
    }

    const update = await fetch(`${SUPABASE_URL}/rest/v1/forge_invoices?id=eq.${invoiceId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        status: 'paid',
        paid_date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      }),
    });

    if (!update.ok) {
      console.error('[LEDGER] Mark-paid update failed:', await update.text());
      return res.status(500).json({ error: 'Could not update invoice' });
    }

    console.log(`[LEDGER] Invoice ${invoiceId} marked paid for client ${clientSlug}`);
    return res.status(200).json({ received: true, status: 'paid' });
  } catch (err) {
    console.error('[LEDGER] Unhandled error:', err);
    return res.status(500).json({ error: 'Update failed' });
  }
}
