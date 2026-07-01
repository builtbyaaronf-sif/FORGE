---
name: hubspot-setup
description: >
  Set up a HubSpot CRM for a new FORGE client using the HubSpot MCP. Creates the company record,
  contact properties, a "New Leads" deals pipeline with 7 stages, and logs the client's details
  as the account owner. Trigger on: "set up HubSpot for", "HubSpot CRM setup", "Package 3",
  "Package 4", "Package 5", "connect CRM", "set up their pipeline", "wire leads to CRM", or any
  time a client's quote wizard or booking system needs leads stored in a CRM automatically.
  Also auto-triggers inside deploy-team for Package 3, 4, and 5 builds.
  Uses the connected HubSpot MCP (manage_crm_objects, search_crm_objects, get_properties).
---

# HubSpot Setup Skill

## What This Builds

A complete, functional HubSpot CRM foundation for a new FORGE client:

1. Company record — the client's business in their own HubSpot account
2. Contact record — the business owner as a contact (for reporting)
3. Deals pipeline — "New Leads" pipeline with 7 stages matching the FORGE sales process
4. Custom contact properties — fields that capture data from the quote wizard
5. Embed instructions — how to connect the quote wizard to HubSpot (if Package 3+)

All work is done via the HubSpot MCP tools. No browser required.

---

## Inputs

Gather these before running. Most come from the `website-content-extractor` brief.

| Field | Description | Default |
|---|---|---|
| `business_name` | Client business name | Required |
| `business_domain` | Client website domain | Required |
| `owner_name` | Client's full name | Required |
| `owner_email` | Client's email address | Required |
| `owner_phone` | Client's phone number | Optional |
| `industry` | Business category/trade | `"general"` |
| `package_tier` | 3, 4, or 5 | `3` |

---

## Step 1: Ground yourself in the HubSpot account

Call `get_organization_details` to confirm the connected HubSpot portal. Note the portal ID — include it in all output messages so the client knows which account was configured.

If the MCP returns an error or the portal appears to be FORGE's own account rather than the client's: stop and flag this to Aaron. Clients need their own HubSpot account, not FORGE's.

> **Note:** The HubSpot free tier is sufficient for all Package 3–5 deliverables. If the client doesn't have an account, they need to sign up at hubspot.com first. HubSpot does not support programmatic account creation — guide them to sign up, then re-run this skill once their account is connected.

---

## Step 2: Create the company record

Use `manage_crm_objects` to create a Company object.

```
object_type: companies
action: create
properties:
  name: {business_name}
  domain: {business_domain}
  phone: {owner_phone}
  industry: {industry mapped to HubSpot industry enum — see mapping below}
  city: {city from brief if available}
  country: GB
  description: "FORGE client — Package {package_tier} deployment"
```

**Industry mapping** (HubSpot uses specific enum values):
- `plumber` / `electrician` / `builder` / `roofer` → `CONSTRUCTION`
- `landscaper` → `ENVIRONMENTAL_SERVICES`
- `cleaner` → `CONSUMER_SERVICES`
- `beauty` → `COSMETICS`
- `general` → `OTHER`

Save the returned company `id` — used in Step 3.

---

## Step 3: Create the contact record (owner)

Use `manage_crm_objects` to create a Contact for the business owner. Associate them with the company created in Step 2.

```
object_type: contacts
action: create
properties:
  firstname: {first name from owner_name}
  lastname: {last name from owner_name}
  email: {owner_email}
  phone: {owner_phone}
  jobtitle: Owner
  company: {business_name}
```

After creating, associate this contact with the company:
```
object_type: contacts
action: associate
contact_id: {contact id}
company_id: {company id from Step 2}
```

---

## Step 4: Set up the "New Leads" pipeline

This is the pipeline that captures every lead that comes through the quote wizard or booking form.

Use `manage_crm_objects` to create a pipeline (or update the default pipeline if creating custom ones is not available on free tier):

**Pipeline name:** New Leads

**Stages in order:**

| Stage | Label | Default probability |
|---|---|---|
| 1 | New Enquiry | 10% |
| 2 | First Contact Made | 20% |
| 3 | Discovery Complete | 40% |
| 4 | Quote Sent | 60% |
| 5 | Negotiation | 80% |
| 6 | Closed Won | 100% |
| 7 | Closed Lost | 0% |

If pipeline creation via MCP returns an error (HubSpot free tier restriction): use the default pipeline. Rename the default stages to match the above using `manage_crm_objects` with `action: update` on each pipeline stage. Document the limitation clearly in the handover notes.

---

## Step 5: Add custom contact + deal properties (quote wizard fields, multi-tenant tagging)

**Correction (verified 1 Jul 2026 during the Scale dry run): the HubSpot MCP cannot create custom property definitions.** `manage_crm_objects` creates/updates records (companies, contacts, deals), not property schema. `search_properties`/`get_properties` are read-only. Creating a new custom property is a manual step in HubSpot's own UI — Settings → Properties → [object type] → Create property. Don't tell a client or Aaron this step is automated.

