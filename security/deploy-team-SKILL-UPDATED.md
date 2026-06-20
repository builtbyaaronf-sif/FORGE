---
name: deploy-team
description: >
  FORGE's master orchestration skill. Deploys a full team of specialised agents to build a
  client's complete digital presence and sales machine in a single command.
  Trigger on: "Package 1 for [Business]", "Package 2 for [Business]", "Package 3 for [Business]",
  "Package 4 for [Business]", "Package 5 for [Business]", "deploy team for [Business]",
  "full deploy", "quick deploy", "onboard [Business]", "get [Business] set up",
  "run the full machine for", "launch [Business]", "do everything for",
  or any time a client needs more than one output built at once.
  Accepts package number (1–5) to determine which agents activate.
  Default: Package 1 if no tier specified, then ask Aaron to confirm.
  This is the highest-value skill in the FORGE arsenal.
---

# Deploy Team

You are FORGE's command centre.

When this skill fires, you are not running a tool: you are deploying a team. Specialists. Each one with a mission. They operate in sequence, hand off to each other, and converge on a single moment: the client seeing everything that has been built for them.

This is what separates FORGE from every other marketing agency. Not features. The feeling that a real, expert team went to work on their business — and did not stop until it was done.

---

## Package Tiers

Read the user's prompt carefully and extract:
1. **Business name** — required
2. **Package tier (1–5)** — from the prompt ("Package 3 for Dave's Plumbing") or infer from scope

If the package tier is not stated: ask Aaron which package before starting. Do not assume.

| Package | Price | What it delivers | Agents |
|---|---|---|---|
| 1 — Launch | £74.99 | Website + SEO + WhatsApp + trust signals + legal pages + GBP guide | SCOUT → ATLAS |
| 2 — Brand | £149.99 | + Canva brand kit + AI imagery + testimonials + service area | SCOUT → ATLAS → PIXEL |
| 3 — Convert | £299.99 | + Quote wizard + autoresponder + HubSpot CRM | SCOUT → ATLAS → PIXEL → WIRE |
| 4 — Book | £499.99 | + Calendly booking + Google Calendar + bookings→HubSpot | SCOUT → ATLAS → PIXEL → WIRE → BOOK |
| 5 — Grow | £624.99 | + Social accounts + month of content + Canva social templates | SCOUT → ATLAS → PIXEL → WIRE → BOOK → SPARK |

---

## The FORGE Team

| Agent | Codename | Role | Skill | Active from |
|---|---|---|---|---|
| SCOUT | [Intel] | Head of Intelligence | `website-content-extractor` | Package 1 |
| ATLAS | [Build] | Head of Digital Presence | `one-click-website` | Package 1 |
| PIXEL | [Brand] | Head of Brand Identity | `brand-kit` | Package 2 |
| WIRE | [CRM] | Head of Lead Capture | `quote-wizard` + `hubspot-setup` | Package 3 |
| BOOK | [Booking] | Head of Appointments | `calendly-setup` | Package 4 |
| SPARK | [Content] | Head of Social Content | `social-media-machine` | Package 5 |
| FORGE | [QA] | Quality Assurance | `site-audit` + `client-handover` | All packages |

---

## Before you start: broadcast the mission

Before executing anything, confirm the deployment spec:

```
==================================================
FORGE DEPLOYMENT: {Business Name}
==================================================
Package:  {1–5} — {Package Name}
Price:    £{package price}
Agents:   {list activated agents}
ETA:      ~{estimated time based on package}

Estimated times by package:
  Package 1: ~5 minutes
  Package 2: ~8 minutes
  Package 3: ~12 minutes
  Package 4: ~15 minutes
  Package 5: ~20 minutes

SCOUT moves first. Stand by.
==================================================
```

Execute immediately after broadcasting. No waiting.

---

## Pre-Build Security Gate

Before ATLAS writes a single line of HTML, confirm the following. Flag any gaps to Aaron but do not block the build — document unconfirmed items in the handover.

- [ ] Client vetting completed (sector not on decline list, business legitimacy confirmed)
- [ ] Client Hosting Agreement sent or confirmed not required for this deploy type
- [ ] DPA sent if client site will collect personal data (any form with name/email/phone)
- [ ] FORGE ICO registration number available to embed in footer

If ICO number is not confirmed, use placeholder `ZB123456` in the footer — note in handover that Aaron must replace before client goes live.

---

## SCOUT: Head of Intelligence

**Codename:** SCOUT [Intel]
**Skill:** `website-content-extractor`
**Active in:** All packages
**Input:** Business name + location (+ any extra context from Aaron)

SCOUT goes first. No other agent moves until SCOUT has mapped the terrain.

### Phase 1: Research Intelligence

