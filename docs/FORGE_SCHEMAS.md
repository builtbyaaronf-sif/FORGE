# FORGE — Data Schemas
**All data structures used across the FORGE system.**
**Last updated: 18 June 2026**

---

## 1. Client Brief (`brief.json`)

Produced by Phase 1 of `forge-runner.js` via `p1_researchBrief` prompt. Saved to `batch-runner/outputs/[slug]/brief.json`. This is the master handoff document — every downstream agent reads from it.

```jsonc
{
  "business_name": "Dave's Plumbing",           // string — required
  "slug": "daves-plumbing-london",              // string — kebab-case, no spaces
  "location": "London, UK",                     // string
  "industry": "plumber",                        // string — matches design system + trade-questions.md
  "tagline": "London's emergency plumber.",     // string — one punchy hero line
  "positioning_statement": "...",               // string — full sentence
  "primary_messaging_angle": "Speed + Trust",  // string

  "services": [
    {
      "name": "Boiler Service",                 // string
      "description": "One line description"    // string
    }
  ],

  "usps": ["USP 1", "USP 2", "USP 3"],         // string[] — 3 items

  "about": "2–3 sentence about the business.", // string

  "competitors": [
    {
      "name": "Competitor Name",               // string
      "strength": "What they do well",         // string
      "gap": "Their weakness to exploit"       // string
    }
  ],

  "swot": {
    "strengths":     ["S1", "S2", "S3"],        // string[]
    "weaknesses":    ["W1", "W2"],              // string[]
    "opportunities": ["O1", "O2", "O3"],        // string[]
    "threats":       ["T1", "T2"]              // string[]
  },

  "design_system":  "Dark Bold",               // string — one of 6 named systems
  "accent_colour":  "#F59E0B",                 // string — hex
  "canvas_colour":  "#0A0A0A",                 // string — hex

  "phone":  "020 1234 5678",                   // string — may be "inferred" if not found
  "email":  "hello@business.co.uk",            // string — may be "inferred"
  "data_quality": "inferred" | "verified"      // string — flag for SCOUT confidence
}
```

**Notes:**
- `data_quality: "inferred"` = Claude synthesised the data from competitor research. Treat as draft.
- `data_quality: "verified"` = Data came from a real source (website, Google Business, etc).
- The `slug` must be globally unique across all client outputs. Format: `[business-name]-[location]` lowercased and hyphenated.

---

## 2. Design System Object

Produced by Phase 0 of `forge-runner.js` via `p0_designSystem` prompt. Also embedded in `brief.json`.

```jsonc
{
  "system":        "Dark Bold",     // string — named design system
  "canvas":        "#0A0A0A",       // string — background hex
  "accent":        "#F59E0B",       // string — primary CTA + highlight hex
  "ink":           "#FFFFFF",       // string — primary text colour
  "surface":       "#141414",       // string — card/section background
  "tagline_style": "bold, direct, local trades",  // string — copy tone hint
  "cta_style":     "white pill buttons"           // string — button style hint
}
```

**6 named systems:**

| system | canvas | accent | ink |
|---|---|---|---|
| `Dark Bold` | `#0A0A0A` | `#F59E0B` | `#FFFFFF` |
| `Light Luxury` | `#FDFCFB` | `#9B7EBD` | `#1A1A1A` |
| `Warm Artisan` | `#FEFBF6` | `#C8773A` | `#1A1A1A` |
| `Dark Precision` | `#08090A` | `#5E6AD2` | `#FFFFFF` |
| `Clean Pro` | `#FFFFFF` | `#0071E3` | `#1A1A1A` |
| `Creative Dark` | `#090909` | `#FF3BFF` | `#FFFFFF` |

FORGE brand uses `Creative Dark` with accent overridden to `#0099FF`.

---

## 3. Batch Job State (`job.json`)

Produced by `forge-runner.js` at batch submission. Updated by `forge-collect.js` on completion. Saved to `batch-runner/outputs/[slug]/job.json`.