Contact properties to create (all `string` type unless noted):

| Internal name | Label | Field type |
|---|---|---|
| `forge_services_requested` | Services Requested | `textarea` |
| `forge_job_description` | Job Description | `textarea` |
| `forge_postcode` | Customer Postcode | `text` |
| `forge_enquiry_source` | Enquiry Source | `select` (Website / Referral / Social / Google) |
| `forge_lead_temperature` | Lead Temperature | `select` (Hot / Warm / Cold) |
| `forge_follow_up_date` | Follow Up Date | `date` |
| `forge_objection_raised` | Objection Raised | `textarea` |
| `forge_package_tier` | FORGE Package | `text` |

**Deal property (required for Scale, added 1 Jul 2026):**

| Internal name | Label | Field type |
|---|---|---|
| `forge_client_slug` | FORGE Client Slug | `text` |

BEACON's Leads card and LEDGER's Zapier trigger both filter deals by this property — if it's missing on a client's deals, those features return empty results, not an error. Set it on every deal for every Scale client, every time, or the multi-tenancy model silently breaks.

After creating, verify properties exist using `get_properties` with `object_type: contacts` (or `deals`).

**Also verified during the dry run:** HubSpot's `industry` company property is a closed enum — trades like "Electrician" or "Plumber" aren't options. Use `CONSTRUCTION` as the closest fit for trades clients unless a better match exists in the enum list (fetch it via `get_properties` on `companies`/`industry` if unsure).

---

## Step 6: Wire the quote wizard to HubSpot (Package 3+)

If the site has email routing via Resend + Vercel (the default), the quote wizard currently sends email only. For HubSpot lead capture, there are two options:

### Option A: HubSpot Embedded Form (recommended for Package 3)

Replace (or supplement) the `api/quote.js` serverless function with a HubSpot form submission. Add this to the wizard's submit handler AFTER the Resend email call:

```js
// HubSpot contact creation via Forms API (free tier compatible)
await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fields: [
      { name: 'firstname', value: customerName.split(' ')[0] },
      { name: 'lastname', value: customerName.split(' ').slice(1).join(' ') || '-' },
      { name: 'email', value: customerEmail },
      { name: 'phone', value: customerPhone },
      { name: 'forge_services_requested', value: services.join(', ') },
      { name: 'forge_job_description', value: description },
      { name: 'forge_postcode', value: customerPostcode },
      { name: 'forge_enquiry_source', value: 'Website' },
    ],
    context: { pageUri: process.env.SITE_URL, pageName: businessName }
  })
});
```

**Additional Vercel env vars required:**
| Variable | Value |
|---|---|
| `HUBSPOT_PORTAL_ID` | Client's HubSpot portal ID (from Step 1) |
| `HUBSPOT_FORM_GUID` | GUID of a form created in the client's HubSpot account |

To get the `HUBSPOT_FORM_GUID`: create a blank form in HubSpot (Forms > Create form > Blank), name it "Quote Wizard Leads", save it, and copy the GUID from the URL. Document this in the handover notes — the client must do this step manually if they set up their own account.

### Option B: HubSpot routing mode in quote-wizard

If the quote wizard was deployed with `contact_method: hubspot`, it already submits directly via the HubSpot JS API. In this case, no API changes are needed — just ensure the `HUBSPOT_FORM_GUID` is set as a JS constant in the wizard code.

---

## Step 7: Verify

After all steps complete, run `search_crm_objects` to confirm:
- Company record exists with the correct name and domain
- Contact record exists and is associated with the company
- Custom properties are visible on the contact object

---

## Output

Return a structured summary:

```
==================================================
HUBSPOT SETUP COMPLETE: {business_name}
==================================================
Portal ID:      {portal_id}
Company ID:     {company_id}
Contact ID:     {contact_id}
Pipeline:       "New Leads" — {X} stages
Custom props:   8 quote wizard fields added

QUOTE WIZARD INTEGRATION
  Method: {Option A — Forms API / Option B — HubSpot JS}
  Portal ID: {portal_id}
  Form GUID: {form_guid or "to be added by client — see handover notes"}

VERCEL ENV VARS TO ADD
  HUBSPOT_PORTAL_ID={portal_id}
  HUBSPOT_FORM_GUID={form_guid}

HANDOVER NOTES
  - Client must verify their HubSpot account at app.hubspot.com
  - Every quote wizard submission will now create a contact in New Leads pipeline
  - Lead temperature defaults to "Warm" — client should update manually to Hot/Cold
  - Suggest setting up HubSpot mobile app for on-the-go lead management
==================================================
```

---

## Failure handling

| Failure | Action |
|---|---|
| MCP returns auth error | Stop. Ask Aaron to reconnect the HubSpot MCP for the client's account |
| Pipeline creation blocked (free tier) | Use default pipeline, rename stages, document limitation |
| Custom property already exists | Skip creation, verify value is correct |
| Company already exists | Update existing record rather than creating duplicate |
| Form GUID not available | Document in handover that client must create the form manually |
