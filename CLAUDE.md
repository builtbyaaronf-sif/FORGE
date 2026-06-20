# FORGE — CLAUDE.md
**Principal AI Workspace File | Read at the start of every session.**
**Last updated: 19 June 2026**

---

## MISSION

FORGE is a fully agentic marketing agency. Target market: UK tradespeople in Greater London with no working website. Goal: become the #1 AI marketing agency in the world.

**Positioning statement:** "The world's first fully agentic marketing department for London tradespeople."

**Website:** https://forgeisagentic.tech
**Owner:** Aaron F. — builtbyaaronf@gmail.com
**Vercel project:** `prj_0gxgKYJFAfcap0zSvDm2yczzcmpx` | Team: `team_3slbSUXIc59hIfcb5hsveVLx`

---

## MY VOICE

Short sentences. Punchy. Numbers over vague claims. No filler. No "great question". No "certainly". Challenge assumptions before agreeing. If something is wrong, say it directly.

Examples of what NOT to write:
- ❌ "That's a great point, let's explore this together."
- ❌ "Certainly! Here's a comprehensive overview..."
- ❌ "There are many ways to approach this."

Examples of what to write:
- ✅ "3 issues. Here they are."
- ✅ "This is wrong. Here's why."
- ✅ "Package 3 for Dave's Plumbing. Starting now."

---

## HARD RULES

