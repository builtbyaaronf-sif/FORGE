---
name: beacon-dashboard
description: >
  Set up BEACON — a client-facing dashboard for a Product 2 (Scale) FORGE
  client, showing invoices (LEDGER), leads (HubSpot), and nurture activity (PULSE). Trigger on:
  "set up BEACON", "give them a dashboard", "client dashboard", "Product 2 for [Business]". Uses
  magic-link auth — no passwords, no account system.
---

# BEACON Setup — Client Dashboard

## What already exists (built, don't rebuild)

- **`beacon.html`** — the dashboard page, single file, dark FORGE-brand styling. Handles login (email → magic link), verification, and renders three cards: invoices, leads, recent activity. Each card degrades independently — if HubSpot or Klaviyo isn't wired for a client yet, that card shows "not connected yet" instead of breaking the whole page.
- **`api/beacon-auth-request.js`** — client submits email, looks up `beacon_owner:{email}` in KV to find their `client_slug`, emails a single-use 15-minute link. Deliberately returns the same "if that email is registered..." response whether or not it is, to avoid leaking which emails are set up.
- **`api/beacon-auth-verify.js`** — exchanges the one-time token for a 48-hour session token (also stored in KV, `beacon_session:{token}` → `client_slug`). The one-time token is deleted on first use.
- **`api/beacon-data.js`** — the dashboard's data aggregator. Pulls Supabase invoices (LEDGER), HubSpot deals, and Klaviyo events (PULSE) in parallel, each wrapped so one failure doesn't sink the others.
- **`api/ledger-mark-paid.js`** — already requires a BEACON session token (built during LEDGER setup, before BEACON existed — this is the one write path BEACON has into client data).

## What you need to do per client

1. **Register the client's owner email** so login works: `kv.set('beacon_owner:{their-email}', '{client_slug}')`. No UI for this yet — run it manually via the Supabase/KV connector at handover time, or add it to `client-intake.js` in a later pass so it happens automatically.

2. **Tag HubSpot deals with `forge_client_slug`.** The dashboard filters deals by a custom property of this exact name — if it's not set on that client's deals, the Leads card will just show empty, not broken, but it also won't show anything useful. Add this property when running `hubspot-setup` for a client.

3. **No extra Klaviyo setup needed** — the PULSE integration already tags every event with `client_slug`, so the activity card works as soon as `nurture-setup` is done for the client.

## Known limits (flag these, don't hide them)

- No account recovery beyond "request another magic link" — there's no password to reset because there's no password.
- Sessions last 48 hours. After that, the client needs a fresh link. Not currently configurable per client.
- The Leads card depends on a HubSpot custom property (`forge_client_slug`) that has to be set up manually per client — it is not automatic just because `hubspot-setup` ran.
- `beacon_owner` mappings are set manually via KV right now. If a client's dashboard shows "no such email," check this mapping first before assuming something's broken.

## Handover language (use this, don't improvise)

"Your dashboard shows what's outstanding, who's in your pipeline, and recent activity — no password, just request a link with your email each time you want in. Some sections may show 'not connected yet' until we finish wiring your specific CRM setup — that's expected in the first few days, not a bug."
