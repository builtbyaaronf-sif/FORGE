# FORGE CASE STUDY 001
## "The Agency That Built Itself"
### How FORGE Used Its Own Agentic Machine to Deploy Its Complete Digital Stack

**Date:** 19 June 2026
**Author:** Aaron F. — builtbyaaronf@gmail.com
**Status:** 🔴 LIVE — Running Log

---

## THE PREMISE

Before FORGE signed a single client, it ran its own product on itself.

Every tool, every skill, every agent FORGE sells to London tradespeople — the website builder, the brand kit, the CRM pipeline, the social content engine, the comment reply bot, the subscription billing system — FORGE used to build FORGE.

This is the origin story. This document is the live record.

---

## WHY THIS MATTERS

Most agencies talk about what they can do. FORGE proved it.

The stack that powers a Package 5 client deployment — £624.99 worth of agentic marketing infrastructure — was built, tested, and deployed on FORGE's own business before it was ever sold to anyone else.

Equivalent cost to commission this externally from a traditional agency: **£15,000–£25,000.**
Total agentic build time across sessions: **approximately 3–4 hours.**

---

## THE STACK DEPLOYED

| Layer | Technology | Status |
|---|---|---|
| Hosting | Vercel (serverless) | ✅ Live |
| Frontend | Single-page HTML (inline CSS + JS) | ✅ Live at forgeisagentic.tech |
| AI Model | Claude Sonnet 4.6 (Anthropic) | ✅ Active |
| Batch Processing | Anthropic Messages Batch API | ✅ Built |
| Email | Resend | ✅ Live |
| Payment (one-time) | PayPal Orders API | ✅ Live |
| Payment (subscription) | PayPal Billing Plans | ✅ Built |
| Post-payment agent | Tavus CVI (AI video welcome) | ✅ Live |
| CRM | HubSpot | ✅ Company + contacts live |
| Brand assets | Canva (3 assets) | ✅ Live |
| Booking | Calendly | ✅ Embedded in site |
| Database | Supabase (PostgreSQL) | ✅ Tables created 19 Jun 2026 |
| Token vault | AES-256-GCM encrypted | ✅ Schema live |
| GBP data | RapidAPI Google Maps | ✅ Env var set |
| Social publishing | Mixpost (self-hosted) | ⏳ Hetzner VPS pending |
| Comment reply engine | Claude Haiku via /api/spark-listener | ⏳ Deploy pending |
| Social distribution | Publisher.js (5 platforms) | ⏳ Tokens pending |

---

## FORGE SOCIAL MEDIA STACK

| Platform | Handle | Status |
|---|---|---|
| Instagram | @forgeisagentic | ✅ Created 19 Jun 2026 |
| TikTok | @forgeisagentic | ✅ Created 19 Jun 2026 |
| Facebook | FORGE Agentic Marketing | ✅ Created 19 Jun 2026 |
| LinkedIn | FORGE Agentic Marketing | ✅ Created 19 Jun 2026 |
| YouTube | FORGE Agentic Marketing | ⏳ Pending eligibility |

---

## PACKAGE TIERS (as of 19 June 2026)

| Package | Price | What's included |
|---|---|---|
| 1 — Launch | £74.99 | Website + QA |
| 2 — Brand | £149.99 | + Canva brand kit |
| 3 — Convert | £299.99 | + Quote wizard + HubSpot CRM |
| 4 — Book | £499.99 | + Calendly booking system |
| 5 — Grow | £624.99 | + Social content + comment reply engine |

---

## SESSION LOG

---

### SESSION 1 — Foundation
**Date:** Pre-19 June 2026
**What was built:**
- FORGE main website (`index.html`) — live at forgeisagentic.tech
- PayPal webhook (`/api/paypal-webhook`) — one-time payment handler
- Tavus CVI integration (`/api/tavus-conversation`) — post-payment AI video agent
- Build status page (`build-status.html`)
- Checkout flow (`start.html`) — 7-step package selector + PayPal integration
- `vercel.json` with security headers
- ICO registration completed — ZC176397, expires 16 Jun 2027

**Key decisions:**
- Single-page HTML architecture (no framework) — fast, zero dependencies, Vercel-native
- PayPal `custom_id` pattern — client data encoded as base64 JSON, decoded on webhook receipt
- Tavus persona locked to FORGE brand voice — does not deny being AI if asked directly

---

### SESSION 2 — Intelligence & Scale
**Date:** Pre-19 June 2026
**What was built:**
- Batch runner CLI (`batch-runner/`) — async multi-client processing via Anthropic Batch API
- SCOUT engine — competitive intel via RapidAPI Google Maps footprint extractor
- GEO strategy (`GEO_STRATEGY.md`) — T1/T2/T3 borough targeting tiers for London
- Analytics report generator (`REPORT_TEMPLATE.js`) — Creative Dark HTML email reports
- Env provisioning matrix (`env-provision.js`) — sole trader vs limited company setup paths
- SPARK listener (`listener.js`) — autonomous comment reply engine (Claude Haiku)
- SPARK publisher (`publisher.js`) — 5-platform social distribution (Promise.allSettled)
- Data architecture (`SCHEMA.md`) — 3-table Supabase schema, AES-256-GCM token vault
- Business type toggle added to checkout — sole trader vs limited company