1. **Never deploy a client site that hasn't passed `site-audit`.** No exceptions.
2. **One Vercel project per client.** Named `forge-[client-slug]`. Never share.
3. **Never hardcode API keys.** All secrets in Vercel encrypted env vars only.
4. **Never register a domain under FORGE's account.** Always the client's registrar.
5. **DPA must be signed before a site processing personal data goes live.**
6. **ICO registration (FORGE's own) must be active before processing any client data.** Status: ✅ DONE — ZC176397 | FORGE AGENTIC MARKETING | Registered 17 Jun 2026 | Expires 16 Jun 2027. Renew annually at ico.org.uk/registration.
7. **PayPal webhook must always return HTTP 200** even on internal errors (prevents infinite PayPal retries). Internal errors must be logged, not swallowed.
8. **RESEND_API_KEY is currently a shared FORGE key across all clients.** This is a known security debt. Do not expand usage without addressing it first.
9. **Zero hyphens, em dashes (—), or en dashes (–) in any public-facing output.** Applies to all copy a member of the public reads: client websites, social posts, emails, proposals, handover documents, marketing material. Rewrite compound adjectives as two words ("award winning" not "award-winning"), use "to" for ranges ("£74.99 to £624.99"), restructure sentences rather than using dashes as parentheticals. Technical contexts (URL slugs, code, file paths, internal FORGE files) are exempt.
10. **Never instruct Tavus to deny being an AI if directly asked.** The current prompt says "NEVER say you are an AI unless directly asked" — this is acceptable. Do not change it to actively lie.
11. **State file is `FORGE_STATE.md`.** Read it at the start of every session. Update it at the end.
12. **Social stack is split by context.** FORGE's own accounts: Instagram + Facebook + LinkedIn (Buffer free). Client accounts: Instagram + Facebook + Google Business (Buffer free). Never put LinkedIn in a client's Buffer stack — Google Business drives local SEO for tradespeople. Never put Google Business in FORGE's own stack — LinkedIn builds agency credibility and partnerships.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Hosting | Vercel (serverless) |
| Frontend | Single-page HTML (inline CSS + JS, no framework) |
| API functions | Vercel Serverless (Node.js ESM) |
| AI model | `claude-sonnet-4-6` (via Anthropic SDK) |
| Batch processing | Anthropic Messages Batch API |
| Email | Resend (`api.resend.com`) |
| Payment | PayPal (webhook: `/api/paypal-webhook`) |
| Post-payment agent | Tavus CVI (`/api/tavus-conversation`) |
| CRM | HubSpot (MCP: `mcp__ffc672be-*`) |
| Brand assets | Canva (MCP: `mcp__4f2bce90-*`) |
| Booking | Calendly (MCP: `mcp__2091632b-*`) |
| Fonts | Inter Variable + Space Grotesk (Google Fonts) |
| Design token | `#090909` canvas, `#0099FF` accent (FORGE brand) |

---

## ARCHITECTURE — MULTI-AGENT SYSTEM

FORGE deploys agents in sequence. Each agent has a single role, a defined input, and a defined output. No agent starts until its predecessor signals completion.

```
SCOUT [Intel] → ATLAS [Build] → MARK [Logo] → PIXEL [Brand] → WIRE [CRM] → BOOK [Booking] → SPARK [Content] → FORGE [QA]
```

### Agent map

| Agent | Codename | Skill / Endpoint | Package |
|---|---|---|---|
| SCOUT | [Intel] | `website-content-extractor` | All |
| ATLAS | [Build] | `one-click-website` | All |
| MARK | [Logo] | `/api/logo-gen` + `/api/logo-confirm` + `logo-wizard.html` | All |
| PIXEL | [Brand] | `brand-kit` | 2+ |
| WIRE | [CRM] | `quote-wizard` + `hubspot-setup` | 3+ |
| BOOK | [Booking] | `calendly-setup` | 4+ |
| SPARK | [Content] | `social-media-machine` | 5 |
| FORGE | [QA] | `site-audit` + `client-handover` | All |

### MARK [Logo] — how it works

MARK runs **concurrently with the build** (non-blocking). ATLAS deploys the site immediately with a text placeholder. MARK sends the client a logo wizard link in their confirmation email. The client picks from 3 styles generated live in their exact brand colours. On confirmation, 9 named assets are generated and Aaron is notified. Site is re-deployed with the chosen logo (2 min manual step, or future Vercel API automation). 24hr timeout auto-selects Style A.

**Logo wizard:** `https://forgeisagentic.tech/logo-wizard.html?slug=SLUG&name=NAME&trade=TRADE&color=HEX&email=EMAIL&pkg=PKG`

### Package tiers

| Package | Price | Agents activated |
|---|---|---|
| 1 — Launch | £74.99 | SCOUT + ATLAS + FORGE |
| 2 — Brand | £149.99 | + PIXEL |
| 3 — Convert | £299.99 | + WIRE |
| 4 — Book | £499.99 | + BOOK |
| 5 — Grow | £624.99 | + SPARK |

---

## BATCH RUNNER — CLI PIPELINE

The batch runner (`batch-runner/`) is a Node.js CLI that uses the Anthropic Batch API for async multi-client processing. Use it for bulk operations, not for real-time Cowork sessions.

### Flow

```
forge-runner.js → Phase 0 (design system, sync) → Phase 1 (brief, sync)
               → Batch submit (P2 website + P5 strategy pack, async)
               → forge-status.js (poll until batch ends)
               → forge-collect.js (save outputs, print MCP instructions)
```

### Key files

| File | Role |
|---|---|
| `batch-runner/forge-runner.js` | Entry point. Takes business name, location, industry. |
| `batch-runner/forge-prompts.js` | All LLM prompt templates (p0, p1, p2, p5). |
| `batch-runner/forge-status.js` | Polls batch job until `ended`. |
| `batch-runner/forge-collect.js` | Saves results, prints MCP phase instructions. |
| `batch-runner/forge-setup.mjs` | One-time setup helper. |
| `batch-runner/.env` | Local secrets. **Never commit.** |
| `batch-runner/outputs/[slug]/` | Per-client outputs: `brief.json`, `job.json`, `index.html`, `strategy-pack.html` |

### Env vars required (batch-runner/.env)

```
ANTHROPIC_API_KEY=
FORGE_MODEL=claude-sonnet-4-6       # optional override
FORGE_OUTPUT_DIR=./outputs          # optional override
```

---

## SERVERLESS API FUNCTIONS

### `/api/paypal-webhook`

| Field | Value |
|---|---|
| Trigger | PayPal `PAYMENT.CAPTURE.COMPLETED` event |
| Verification | PayPal signature verification (skip if env vars absent — dev only) |
| On success | 1. Email Aaron via FormSubmit (`notifyDeployment`) 2. Email client via Resend (`sendClientConfirmation`) |
| client data | Decoded from `custom_id` (base64 JSON: `{name, location, email, pkg}`) |
| Error strategy | Always returns HTTP 200. Logs errors internally. |

**Known issue:** No idempotency guard. PayPal can retry the same event and trigger duplicate emails.

**Required Vercel env vars:**
```
PAYPAL_WEBHOOK_ID
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_MODE=live|sandbox
NOTIFY_EMAIL=builtbyaaronf@gmail.com
RESEND_API_KEY
RESEND_FROM_EMAIL
```

### `/api/tavus-conversation`

| Field | Value |
|---|---|
| Trigger | `build-status.html` on page load (POST from browser) |
| Purpose | Creates a Tavus CVI session — post-payment AI video welcome agent |
| CORS | Locked to `https://forgeisagentic.tech` |
| Max duration | 15 minutes |
| Recording | Disabled |

**Required Vercel env vars:**
```
TAVUS_API_KEY
TAVUS_REPLICA_ID
TAVUS_PERSONA_ID        # optional
```

---

## KEY FILES

| File | Purpose |
|---|---|
| `FORGE_STATE.md` | **Read this first every session.** Persistent business state checkpoint. |
| `CLAUDE.md` | **This file.** Principal workspace context. |
| `DIAGNOSTICS-001.md` | Post-mortem from Deploy #001 (FORGE internal). Architecture lessons. |
| `index.html` | FORGE main website. Built. Needs `vercel --prod` to deploy. |
| `vercel.json` | Vercel routing config. **Missing security headers** — see Security section. |
| `build-status.html` | Post-payment page. Loads Tavus video agent. |
| `start.html` | Quick-start / internal nav page. |
| `api/paypal-webhook.js` | Payment handler. |
| `api/tavus-conversation.js` | Post-payment video agent creator. |
| `forge-strategy-pack.html` | FORGE's own strategy pack. Reference for client packs. |
| `forge-chase-sales-system.md` | Sales email sequences, cadences, objection scripts. |
| `forge-social-calendar.csv` | 20-post social calendar. Starts 23 June 2026. |
| `forge-social-captions.md` | Full captions + reel scripts. |
| `security/FORGE_Hosting_Security_Policy.md` | **Read before every client deployment.** |
| `security/Vercel_Deployment_Security_Checklist.md` | Pre-deploy checklist. |
| `skills/deploy-team/SKILL.md` | Master orchestration skill. |
| `skills/one-click-website/SKILL.md` | Website builder skill. |
| `skills/brand-kit/SKILL.md` | Canva brand kit skill. |
| `skills/quote-wizard/SKILL.md` | Quote form skill. |
| `skills/hubspot-setup/SKILL.md` | HubSpot CRM setup skill. |
| `skills/calendly-setup/SKILL.md` | Booking system skill. |
| `skills/client-handover/SKILL.md` | Handover doc skill. |
| `sales/FORGE_Proposal_Template.html` | Proposal template. |

---

## DESIGN SYSTEMS

6 systems. FORGE selects the right one per client via Phase 0.

| System | Use case | Canvas | Accent |
|---|---|---|---|
| Dark Bold | Trades, construction, auto | `#0A0A0A` | `#F59E0B` amber |
| Light Luxury | Health, beauty, wellness | `#FDFCFB` | `#9B7EBD` purple |
| Warm Artisan | Food, coffee, bakery, florist | `#FEFBF6` | `#C8773A` amber |
| Dark Precision | Tech, repair, digital, IT | `#08090A` | `#5E6AD2` indigo |
| Clean Pro | Legal, finance, professional | `#FFFFFF` | `#0071E3` blue |
| Creative Dark | Agency, media, photography | `#090909` | `#FF3BFF` pink |

FORGE's own brand uses **Creative Dark** (`#090909` canvas, `#0099FF` accent, Space Grotesk + Inter).

---

## SECURITY — KNOWN GAPS & REQUIREMENTS

### Critical (fix before scaling)

1. **Shared Resend API key** — `RESEND_API_KEY` is one key used for all client quote wizard emails. If it's rate-limited or revoked, all client email pipelines die simultaneously. Solution: isolate per client or use sub-accounts.

2. **No idempotency on PayPal webhook** — Same event can fire twice and trigger duplicate emails + duplicate deployment notifications. Solution: store processed `orderId`s in KV or check for duplicates.

3. **`vercel.json` missing security headers** — The security policy mandates X-Content-Type-Options, X-Frame-Options, HSTS, CSP, etc. The current `vercel.json` has zero headers. Add the snippet from `security/vercel_security_headers_snippet.json` immediately.

4. **ICO registration not done** — FORGE is processing personal data (PayPal payments, quote form submissions). This is a legal requirement. £40. Do it this week.

### Medium priority

5. **`custom_id` injection vector** — The PayPal `custom_id` carries base64-encoded client data. Decoded without validation. Malformed or injected `custom_id` values could cause notification email issues. Add input validation on the decoded object.

6. **No rate limiting on `/api/tavus-conversation`** — Any POST to this endpoint creates a paid Tavus session. No auth, no rate limit. Add a shared secret header check.

7. **`PAYPAL_MODE` defaults to sandbox silently** — If `PAYPAL_MODE` env var is not set, `PAYPAL_BASE` resolves to sandbox. A missing env var in production = no real payments processed. Add an explicit check and startup log.

### Documented policy (maintain)

- One Vercel project per client.
- All secrets in Vercel encrypted env vars.
- DPA signed before any site processing personal data goes live.
- Security headers on every deployment.
- MFA on Vercel account.

---

## HUBSPOT CRM — CURRENT STATE

| Object | ID / URL |
|---|---|
| Company (FORGE) | `328069569267` — https://app.hubspot.com/contacts/246508612/record/0-2/328069569267 |
| Deal (FORGE) | `330377709283` — https://app.hubspot.com/contacts/246508612/record/0-3/330377709283 |
| Contact (Aaron) | `502639455958` |
| Portal ID | `246508612` |
| Pipeline | "New Leads" — **7 stages documented, not yet created via API** |

### 7-stage pipeline (create manually in HubSpot settings)

1. New Enquiry
2. First Contact Made
3. Discovery Complete
4. Proposal Sent
5. Negotiation
6. Closed Won
7. Closed Lost

---

## CANVA BRAND ASSETS

| Asset | Design ID | Edit URL |
|---|---|---|
| Colour Palette Card | `DAHMxDfOzEg` | https://www.canva.com/d/WwsaCKEzw1vPn5W |
| Instagram Post Template | `DAHMxFW8N54` | https://www.canva.com/d/6hxChSr0dlo9Rz2 |
| Facebook/Google Business Cover | `DAHMxApKF8A` | https://www.canva.com/d/MCjVBDRjzGSD4VO |

---

## CALENDLY

Booking link: https://calendly.com/builtbyaaronf/30min
Added to `index.html` hero CTA. ✅ Live at forgeisagentic.tech.

---

## SOCIAL CALENDAR

| Field | Value |
|---|---|
| Posts | 20 (4 weeks × 5 posts) |
| Platforms | Instagram + Facebook + LinkedIn (FORGE own accounts only) |
| Reels | 4 concepts with full briefs |
| First post | Monday 23 June 2026 |
| Files | `forge-social-calendar.csv` + `forge-social-captions.md` |

---

## CURRENT ACTION ITEMS (as of 19 June 2026)

| Priority | Item | Status |
|---|---|---|
| ✅ DONE | ICO registration — ZC176397, expires 16 Jun 2027 | COMPLETE |
| ✅ DONE | Add security headers to `vercel.json` | COMPLETE |
| ✅ DONE | Run `vercel --prod` — site live at forgeisagentic.tech | COMPLETE |
| ✅ DONE | Create HubSpot 7-stage pipeline manually | COMPLETE — "New Leads" pipeline, all 7 stages confirmed |
| ✅ DONE | Fix PayPal webhook idempotency | COMPLETE |
| ✅ DONE | Add rate limiting to `/api/tavus-conversation` | COMPLETE |
| 🟢 MEDIUM | Publish Post 1 on LinkedIn | PENDING |
| 🟢 MEDIUM | Write Case Study #001 ("FORGE ran its own machine on itself") | PENDING |

---

## SESSION PROTOCOL

**Start of session:**
1. Read `FORGE_STATE.md`
2. Read `CLAUDE.md` (this file) if not already in context
3. Check action items above — what has changed?
4. Confirm the task

**End of session:**
1. Update `FORGE_STATE.md` with any new state, completed gaps, new gaps
2. Update this file if architecture changes
3. Write a one-line summary of what changed

**Before any client deployment:**
1. Run `site-audit` skill
2. Check `security/Vercel_Deployment_Security_Checklist.md`
3. Confirm DPA status
4. Confirm security headers are in `vercel.json`

---

## SKILL TRIGGER CHEAT SHEET

| Intent | Skill |
|---|---|
| Research a business | `website-content-extractor` |
| Build a website | `one-click-website` |
| Full client deploy (all agents) | `deploy-team` |
| Add Canva brand assets | `brand-kit` |
| Add quote/enquiry form | `quote-wizard` |
| Set up HubSpot CRM | `hubspot-setup` |
| Set up Calendly booking | `calendly-setup` |
| Generate social content | `social-media-machine` |
| Audit a website | `site-audit` |
| Generate audit report | `site-audit-report` |
| Audit CTAs/conversions | `cta-optimizer` |
| Generate client handover doc | `client-handover` |
| Run daily ops briefing | `ops-briefing` |
| Write marketing content | `marketing:content-creation` |
| Email sequence | `marketing:email-sequence` |
| SEO audit | `marketing:seo-audit` |
| Campaign plan | `marketing:campaign-plan` |

---

## DIAGNOSTICS SUMMARY — DEPLOY #001

Key lessons from the first internal deploy (see `DIAGNOSTICS-001.md` for full detail):

- **Vercel MCP deploys via CLI instructions, not directly.** `vercel --prod` must be run locally by Aaron. Build the curl-based API deploy path.
- **HubSpot MCP creates records perfectly.** Pipeline stage creation requires a different API endpoint — add to `hubspot-setup` skill.
- **SCOUT competitive data is strong.** Local competitor search (city level) gives better results than national searches. Add to SCOUT.
- **SPARK content is strong.** Needs real tone-of-voice samples from clients. SCOUT should collect existing social posts/reviews.
- **Canva MCP was not used.** Next deploy: automate palette card and social template creation via `generate-design`.
- **Total deploy time: ~35 minutes.** Target for client deploy: 14–18 minutes. FORGE internal deploy was longer due to full agency-level website.

---

*FORGE Agency | builtbyaaronf@gmail.com | forgeisagentic.tech*
