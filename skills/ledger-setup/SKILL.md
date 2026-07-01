---
name: ledger-setup
description: >
  Set up LEDGER — a receivables tracker for a Product 2 (Scale) FORGE client.
  Records what's owed and what's been paid when a HubSpot deal closes, generates a PDF invoice, and
  emails it to the customer. Trigger on: "set up LEDGER", "add invoicing", "receivables tracker",
  "Product 2 for [Business]", or any time a Product 2 client needs billing tracked. This is NOT
  bookkeeping, VAT handling, or accounting software — it only tracks outstanding vs paid.
---

# LEDGER Setup — Receivables Tracker

LEDGER is deliberately narrow scope: it records what a client's customer owes and whether they've paid. It does not do bookkeeping, VAT, reconciliation, or replace an accountant. Say this explicitly in every handover doc — clients will otherwise assume more than is delivered.

## What already exists (built, don't rebuild)

- **Supabase table `forge_invoices`** — lives in the shared FORGE Supabase project (`jhsswflacyzwdulokgrn`). Columns: `client_slug`, `hubspot_deal_id` (unique — this is the idempotency guard), `customer_name`, `customer_email`, `amount_pence`, `status` (outstanding/paid/void), `due_date`, `paid_date`, `invoice_pdf_url`. RLS enabled with zero public policies — only the service role key can touch it, by design.
- **`api/ledger-invoice-create.js`** — the trigger target. Takes `client_slug`, `hubspot_deal_id`, `customer_name`, `customer_email`, `amount_pence`, `description`. Inserts the record (idempotent — a duplicate `hubspot_deal_id` returns `duplicate_ignored`, not an error), renders a PDF invoice via `html-pdf-node`, stores it in Vercel Blob, emails the customer.
- **`api/ledger-mark-paid.js`** — the one write action BEACON's dashboard needs. Requires a valid BEACON session token (see `beacon-dashboard` skill), verifies the invoice actually belongs to that client's session before touching anything.

## What you need to do per client

1. **Wire the HubSpot trigger.** LEDGER doesn't watch HubSpot directly — a Zapier zap does: "HubSpot deal stage = Closed Won" → POST to `https://forgeisagentic.tech/api/ledger-invoice-create` with the deal's amount and contact details mapped into the payload fields above. Set this up once per client's HubSpot pipeline (the "New Leads" pipeline's "Closed Won" stage, per `hubspot-setup`).

2. **Same zap, second action:** also fires PULSE's review-request flow. One HubSpot trigger, two downstream actions — don't build a second separate Zapier watcher on the same event, that's duplicate infrastructure for no reason.

3. **Confirm env vars are set on the client-facing Vercel project** (or on FORGE's own project if these endpoints are centralised — currently they live on FORGE's own deployment, not per-client, since invoicing is a FORGE-operated service): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

## Handover language (use this, don't improvise)

"LEDGER tracks what's owed and what's been paid — every time a deal closes in your CRM, an invoice gets created and emailed automatically. It is not bookkeeping and it doesn't handle VAT. Think of it as 'do I know who owes me money right now', not 'is my tax return ready'."

## Known limits (flag these, don't hide them)

- No VAT calculation. `amount_pence` is a flat figure — if the client charges VAT, they need to include it in what gets passed to the zap, LEDGER doesn't compute it.
- No partial payments. An invoice is either `outstanding` or `paid` — there's no concept of a part-paid balance yet.
- PDF generation can fail without blocking the invoice record (by design — the receivable being tracked matters more than the PDF rendering). If a client says "I didn't get a PDF," check Vercel logs for `[LEDGER] PDF generation failed` before assuming the whole thing broke.
