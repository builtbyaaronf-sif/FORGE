import { trackPulseEvent } from './_lib/pulse.js';

// PULSE — public webhook target for external triggers (Zapier) that need to
// fire a Klaviyo event without going through a FORGE-authored endpoint like
// api/submit.js. Built for the LEDGER Zap's second action: HubSpot deal
// hits Closed Won -> this fires 'review_request_triggered', which a
// manually-built Klaviyo flow (see nurture-setup/SKILL.md) picks up.
//
// Deliberately generic — any metricName can be passed, not just the review
// trigger, so future Zaps (quote_submitted from a non-FORGE quote tool,
// etc.) can reuse this same endpoint instead of each needing a bespoke one.
//
// Auth: shared secret header, not open. A public POST endpoint that fires
// Klaviyo events on demand is a spam/abuse vector otherwise (unlimited free
// event injection into someone's marketing platform).
//
// Env vars: KLAVIYO_PRIVATE_API_KEY (used inside trackPulseEvent), FORGE_WEBHOOK_SECRET

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-forge-webhook-secret'];
  if (!process.env.FORGE_WEBHOOK_SECRET || secret !== process.env.FORGE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, firstName, clientSlug, metricName, properties } = req.body || {};
  if (!email || !clientSlug || !metricName) {
    return res.status(400).json({ error: 'Missing email, clientSlug, or metricName' });
  }

  try {
    const result = await trackPulseEvent({ email, firstName, clientSlug, metricName, properties: properties || {} });
    return res.status(200).json({ received: true, ...result });
  } catch (err) {
    console.error('[PULSE] pulse-track-event failed:', err.message);
    // Always 200 here too, same pattern as paypal-webhook: Zapier will
    // retry a non-200 indefinitely, and a transient Klaviyo hiccup isn't
    // worth a retry storm.
    return res.status(200).json({ received: true, ok: false });
  }
}