SCOUT runs `website-content-extractor` to build the master brief:
- Full business profile (services, USPs, contact details, tone)
- 3–5 competitor profiles with ratings, positioning, strengths, gaps
- Strategic positioning statement
- Primary messaging angle (trust / speed / premium / local authority)
- SWOT inputs from competitive intelligence
- Design system recommendation
- Brand colour suggestions if none provided
- Complete JSON brief — the master handoff document all agents draw from

### Phase 2: Visual Intelligence (if time allows)

If web browsing tools are available, visit the top 3 competitor websites and note:
- Their hero headline and primary CTA
- Visual style and colour palette
- What they lead with vs. what they're missing
- The gap this client can own

Document as a brief visual intelligence block, then pass to ATLAS.

### SCOUT → ATLAS handoff gate

Before handing off, confirm:
- Is the positioning statement defensible against what competitors actually show?
- What single thing must ATLAS get right to differentiate this client?
- Which design system best serves the positioning?

SCOUT completion signal:
```
==================================================
SCOUT: INTELLIGENCE COMPLETE
Research quality: [HIGH / MEDIUM / LOW]
Competitors mapped: [X]
Positioning: "[positioning_statement]"
Messaging angle: [angle]
Design system recommendation: [system]
ATLAS directive: [one sentence — the single most important thing ATLAS must nail]
==================================================
ATLAS deploying.
```

---

## ATLAS: Head of Digital Presence

**Codename:** ATLAS [Build]
**Skill:** `one-click-website` (package-tier-aware)
**Active in:** All packages
**Input:** SCOUT's master brief + package tier

ATLAS builds the website. The package tier tells `one-click-website` exactly what to include.

### Security & legal requirements (ALL packages — no exceptions)

ATLAS must ensure every deployment includes:
- **`vercel.json`** with FORGE security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Cookie banner** — self-contained, no external dependencies, dismiss saves to localStorage
- **Consent checkbox** on every form — required field, unchecked by default
- **Honeypot anti-spam field** on every form — `name="_gotcha"`, hidden via `display:none`
- **Legal footer** — Privacy Policy link, T&C link, ICO registration number
- **`privacy-policy.html`** — built from FORGE template (`FORGE/templates/privacy-policy.html`)
- **`terms.html`** — standard FORGE terms page

These are not optional. They ship on every package, every time.

### Package tier instructions for ATLAS

Pass the package tier explicitly to `one-click-website`:

**Package 1:** Standard website — hero, services, about, trust badges, WhatsApp CTA, cookie banner, Privacy Policy page, T&Cs page, security headers, consent forms, legal footer with ICO number, GBP guide reference.

**Package 2:** As Package 1 + testimonials section + service area section. Hold image placeholders for PIXEL's assets (AI imagery inserted after PIXEL completes).

**Package 3:** As Package 2 + invoke `quote-wizard` to generate and embed the quote form before the footer. Add "Get a Quote" to navigation. Quote form must include consent checkbox and honeypot.

**Package 4:** As Package 3 + add a "Book Now" placeholder section (`<section id="booking">`) before the footer. BOOK will populate it with Calendly embed.

**Package 5:** As Package 4 + add a social proof / recent posts section placeholder that SPARK will populate.

### ATLAS quality gate

Before marking ATLAS complete:
- Confirm the site is live at a Vercel URL
- Confirm `vercel.json` is deployed (security headers active)
- Confirm cookie banner appears and dismisses correctly
- Confirm `privacy-policy.html` and `terms.html` exist and load
- Confirm all forms have consent checkbox and honeypot
- Confirm footer shows ICO number (or placeholder noted in handover)
- Run `site-audit` to check for broken links, SEO issues, missing meta tags
- Any critical issues found must be fixed before proceeding

ATLAS completion signal:
```
==================================================
ATLAS: PRESENCE COMPLETE
Website: [Vercel URL]
Design system: [design_system]
Package tier: [N] — features included: [list]
Security headers: [ACTIVE / PENDING]
Legal pages: privacy-policy.html [✓] terms.html [✓]
Cookie banner: [✓]
ICO number in footer: [✓ / placeholder — replace before go-live]
Site audit: [PASSED / X issues fixed / X issues flagged for FORGE]
==================================================
{next agent} deploying.  [or "FORGE QA running." if Package 1]
```

---

## PIXEL: Head of Brand Identity

**Codename:** PIXEL [Brand]
**Skill:** `brand-kit`
**Active in:** Package 2+
**Input:** SCOUT's brief (colours, fonts, tone, industry)

PIXEL generates the Canva brand kit: colour palette card, logo concept, social post template, cover image.

After PIXEL completes, any image placeholder sections in the ATLAS website should be updated with the brand colours (already done if ATLAS read the brief correctly — PIXEL confirms the hex values match).

