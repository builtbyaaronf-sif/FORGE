---
name: quote-wizard
description: >
  Generate a configurable, embeddable multi-step quote request wizard for any service or trades business website.
  Use this skill whenever a website needs a quote form, enquiry wizard, or service request form — especially for
  trades (plumbers, electricians, builders, landscapers, cleaners, decorators, roofers), beauty businesses, or any
  service business where customers need to describe their job and optionally upload photos. Trigger on: "add a quote
  form", "quote wizard", "let customers request a quote", "package 3", "package 4", "package 5", "add a form to
  the site", "quote button", "estimate request", "they want customers to upload photos", or any time a client
  website needs to capture structured service requests. Also auto-triggers as part of the one-click-website skill
  for Package 3, 4, and 5 builds. Integrates with Resend+Vercel (email), WhatsApp, or HubSpot. Output is a
  self-contained HTML/CSS/JS block that embeds directly into any website with no dependencies.
---

# Quote Wizard Skill

## What This Builds

A multi-step quote request wizard embedded directly in the client's website. Customers can:

1. Pick the services they need (from the client's service list + an "Other" option)
2. Add details + answer smart follow-up questions based on their selection
3. Upload up to 4 photos
4. Enter their contact details
5. Submit — routed to the client's preferred channel

The output is a single self-contained `<section>` block (HTML + CSS + JS inline, zero external dependencies) that drops into any `index.html`.

---

## Inputs

Gather these before generating. Most will come from the `website-content-extractor` brief if available. For anything missing, use sensible defaults or ask.

| Field | Description | Default |
|---|---|---|
| `business_name` | Client business name | Required |
| `business_type` | Trade category (see types below) | `"general"` |
| `services[]` | List of service names the client offers | Required |
| `brand_color_primary` | Primary brand hex colour | `"#1a1a2e"` |
| `brand_color_accent` | Accent/CTA hex colour | `"#e94560"` |
| `contact_method` | `"email"` \| `"whatsapp"` \| `"hubspot"` | `"email"` |
| `contact_value` | Email address, WhatsApp number (+44...), or HubSpot form ID | Required |
| `formspree_id` | Formspree form ID (for email routing + file uploads) | Required for email |

---

## Supported Business Types

Read `references/trade-questions.md` to get the smart follow-up questions for each type.

- `plumber` | `electrician` | `builder` | `landscaper` | `cleaner` | `painter` | `roofer` | `carpenter` | `tiler` | `handyman` | `beauty` | `general`

---

## Wizard Steps

### Step 1 — What do you need?
Service selection cards generated from `services[]`. Multi-select. Always include an **"Other"** card at the end.

Card design: **text only — no icons, no emojis, no decorative symbols.** Clean pill/card style, brand accent colour on selected state. Service name centred in the card, nothing else.

### Step 2 — Tell us more
- Free text textarea: *"Describe what you need in a few words…"*
- Smart follow-up fields: 1–2 questions specific to the business type. Read `references/trade-questions.md` for the right questions. Match questions to the selected services where possible — if "boiler service" selected and type is `plumber`, show boiler-specific questions.

### Step 3 — Photos (optional)
- Label: *"Upload up to 4 photos — a picture helps us give you an accurate quote"*
- Max 4 files, each max 5MB, accepted types: jpg, jpeg, png, webp, heic
- Show thumbnail preview after selection
- Clearly marked optional

### Step 4 — Your details
Name, phone, email, postcode. All required except postcode (recommended).

### Step 5 — Confirm & submit
Summary of selected services + a friendly confirmation message.
Submit button text: *"Send My Quote Request"*

---

## Contact Routing

### Email via Resend + Vercel (default for email routing)

Do **not** use Formspree. Instead, generate a `/api/quote.js` serverless function alongside the site.

Read `references/api-template.js` — copy it verbatim as `api/quote.js` in the project root. This function:
- Receives a JSON POST from the wizard
- Sends a formatted HTML notification email to the tradesperson via Resend
- Email includes the customer's phone as a `tel:` tap-to-call link and email as a `mailto:` link
- Sets `reply_to` to the customer's email so the tradesperson can respond in one tap

The wizard must submit via `fetch()` to `/api/quote` with a JSON body containing:
```json
{
  "customerName": "...",
  "customerPhone": "...",
  "customerEmail": "...",
  "customerPostcode": "...",
  "services": ["...", "..."],
  "description": "...",
  "followups": [{"question": "...", "answer": "..."}]
}
```

**Vercel environment variables** (set per client deployment, documented in the site handover):
- `RESEND_API_KEY` — FORGE's shared Resend API key
- `QUOTE_TO_EMAIL` — tradesperson's email address
- `BUSINESS_NAME` — client business name

### WhatsApp

On submit, construct a `wa.me` URL and open in a new tab. The message must be clearly structured so it reads well on the tradesperson's phone. Use WhatsApp markdown (`*bold*`, line breaks).

**Message template** (URL-encode the full text before appending to `wa.me`):
```
*New Quote Request — {business_name}*

*Customer*
{name}
{phone}
{email}
{postcode}

*Services Requested*
{service_1}
{service_2}

*Description*
"{description}"

*Additional Details*
{followup_question_1}: {answer_1}
{followup_question_2}: {answer_2}

_Reply to start the conversation. Ask the customer to send photos._
```

Notes:
- Omit postcode line if empty
- Omit Additional Details block if no follow-up answers
- The tradesperson can call/message the customer via their WhatsApp profile once in the thread
- Show a note on the Step 5 confirmation: *"You can send your photos directly in the WhatsApp conversation."*

### HubSpot

Use the HubSpot Embedded Form JS API with the provided form ID. Fields map:
- `firstname`, `lastname` (split name), `email`, `phone`, `message` (services + description + follow-ups combined into a single formatted string)

---

## Output Requirements

Generate a single `<section id="quote-wizard">` that contains:
- All CSS in a `<style>` tag scoped to `#quote-wizard`
- All JS in a `<script>` tag at the bottom of the section
- No external CDN calls, no framework dependencies
- Multi-step UX: show one step at a time, hide others with CSS classes
- Progress indicator at the top (Step 1 of 5)
- Back/Next navigation buttons

### Mobile-first design (critical)
Most customers will use this on their phone. Design for mobile first, then scale up.

- Base layout is single-column, full-width
- Service cards: 2-column grid on mobile (≤480px), up to 3 columns on wider screens
- Touch targets: buttons and cards minimum 44px tall
- Font sizes: body min 16px (prevents iOS auto-zoom on inputs), labels min 14px
- Inputs: full-width, generous padding (12px+), large enough to tap without zooming
- No horizontal scrolling at any viewport width
- Progress bar and step counter clearly visible at top on small screens
- Back/Next buttons full-width on mobile, side-by-side on desktop

### Colour application
- Primary brand colour: headings, progress bar fill
- Accent colour: selected state on service cards, CTA buttons, submit button
- Background: white or very light grey (`#f9f9f9`)
- Error states: red (`#dc2626`)

### Accessibility
- All inputs have `<label>` elements
- Focus states visible
- Error messages announced via `aria-live`

---

## Integration into Package 3, 4, and 5 Flow

### When to trigger

The quote wizard is automatically invoked when `one-click-website` is running a Package 3, 4, or 5 build. Any of these signals in the user's prompt should trigger it:
- "Package 3", "Package 4", "Package 5", "Convert", "Book", or "Grow"
- "add a quote form", "quote wizard", "lead capture", "let customers enquire"
- The brief's `package` field is `3`, `4`, or `5`
- A HubSpot CRM setup is requested alongside a website build

### Input mapping from website-content-extractor brief

No extra prompting needed — map fields directly from the brief:

| Brief field | Wizard input |
|---|---|
| `business_name` | `business_name` |
| `business_type` | `business_type` (maps to trade-questions.md) |
| `services[]` | `services[]` — used directly as wizard step 1 cards |
| `brand_color_primary` | `brand_color_primary` |
| `brand_color_accent` | `brand_color_accent` |
| `contact_email` | `contact_value` when routing = email |
| `whatsapp_number` | `contact_value` when routing = WhatsApp |
| `hubspot_form_id` | `contact_value` when routing = HubSpot |

**Routing priority:** HubSpot form ID present → HubSpot. WhatsApp number present → WhatsApp. Otherwise → email via Resend + Vercel.

### Output files

For **email routing** (default), produce two files alongside `index.html`:

1. `<section id="quote-wizard">` — embedded into `index.html` (see insertion point below)
2. `api/quote.js` — Vercel serverless function (copy verbatim from `references/api-template.js`)

For **WhatsApp or HubSpot** routing, produce only the `<section>` block.

### Insertion point in index.html

1. Insert the wizard `<section id="quote-wizard">` **between the services/about section and the contact/footer section**
2. Replace any existing `<section id="contact">` placeholder if present — the wizard IS the contact section
3. Add `<a href="#quote-wizard">Get a Quote</a>` to the site navigation alongside the other nav links

### Customer autoresponder (required for all email-routed Package 3+ builds)

After the tradesperson notification email, send a second email to the customer. Add this as a second Resend call in `api/quote.js`, immediately after the first `fetch`:

```js
// Customer autoresponder
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: `${businessName} <quotes@getforge.co.uk>`,
    to: [customerEmail],
    subject: `We've got your quote request — ${businessName}`,
    html: `<p style="font-family:sans-serif;font-size:15px;color:#333;line-height:1.6">Hi ${customerName},<br><br>Thanks for getting in touch with <strong>${businessName}</strong>. We've received your request for <strong>${(services||[]).join(', ')}</strong> and will be in touch shortly.<br><br>If you have photos to share, just reply to this email.<br><br>— The ${businessName} team</p>`,
    reply_to: toEmail,
  }),
});
```

### Vercel environment variables (email routing only)

Document these in the client handover notes — must be set in the Vercel project dashboard:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | FORGE's shared Resend API key |
| `QUOTE_TO_EMAIL` | Client's email address |
| `BUSINESS_NAME` | Client business name |

### End-to-end deployment flow

```
one-click-website receives Package 3/4/5 prompt
  → website-content-extractor produces brief (if not already done)
  → one-click-website generates base index.html (hero, services, about, footer)
  → quote-wizard reads brief → generates <section id="quote-wizard"> + api/quote.js
  → wizard section inserted into index.html between services and footer
  → "Get a Quote" nav link added
  → full project deployed to Vercel (index.html + api/quote.js + vercel.json)
  → Vercel env vars listed in handover notes
  → Live URL returned to user
```

---

## Output Files

For email routing, the skill produces **two files**:

1. `<section id="quote-wizard">` — the wizard HTML block, embedded in `index.html`
2. `api/quote.js` — the Vercel serverless function (copied verbatim from `references/api-template.js`, no modification needed)

For WhatsApp and HubSpot routing, only the wizard HTML block is produced.

---

## Reference Files

- `references/trade-questions.md` — Smart follow-up questions by business type. Read before generating Step 2.
- `references/api-template.js` — Vercel serverless function for email routing. Copy verbatim as `api/quote.js`.
