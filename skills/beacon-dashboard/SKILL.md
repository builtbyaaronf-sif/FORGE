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

1. **Registering the client's owner email — now automatic (fixed 1 Jul 2026).** `api/client-intake.js` writes `beacon_owner:{email} -> {client_slug}` to KV as soon as a Scale (`product2`) client submits their intake form, using a `slugify()` derived from their business name. **Real risk, not fully closed:** this slug must exactly match the slug used for the Vercel project name, HubSpot's `forge_client_slug`, and every `client_slug` column elsewhere — there's no single shared slugify function across the codebase, each place derives it independently. If ATLAS/deploy-team ever slugifies differently (different truncation, apostrophe handling, etc.), BEACON logins resolve to a slug matching nothing, and every card silently shows empty. Verify a real client's slug matches across all four systems before trusting this end-to-end.

2. **Tag HubSpot deals with `forge_client_slug`.** The dashboard filters deals by a custom property of this exact name — if it's not set on that client's deals, the Leads card will just show empty, not broken, but it also won't show anything useful. Add this property when running `hubspot-setup` for a client.

3. **Activity card is honestly not implemented yet (confirmed 1 Jul 2026, corrected from earlier "just works" claim).** Klaviyo's Events API only supports filtering by `metric_id`, `profile_id`, `datetime` — there is no way to filter by a custom property like `client_slug`. `getPulseActivity()` returns `not_implemented` on purpose rather than making a call that would 400 forever. Real fix needs either: storing a `klaviyo_list_id` per client (nothing tracks this today) and querying via list membership, or researching whether `query_metric_aggregates`/segment-based querying supports broader filtering. Don't promise a client this card works until one of those is built.

## Known limits (flag these, don't hide them)

- No account recovery beyond "request another magic link" — there's no password to reset because there's no password.
- Sessions last 48 hours. After that, the client needs a fresh link. Not currently configurable per client.
- The Leads card depends on a HubSpot custom property (`forge_client_slug`) that has to be set up manually per client — it is not automatic just because `hubspot-setup` ran.
- **The activity card doesn't work at all yet** — see point 3 above. It will always show "not connected" until the Klaviyo querying approach is actually built.
- `beacon_owner` mappings are now written automatically at intake time for Scale clients (see point 1) — no longer a manual step, but the slug-consistency risk noted there still applies.

## Handover language (use this, don't improvise)

"Your dashboard shows what's outstanding, who's in your pipeline, and recent activity — no password, just request a link with your email each time you want in. Some sections may show 'not connected yet' until we finish wiring your specific CRM setup — that's expected in the first few days, not a bug."