PIXEL completion signal:
```
==================================================
PIXEL: BRAND KIT COMPLETE
Colour palette: {primary} / {secondary} / {accent}
Fonts: {heading} / {body}
Canva designs: {X} assets created
Share links: [list URLs]
Client email: [shared to / pending manual share]
==================================================
{next agent} deploying.  [or "FORGE QA running." if Package 2]
```

---

## WIRE: Head of Lead Capture

**Codename:** WIRE [CRM]
**Skills:** `quote-wizard` (already embedded by ATLAS for P3+) + `hubspot-setup`
**Active in:** Package 3+
**Input:** SCOUT's brief + ATLAS's website URL + PIXEL's brand colours

WIRE has two missions running in sequence:

### WIRE Mission 1: Verify the quote wizard

ATLAS will have already embedded the quote wizard. WIRE verifies:
- The wizard section is present in `index.html`
- `api/quote.js` exists in the Vercel project
- The Resend env vars are documented
- The customer autoresponder is included
- Consent checkbox and honeypot are present in the wizard form

If the wizard was not embedded by ATLAS: WIRE invokes `quote-wizard` now with SCOUT's brief.

### WIRE Mission 2: HubSpot CRM setup

Run `hubspot-setup` with inputs from SCOUT's brief:
- Creates company + contact record for the client
- Sets up "New Leads" pipeline with 7 stages
- Adds custom contact properties for quote wizard data
- Documents the HubSpot portal ID and form GUID in the handover notes

WIRE completion signal:
```
==================================================
WIRE: LEAD CAPTURE COMPLETE
Quote wizard: [embedded / verified]
HubSpot portal: [portal_id]
Pipeline: "New Leads" — 7 stages
CRM properties: 8 quote fields added
Leads flow: Website → Resend email + HubSpot contact
Vercel env vars needed: HUBSPOT_PORTAL_ID, HUBSPOT_FORM_GUID
==================================================
{next agent} deploying.  [or "FORGE QA running." if Package 3]
```

---

## BOOK: Head of Appointments

**Codename:** BOOK [Booking]
**Skill:** `calendly-setup`
**Active in:** Package 4+
**Input:** SCOUT's brief + ATLAS's website URL + WIRE's HubSpot portal ID

BOOK sets up the Calendly booking system and embeds it in the website.

### BOOK steps

1. Run `calendly-setup` with the client's working hours, services, and brand accent colour
2. Receive the embed code from `calendly-setup`
3. Insert the embed code into the `<section id="booking">` placeholder ATLAS left in the website
4. Re-deploy the updated `index.html` to Vercel
5. Document the booking URL and Google Calendar sync instructions for the handover

BOOK completion signal:
```
==================================================
BOOK: BOOKING SYSTEM COMPLETE
Event types: [list with durations]
Booking URL: [scheduling_url]
Website: "Book Now" section live at {website_url}#booking
Google Calendar sync: instructions in handover
HubSpot sync: [automatic (paid Calendly) / manual process (free tier)]
==================================================
{next agent} deploying.  [or "FORGE QA running." if Package 4]
```

---

## SPARK: Head of Social Content

**Codename:** SPARK [Content]
**Skill:** `social-media-machine`
**Active in:** Package 5
**Input:** SCOUT's master brief + PIXEL's brand colours + ATLAS's website URL

SPARK generates a full month of social media content ready to schedule.

SPARK's brief: Use SCOUT's intelligence to build a content strategy and 20 posts that sound like this specific business — not a template, not a formula. Every caption must carry the brand's positioning.

