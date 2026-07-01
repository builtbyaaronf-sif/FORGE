---
name: nurture-setup
description: >
  Set up PULSE — Klaviyo-based lead nurture for a Product 2 (Scale) FORGE
  client. Trigger on: "set up PULSE", "add nurture emails", "email automation", "Product 2 for
  [Business]", or any time a Product 2 client needs automated follow-up emails. IMPORTANT: Klaviyo's
  API cannot create Lists or Flows — those steps are manual. Read this whole file before promising
  a client full automation.
---

# PULSE Setup — Lead Nurture

## Read this first: what's actually automatable

Klaviyo's public API does not expose creation of **Lists** or **Flows**. This isn't a FORGE limitation, it's how Klaviyo's API is designed — flow trigger/branching logic has no clean API shape, so it's UI-only. Don't promise a client "fully automated nurture setup" without qualifying this.

**What IS automated (already built, don't rebuild):**
- `api/_lib/pulse.js` — `trackPulseEvent()`. Subscribes a profile to email marketing and fires a named Klaviyo event (e.g. `lead_captured`), tagged with `client_slug`. Uses direct REST calls to Klaviyo's Events and Profile-Subscription APIs with `KLAVIYO_PRIVATE_API_KEY` — this runs at request time in serverless functions, not through this MCP session.
- `api/submit.js` already calls this on every new lead — fires `lead_captured` the moment someone submits the wizard on `index.html`.
- 3 email templates already created in the connected Klaviyo account: `PULSE - New Lead Welcome` (id `TkDd9Y`), `PULSE - Quote Follow Up` (id `T6Ks7N`), `PULSE - Review Request` (id `Ubx2Eg`). Generic content with `{{ first_name }}` / `{{ organization.* }}` variables — reusable across clients, not FORGE-branded.

**What's manual, per client, in the Klaviyo UI (klaviyo.com):**
1. Create a List for the client (e.g. "Dave's Plumbing — Leads"). No API path for this.
2. Build 3 flows, each triggered off a Metric:
   - **New Lead Welcome** — trigger: `lead_captured` metric, filter `client_slug` equals the client's slug. Attach the `PULSE - New Lead Welcome` template. Send immediately.
   - **Quote Follow Up** — trigger: `quote_submitted` metric (fires from the client's quote-wizard once wired the same way — see below), 48hr delay, skip if `quote_responded` fired in that window. Attach `PULSE - Quote Follow Up`.
   - **Review Request** — trigger: same Zapier zap that fires LEDGER on "HubSpot deal Closed Won" (see `ledger-setup`), few days delay. Attach `PULSE - Review Request`.
3. Customize each template's `{{ google_review_url }}` and sender identity per client before turning the flow live.

## Known limitation: shared Klaviyo account (real, flag it)

This connects to a single shared Klaviyo account across FORGE and Aaron's other projects — not a dedicated FORGE or per-client account. Parallel to the shared `RESEND_API_KEY` debt already documented in `CLAUDE.md`: all client sending shares one account's domain reputation. If one client's list gets marked as spam-heavy, it can affect deliverability for others. Fine for now at low volume — revisit before scaling past a handful of Product 2 clients.

## To wire quote_submitted into PULSE

The quote-wizard skill's backend (Formspree/WhatsApp/HubSpot depending on client config) needs one more call: `trackPulseEvent({ email, firstName, clientSlug, metricName: 'quote_submitted', properties: {...} })`, same pattern as `api/submit.js`. Not yet wired — do this when a Product 2 client's quote wizard goes live.

## Handover language (use this, don't improvise)

"PULSE follows up with leads automatically — a welcome email the moment they enquire, a nudge if a quote goes unanswered, a review request once a job's done. The email content is templated and ready; the timing rules are configured in Klaviyo directly by us, not self-serve for you."
