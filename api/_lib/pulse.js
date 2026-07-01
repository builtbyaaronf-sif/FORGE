// PULSE — shared Klaviyo integration helper. Not a standalone endpoint;
// other API functions (api/submit.js, quote-wizard's backend, the LEDGER
// Closed-Won zap) import trackPulseEvent() to push a lead/customer into
// Klaviyo and log the event that a manually-built flow can trigger on.
//
// WHY THIS ISN'T ALL AUTOMATED: Klaviyo's public API does not expose
// creation of Lists or Flows — those are UI-only by design (flow branching
// logic has no clean API shape). What IS automatable: subscribing profiles
// and tracking events, both done here via direct REST calls. See
// skills/nurture-setup/SKILL.md for the manual steps this can't replace.
//
// Env var: KLAVIYO_PRIVATE_API_KEY

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
const KLAVIYO_REVISION = '2025-04-15';

export async function trackPulseEvent({ email, firstName, clientSlug, metricName, properties = {} }) {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  if (!apiKey || !email || !metricName) {
    console.warn('[PULSE] Skipped — missing API key, email, or metric name');
    return { skipped: true };
  }

  const headers = {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,
    'Content-Type': 'application/json',
    'revision': KLAVIYO_REVISION,
  };

  // Subscribing first (idempotent — repeat calls just re-confirm consent)
  // ensures the profile exists before the event references it, and puts
  // them in a state a client_slug-filtered flow can actually pick up.
  try {
    await fetch(`${KLAVIYO_API_BASE}/profile-subscription-bulk-create-jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [{
                type: 'profile',
                attributes: {
                  email,
                  first_name: firstName || undefined,
                  properties: { client_slug: clientSlug },
                  subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
                },
              }],
            },
          },
        },
      }),
    });
  } catch (err) {
    console.error('[PULSE] Subscribe failed (non-fatal, continuing to event):', err.message);
  }

  // Track the event. This is what a flow's "Metric" trigger watches —
  // `quote_submitted`, `lead_captured`, etc. Klaviyo creates the metric
  // automatically on first use; nothing to pre-provision.
  try {
    const res = await fetch(`${KLAVIYO_API_BASE}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            properties: { ...properties, client_slug: clientSlug },
            metric: { data: { type: 'metric', attributes: { name: metricName } } },
            profile: { data: { type: 'profile', attributes: { email, first_name: firstName || undefined } } },
          },
        },
      }),
    });
    if (!res.ok) {
      console.error('[PULSE] Event tracking failed:', res.status, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[PULSE] Event tracking exception:', err.message);
    return { ok: false };
  }
}