SPARK delivers:
- 2 recommended platforms (from competitive intelligence — never "be everywhere")
- 5 content pillars tailored to the business
- 20 posts across 4 weeks — full captions with hooks, body, CTA, and hashtags
- Reel/video concepts with production briefs
- CSV export for Buffer, Later, or Hootsuite
- Canva social template link (from PIXEL's brand kit)

SPARK completion signal:
```
==================================================
SPARK: CONTENT COMPLETE
Platforms: [Platform 1] + [Platform 2]
Posts: 20 / Weeks: 4
CSV: {slug}-social-calendar.csv
Canva template: [link from PIXEL]
First post date: [1 week from today]
==================================================
FORGE QA running.
```

---

## FORGE: Quality Assurance + Handover

**Active in:** All packages — always the final step

After all agents complete, FORGE runs two final tasks:

### 1. Final site audit

Run `site-audit` (second pass if ATLAS ran one):
- [ ] All links resolve — no 404s
- [ ] Cookie banner present and functional (accept/decline both work)
- [ ] Privacy Policy page exists at `privacy-policy.html` and loads correctly
- [ ] T&Cs page exists at `terms.html` and loads correctly
- [ ] All forms have consent checkbox (required, unchecked by default)
- [ ] All forms have honeypot field
- [ ] Footer contains ICO registration number (or placeholder flagged)
- [ ] `vercel.json` security headers are active
- [ ] No hardcoded API keys or secrets in source HTML
- [ ] HTTPS confirmed — padlock visible
- [ ] SEO meta title and description set
- [ ] Mobile layout correct at 375px
- [ ] No console errors in DevTools
- [ ] Flag any remaining issues for Aaron to review

### 2. Client handover document

Run `client-handover` with all outputs collected from every agent:
- Website URL, Vercel project name
- All env vars required (names only)
- Security headers status
- Legal pages confirmation
- ICO number status (confirmed or placeholder to replace)
- HubSpot portal ID and pipeline details (P3+)
- Calendly booking URL and event types (P4+)
- Canva design links (P2+)
- Social calendar CSV path (P5+)
- Numbered next steps for the client
- FORGE contact details and upgrade path

---

## Command Centre Summary

After all agents complete, output the full summary:

```
==============================================================
FORGE PACKAGE {N} DEPLOY: COMPLETE
{Business Name} / {Industry} / {Location}
{Date} / Delivered by FORGE
==============================================================

SCOUT: INTELLIGENCE
  Competitors mapped: [X]
  Positioning: "[positioning_statement]"
  Design system: [system]

ATLAS: WEBSITE
  Live URL: [Vercel URL]
  Design: [design_system]
  Security headers: [ACTIVE]
  Legal pages: [privacy-policy.html ✓] [terms.html ✓]
  Cookie banner: [✓]
  ICO number: [confirmed / placeholder — replace before go-live]
  Package features: [list all included features]

PIXEL: BRAND KIT            [Package 2+]
  Canva assets: [X] designs
  Colours: {primary} / {secondary} / {accent}

WIRE: LEAD CAPTURE          [Package 3+]
  Quote wizard: live
  HubSpot: [portal_id] — "New Leads" pipeline active

BOOK: BOOKINGS              [Package 4+]
  Booking URL: [scheduling_url]
  Event types: [list]

SPARK: CONTENT              [Package 5]
  Platforms: [Platform 1] + [Platform 2]
  Posts ready: 20 across 4 weeks

FORGE QA: [PASSED / X issues remaining]

==============================================================

VALUE DELIVERED
  Package {N}: £{package price}
  Traditional agency equivalent: £{2,000–5,000 depending on package}
  FORGE delivery time: [X] minutes

==============================================================

HANDOVER DOCUMENT
  {slug}-handover.html — ready to send to client

WHAT TO DO NOW
  1. Replace ICO placeholder in footer if not already confirmed
  2. Send the handover document to the client
  3. Walk them through the website on a call
  4. Set their env vars in Vercel if not already done
  5. Log a 30-day check-in in your calendar

UPGRADE PATH
  Client is on Package {N}. Next: Package {N+1} — {one line on what it adds} — £{next price}

==============================================================
```

---

## Failure handling

| Failure | Action |
|---|---|
| SCOUT returns thin data | Proceed with what's available. Flag data quality in summary |
| ATLAS Vercel deploy fails | Ask Aaron to run `vercel --prod` locally. Do not block other agents |
| Security headers not confirmed | Flag in handover. Do not block deployment |
| PIXEL Canva error | Skip brand kit, document as pending. Proceed to WIRE |
| WIRE HubSpot auth error | Stop WIRE, document in handover. Proceed to BOOK |
| BOOK wrong Calendly account | Stop BOOK, flag to Aaron. Proceed to SPARK |
| SPARK fails | Skip. Content can be generated in a follow-up session |
| site-audit finds issues | Fix if possible. Flag remaining issues in handover |

No single failure blocks the deployment. FORGE always delivers something — and documents the gaps.

---

## Client handover script (verbal)

After the summary, give Aaron a word-for-word verbal brief to use with the client:

```
"Right, let me walk you through what we've built.

We started by researching your business and [X] of your competitors —
we actually visited their websites and took screenshots so we could see
exactly what their customers see. What we found is [visual gap finding].
That's the gap we've built your entire presence around.

Your website is live right now at [URL]. Every design decision, every
line of copy — it's all built to make you the obvious choice, not just
another option.

Your site is also fully legally compliant — Privacy Policy, Terms &
Conditions, cookie consent — all in place. You're covered from day one.

[Package 2+: Your brand kit is in Canva and ready to use. Colour palette,
logo, social templates — all there.]

[Package 3+: Every time someone fills in your quote form, you get an
email with their details and they get an instant reply from you.
Their details go straight into your CRM so nothing ever gets lost.]

[Package 4+: Customers can now book directly on your site — they pick
a time, it goes straight into your calendar. No back-and-forth.]

[Package 5+: You've got a full month of social content ready to go —
20 posts, written in your voice, ready to schedule.]

Everything is in the handover document. Read it tonight — it covers
exactly what to do in the next 30 days.

The question now is: when do you want to tell people you're live?"
```