```jsonc
{
  "batch_id":     "batch_01abc...",           // string — Anthropic Batch API ID
  "slug":         "daves-plumbing-london",    // string — matches output dir name
  "business_name": "Dave's Plumbing",        // string
  "location":     "London, UK",              // string
  "industry":     "plumber",                 // string
  "design_system": { /* Design System Object */ },
  "brief_path":   "outputs/daves-plumbing-london/brief.json",  // string — relative path from batch-runner/
  "submitted_at": "2026-06-18T09:00:00.000Z",  // ISO 8601
  "completed_at": "2026-06-18T09:45:00.000Z",  // ISO 8601 — added by forge-collect.js
  "status":       "pending" | "complete",       // string
  "phases_remaining": ["P3_canva", "P4_hubspot", "P2b_vercel"]  // string[] — MCP phases to run manually
}
```

**Phase identifiers:**

| ID | Phase | Tool |
|---|---|---|
| `P2_website` | Website HTML (batch) | Anthropic Batch API |
| `P5_strategy` | Strategy pack HTML (batch) | Anthropic Batch API |
| `P3_canva` | Canva brand kit (manual MCP) | Canva MCP |
| `P4_hubspot` | HubSpot CRM (manual MCP) | HubSpot MCP |
| `P2b_vercel` | Vercel deploy (manual) | Vercel CLI / MCP |

---

## 4. PayPal `custom_id` Payload

Encoded as base64 JSON in the PayPal order's `custom_id` field. Decoded in `/api/paypal-webhook.js`.

```jsonc
// Decoded from: Buffer.from(custom_id, 'base64').toString('utf8')
{
  "name":     "Dave's Plumbing",       // string — business name
  "location": "London",                // string
  "email":    "dave@example.com",      // string — client email for confirmation
  "pkg":      "p1" | "p2" | "p3" | "p4" | "p5"  // string — package tier
}
```

**Package codes:**

| Code | Name | Price |
|---|---|---|
| `p1` | Launch | £74.99 |
| `p2` | Brand | £149.99 |
| `p3` | Convert | £299.99 |
| `p4` | Book | £499.99 |
| `p5` | Grow | £624.99 |

**Security note:** This payload is not signed independently — it relies on PayPal webhook signature verification. Always verify the webhook signature before decoding. The `if (hasCredentials)` guard in `paypal-webhook.js` skips verification in dev; do not deploy without credentials set.

---

## 5. Quote Wizard Submission Payload

Sent from the quote wizard frontend to `/api/quote` via `fetch()` POST with `Content-Type: application/json`.

```jsonc
{
  "customerName":     "John Smith",              // string — required
  "customerPhone":    "07700 900000",            // string — required
  "customerEmail":    "john@example.com",        // string — required
  "customerPostcode": "SW1A 1AA",               // string — optional
  "services":         ["Boiler Service", "Leak Repair"],  // string[] — required, min 1
  "description":      "My boiler stopped working last night.",  // string — required
  "followups": [
    {
      "question": "When did the issue start?",  // string
      "answer":   "Yesterday evening"           // string
    }
  ]
}
```

**Routing rules:**

| Condition | Route |
|---|---|
| `HUBSPOT_FORM_GUID` present in brief | HubSpot embedded form JS |
| `whatsapp_number` present in brief | `wa.me` URL, open in new tab |
| Default | POST to `/api/quote` → Resend email |

**Vercel env vars (email routing):**
```
RESEND_API_KEY      — FORGE shared key (see security note in CLAUDE.md)
QUOTE_TO_EMAIL      — client's notification email
BUSINESS_NAME       — client business name
```

---

## 6. Tavus Conversation Request

Sent from `build-status.html` to `/api/tavus-conversation` via POST. Body is parsed in the serverless function.

```jsonc
// Request body (from build-status.html)
{
  "pkg":      "p3",                  // string — package code
  "name":     "Dave",                // string — client first name
  "eta":      "~30 minutes",         // string — delivery estimate
  "pkgLabel": "Convert"             // string — fallback label if pkg code not recognised
}

// Response from /api/tavus-conversation
{
  "conversation_id":  "conv_01abc...",       // string — Tavus conversation ID
  "conversation_url": "https://tavus.io/...", // string — embed URL for build-status.html
  "status":           "created"              // string — Tavus status
}
```

**Vercel env vars:**
```
TAVUS_API_KEY       — from app.tavus.io
TAVUS_REPLICA_ID    — AI persona replica
TAVUS_PERSONA_ID    — optional persona config
```

**CORS:** Locked to `https://forgeisagentic.tech`. Update if adding staging or client-specific pages.

---

## 7. HubSpot Objects

### Company (FORGE internal / per-client)

Created via `mcp__ffc672be__manage_crm_objects` with `objectType: "companies"`.