**Key decisions:**
- Haiku for comment replies (20× cheaper than Sonnet, fast enough for real-time webhooks)
- `Promise.allSettled` in publisher — one platform failing never blocks the others
- Always HTTP 200 from listener — matches PayPal webhook pattern, prevents retry queue bloat
- Token encryption key lives in Vercel env vars only — DB compromise ≠ token exposure

---

### SESSION 3 — Infrastructure & Case Study
**Date:** 19 June 2026
**What was built:**

**09:00 — Pre-flight decisions:**
- Social media stack finalised: Instagram, Facebook, LinkedIn, TikTok, YouTube (pending)
- Package 5 repriced from £749.99 → £624.99 across all 10 files
- Supabase project confirmed: `jhsswflacyzwdulokgrn` (ap-northeast-2 / Seoul)

**Infrastructure deployed:**
- Supabase `clients` table — tenant anchor, billing-tier matched
- Supabase `client_authorizations` table — OAuth token vault, per-client isolation
- Supabase `token_audit_log` table — immutable event log for all token operations
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` added to Vercel env vars
- `SPARK_LISTENER_SECRET` generated + added to Vercel env vars
- Site redeployed to production (`vercel --prod`)

**Social accounts created:**
- Instagram: @forgeisagentic ✅
- TikTok: @forgeisagentic ✅
- Facebook: FORGE Agentic Marketing ✅
- LinkedIn: FORGE Agentic Marketing ✅

---

## SPARK CONTENT CALENDAR — COMPLETE ✅

**Generated:** 19 June 2026
**File:** `forge-social-content-pack.md` + `forge-social-calendar-month1.csv`

20 posts. 4 weeks. 4 platforms. All captions written. CSV export ready for Buffer/Later/Hootsuite.

**Platform distribution:**
- Instagram: 7 posts (images + carousels)
- Facebook: 6 posts (text + images)
- LinkedIn: 4 posts (text-heavy, B2B credibility)
- TikTok: 4 Reels (deploy demos, education, direct offer)

**Content pillar breakdown:**
- Proof & Results: 6 posts
- Education: 6 posts
- Behind the Machine: 4 posts
- Trust & Authority: 3 posts
- Direct Offer: 3 posts (Weeks 2 + 4)

**First post:** Monday 23 June 2026
**Reel priority:** Post 4 (deploy speed demo) → highest viral potential

---

## SPARK LISTENER — DEPLOYED ✅

**File:** `api/spark-listener.js`
**Deployed:** 19 June 2026
**What it does:** Receives social comment webhooks → spam gate → fetches client context from Supabase → generates 3-sentence Claude Haiku reply → posts back via platform router
**Platforms covered:** Meta, LinkedIn, TikTok, Google Business, YouTube
**Auth:** `SPARK_LISTENER_SECRET` shared secret header
**Status:** Live on Vercel. Awaiting social platform token registration to activate.

---

## HUBSPOT 7-STAGE PIPELINE — COMPLETE ✅

**Confirmed:** 19 June 2026
**Pipeline name:** Sales Pipeline
**Stages:** New Enquiry → First Contact Made → Discovery Complete → Proposal Sent → Negotiation → Closed Won → Closed Lost
**Current deals:** 3 (including "FORGE — Full Digital Presence (Self)" — Closed Won at $1,500)
**Total pipeline value:** $2,250

---

## FINAL NUMBERS (to be completed)

| Metric | Value |
|---|---|
| Total agentic build time | ~3–4 hours |
| Files created | TBC |
| API integrations live | TBC |
| Equivalent agency cost | £15,000–£25,000 |
| Actual cost to build | ~£0 (Anthropic API costs only) |
| Site live at | forgeisagentic.tech |
| First post date | 23 June 2026 |

---

## FOR THE YOUTUBE VIDEO

**Working title:** "I Built a Marketing Agency in 4 Hours Using AI — Then Used It On Itself"

**Hook:** "Most agencies sell you a dream. I built the entire machine first — payment system, AI video agent, social content engine, comment reply bot — before I signed a single client. Here's exactly how."

**Key moments to show:**
1. The checkout flow — client picks a package, pays, gets an AI video call
2. SPARK generating 20 posts in seconds
3. The comment reply engine responding autonomously
4. The Supabase token vault architecture
5. The final deployed stack — live at forgeisagentic.tech

**CTA:** "This is Package 5. It costs £624.99. Want it for your business?"

---

*FORGE Agency | builtbyaaronf@gmail.com | forgeisagentic.tech*
*Case Study 001 — Running Log | Started 19 June 2026*