```jsonc
{
  "name":       "Dave's Plumbing",           // string
  "domain":     "davesplumbing.co.uk",       // string — optional
  "industry":   "CONSTRUCTION",             // string — HubSpot industry enum
  "city":       "London",                   // string
  "country":    "United Kingdom",           // string
  "description": "Emergency plumber..."    // string
}
```

### Contact

Created via `manage_crm_objects` with `objectType: "contacts"`.

```jsonc
{
  "email":      "dave@example.com",          // string — required
  "firstname":  "Dave",                      // string
  "lastname":   "Smith",                     // string
  "phone":      "07700 900000",              // string
  "company":    "Dave's Plumbing"            // string
}
```

### Deal

Created via `manage_crm_objects` with `objectType: "deals"`.

```jsonc
{
  "dealname":   "Dave's Plumbing — Package 1",  // string
  "amount":     "74.99",                         // string — no £ sign
  "dealstage":  "closedwon",                     // string — HubSpot stage ID
  "pipeline":   "default",                       // string — pipeline ID
  "closedate":  "2026-06-18"                     // string — ISO date
}
```

### 7-Stage "New Leads" Pipeline

**Not yet created via API. Must be created manually in HubSpot UI.**

| Stage | Internal name | Position |
|---|---|---|
| New Enquiry | `new_enquiry` | 1 |
| First Contact Made | `first_contact` | 2 |
| Discovery Complete | `discovery_complete` | 3 |
| Proposal Sent | `proposal_sent` | 4 |
| Negotiation | `negotiation` | 5 |
| Closed Won | `closedwon` | 6 |
| Closed Lost | `closedlost` | 7 |

**To create via HubSpot UI:** Settings → CRM → Pipelines → Deals → Edit default pipeline → rename stages.

---

## 8. Vercel Project Config (`vercel.json`)

Current state (routes only — **security headers missing**):

```json
{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/start",        "destination": "/start.html" },
    { "source": "/privacy",      "destination": "/privacy.html" },
    { "source": "/terms",        "destination": "/terms.html" },
    { "source": "/build-status", "destination": "/build-status.html" },
    { "source": "/((?!start|privacy|terms|build-status|api).*)", "destination": "/index.html" }
  ]
}
```

**Required addition** (from `security/vercel_security_headers_snippet.json`):

```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options",    "value": "nosniff" },
      { "key": "X-Frame-Options",           "value": "SAMEORIGIN" },
      { "key": "X-XSS-Protection",          "value": "1; mode=block" },
      { "key": "Referrer-Policy",           "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy",        "value": "camera=(), microphone=(), geolocation=()" },
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
      { "key": "Content-Security-Policy",   "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.hsforms.com https://forms.hubspot.com;" }
    ]
  }
]
```

**Adjust `connect-src` per client integration** (e.g., add Calendly, Formspree, Tavus domains as needed).

---

## 9. Client Record (per deployment)

This is the logical record FORGE must maintain for every client. Currently stored as handover HTML + `FORGE_STATE.md` entries. Should eventually move to HubSpot as a custom object.

```jsonc
{
  "client_name":       "Dave's Plumbing",
  "slug":              "daves-plumbing-london",
  "package":           "p3",
  "price_paid":        "299.99",
  "deploy_date":       "2026-06-18",
  "website_url":       "https://davesplumbing.co.uk",
  "vercel_project_id": "prj_xxx",
  "hubspot_company_id": "123456789",
  "hubspot_deal_id":   "987654321",
  "canva_designs": [
    { "type": "palette_card",  "id": "DAHxxx", "url": "https://www.canva.com/d/..." },
    { "type": "instagram_post","id": "DAHxxx", "url": "https://www.canva.com/d/..." },
    { "type": "fb_cover",      "id": "DAHxxx", "url": "https://www.canva.com/d/..." }
  ],
  "calendly_booking_url": "https://calendly.com/...",  // p4+ only
  "env_vars_set": ["RESEND_API_KEY", "QUOTE_TO_EMAIL", "BUSINESS_NAME"],  // names only, never values
  "dpa_signed":   true,
  "ico_confirmed": true,
  "registrar":    "GoDaddy",
  "domain_owner": "client",
  "offboarding_date": null   // set when client leaves
}
```

---

*FORGE Agency | builtbyaaronf@gmail.com | forgeisagentic.tech*
