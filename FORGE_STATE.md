# FORGE_STATE.md
# Persistent state checkpoint — read this at the start of every session
# Last updated: 19 June 2026 (late) — MARK [Logo] live, font rendering fixed, skills updated

---

## BUSINESS STATUS

| Field | Value |
|-------|-------|
| Business name | FORGE |
| Website | https://forgeisagentic.tech |
| Website status | ✅ FULLY LIVE — https://forgeisagentic.tech — security headers active, Calendly CTA live |
| HubSpot Company | https://app.hubspot.com/contacts/246508612/record/0-2/328069569267 |
| HubSpot Deal | https://app.hubspot.com/contacts/246508612/record/0-3/330377709283 |
| Email | builtbyaaronf@gmail.com |
| ICO registration | ✅ DONE — ZC176397 | FORGE AGENTIC MARKETING | Registered 17 Jun 2026 | Expires 16 Jun 2027 |
| Target market | UK tradesmen in Greater London with no working website |

---

## FULL DEPLOY — FORGE INTERNAL
**Triggered:** 16 June 2026
**Mode:** FULL
**Overall status:** COMPLETE (with known gaps — see below)

---

## AGENT STATUS

### SCOUT ✅ COMPLETE
- Research quality: HIGH
- Competitors mapped: 5 (Traditional agencies, Freelancers, Directories, AI builders, Trades-specific agencies)
- Positioning locked: "World's first fully agentic marketing department for London tradespeople"
- Messaging angle: Speed + AI (category creation)
- Design system: Creative Dark (#090909 canvas, #0099FF accent, Space Grotesk + Inter)

---

### ATLAS ✅ COMPLETE (1 gap)

**Phase 1 — Research:** ✅ Done (SCOUT output used)

**Phase 2 — Website:** ✅ Done
- File: `C:\Users\gravi\Claude\Projects\FORGE\index.html`
- Deploy: Run `vercel --prod` from FORGE folder (NOT yet deployed)
- Vercel project: `prj_0gxgKYJFAfcap0zSvDm2yczzcmpx`
- Team: `team_3slbSUXIc59hIfcb5hsveVLx`
- Production domain: `forgeisagentic.tech`
- Legal: Cookie banner ✅, Privacy Policy link ✅, Terms link ✅

**Phase 3 — Canva brand kit:** ✅ Done
| Asset | Canva Design ID | Edit URL |
|-------|----------------|----------|
| Colour Palette Card (facebook post) | DAHMxDfOzEg | https://www.canva.com/d/WwsaCKEzw1vPn5W |
| Instagram Post Template | DAHMxFW8N54 | https://www.canva.com/d/6hxChSr0dlo9Rz2 |
| Facebook / Google Business Cover | DAHMxApKF8A | https://www.canva.com/d/MCjVBDRjzGSD4VO |

**Phase 4 — HubSpot CRM:** ✅ Done
- Company ID: 328069569267
- Deal ID: 330377709283
- Contact: Aaron (builtbyaaronf@gmail.com) — already existed, ID 502639455958
- Pipeline: ⚠️ DOCUMENTED ONLY — not yet created via API (see gap below)

**Phase 5 — Strategy Pack:** ✅ Done
- File: `C:\Users\gravi\Claude\Projects\FORGE\forge-strategy-pack.html`

---

### SPARK ✅ COMPLETE (1 gap)

- File: `C:\Users\gravi\Claude\Projects\FORGE\forge-social-calendar.csv`
- Full captions: `C:\Users\gravi\Claude\Projects\FORGE\forge-social-captions.md` ✅
- Posts: 20 / Weeks: 4 / Reels: 4 / Carousels: 7
- Platforms: Instagram + LinkedIn + Google Business
- First post: Monday 23 June 2026
- Gap: ✅ RESOLVED — full captions + reel scripts now written

---

### CHASE ✅ COMPLETE (1 gap)

- File: `C:\Users\gravi\Claude\Projects\FORGE\forge-chase-sales-system.md`
- Email sequence: 6 emails / 14 days ✅
- Cadence: 30-day multi-channel ✅
- Lead scoring: Hot / Warm / Cold ✅
- Objection scripts: 5 ✅ (lead: "I get all my work from word of mouth")
- HubSpot pipeline: ⚠️ DOCUMENTED ONLY (see gap below)
- 30/60/90 targets: ✅

---

## KNOWN GAPS — ACTION REQUIRED

### Gap 1: Website not deployed — ✅ RESOLVED 19 Jun 2026
**Status:** Live at https://forgeisagentic.tech — security headers active, Calendly CTA live

### Gap 2: ICO registration — ✅ RESOLVED 17 Jun 2026
**Registration number:** ZC176397
**Registered name:** FORGE AGENTIC MARKETING
**Registered:** 17 June 2026 | **Expires:** 16 June 2027
**Action:** Renew annually at ico.org.uk/registration (£40/year)

### Gap 3: HubSpot 7-stage pipeline — ✅ RESOLVED 20 Jun 2026
**Pipeline:** "New Leads" | 7 stages confirmed live in HubSpot portal 246508612
1. New Enquiry — 10%
2. First Contact Made — 20%
3. Discovery Complete — 40%
4. Quote Sent — 60%
5. Negotiation — 80%
6. Closed Won — 100%
7. Closed Lost — 0%

### Gap 4: Calendly booking link — ✅ ADDED TO index.html
**What:** "Book a Free 30-Min Demo" button added to hero, links to https://calendly.com/builtbyaaronf/30min
**Action for Aaron:** Run `vercel --prod` from C:\Users\gravi\Claude\Projects\FORGE to push live

---

## FILES IN THIS DEPLOY

| File | Status | Description |
|------|--------|-------------|
| index.html | ✅ Ready (not deployed) | Main website |
| vercel.json | ✅ Existing | Vercel routing config |
| privacy.html | ✅ Existing | Privacy Policy |
| terms.html | ✅ Existing | Terms & Conditions |
| forge-strategy-pack.html | ✅ Done | Client strategy pack |
| forge-social-calendar.csv | ✅ Done | 20-post social calendar |
| forge-social-captions.md | ✅ Done | Full captions + reel scripts |
| forge-chase-sales-system.md | ✅ Done | Sales system (email seq, cadence, scripts) |
| forge-skill-evaluation.md | ✅ Done | Self-evaluation + improvement actions |
| FORGE_STATE.md | ✅ This file | Persistent state checkpoint |
| scout-brief.md | ✅ Existing | SCOUT research brief |
| start.html | ✅ Existing | Start page |

---

## RETAINER FLYWHEEL — PHASE 2 STATUS (19 June 2026) ✅ DEPLOYED

**Phase 2 Complete:** HubSpot contact property write logic live on production.

### Implementation Summary

**File:** `api/paypal-webhook.js`

**Changes:**
- `updateHubSpotContact()` function fully implemented:
  - Searches HubSpot for existing contact by email (via CRM API v3)
  - If found: updates contact with `forge_lead_utm_source` + `forge_lead_campaign_tag`
  - If not found: creates new contact with those properties
  - Error handling: non-blocking (logs but doesn't break webhook)
- Integrated into webhook handler: triggered after payment capture, before deployment notifications
- Vercel env vars configured: `HUBSPOT_PORTAL_ID`, `HUBSPOT_API_KEY` (Service Key)
- Deployed to production: 19 June 2026, ~15:30 UTC

**Data Flow:**
```
PayPal PAYMENT.CAPTURE.COMPLETED 
→ Extract UTM params (utm_source, utm_campaign) from custom_id 
→ Extract client email 
→ Call updateHubSpotContact(email, utmSource, utmCampaign) 
→ Search HubSpot contacts by email (CRM v3 API) 
→ Update or create contact with properties 
→ Log result 
→ Continue to notifyDeployment + sendClientConfirmation
```

**Testing Notes:**
- Monitor `vercel logs api/paypal-webhook` after next client payment
- Expected logs: "HubSpot contact [ID] updated with UTM: source=..., campaign=..."
- If contact not found in HubSpot, creates new: "HubSpot contact created ([ID]) with UTM:..."

---

## RETAINER FLYWHEEL — PHASE 1 STATUS (19 June 2026)

### COMPLETED ✅

**Task 1: UTM Tagging in SPARK**
- File: `batch-runner/forge-prompts.js` → `p_spark_social()` updated
- Added `utm_link` field to JSON schema (format: `?utm_source={platform}&utm_medium={content_type}&utm_campaign={month_slug}&utm_content={borough_slug}`)
- Model will generate UTM links per-post (e.g., `?utm_source=instagram&utm_medium=image&utm_campaign=jul26_w1&utm_content=lambeth`)
- ✅ Syntax verified with `node --check`

**Task 2: HubSpot Lead Source Schema**
- Two new contact properties required (manual UI creation):
  - `forge_lead_utm_source` (type: string, group: contactinformation)
  - `forge_lead_campaign_tag` (type: string, group: contactinformation)
- File: `api/paypal-webhook.js` updated to extract UTM params from `custom_id` payload
- Added `updateHubSpotContact()` function to write UTM properties to contact
- Note: HubSpot property definitions require manual creation in HubSpot UI (Settings → Contacts → Properties)
- ✅ Syntax verified with `node --check`

**Task 3: GA4 Snippet in ATLAS**
- File: `batch-runner/forge-prompts.js` → `p2_websiteHtml()` updated
- Added GA4 requirements: placeholder `GA_MEASUREMENT_ID`, anonymize_ip=true, cookieless mode
- Updated `security/Vercel_Deployment_Security_Checklist.md` with GA4 verification steps
- Pre-go-live checklist now includes: "Replace GA_MEASUREMENT_ID with client's actual GA4 ID"
- ✅ Syntax verified with `node --check`

**Task 4: Buffer Layer Research**
- File: `batch-runner/buffer-research.md` created with full findings
- **Key finding:** Buffer API has no bulk CSV import — requires individual POST per update
- **OAuth:** Standard OAuth 2.0 flow; can manage multiple client accounts; 60 requests/min limit
- **Free tier:** Buffer no longer supports new developer app registration
- **Recommendation:** Defer Buffer integration to Phase 5; use manual CSV → UI for now
- Research provides full integration checklist for future phase

---

## NEXT SESSION — START HERE

1. Read this file
2. **ACTION FOR AARON:** Create two HubSpot contact properties in UI (forge_lead_utm_source, forge_lead_campaign_tag)
3. **ACTION FOR AARON:** Verify Buffer developer app status or request access (hello@buffer.com)
4. Next phase: Implement HubSpot contact update logic via MCP (currently logs intent, not writing properties)
5. Deploy Phase 1 code and test with next client deploy
6. If first client acquired: run Full Deploy with UTM tracking enabled

---

## POST-PAYMENT RETENTION ENGINE — DEPLOYED (19 June 2026)

### Build Status: 3/3 Tasks Complete & Live ✅

**Task 1: `/api/session.js`** ✅ LIVE
- Server-side PayPal order verification endpoint
- Returns verified client data + pro-rata upgrade grid
- Validates order status, decodes custom_id, builds upgrade pricing
- Syntax: Valid | Deployed: ✅

**Task 2: `build-status.html`** ✅ LIVE
- Session layer replaces URL-param reading
- Loading overlay while verifying payment ("Verifying your payment…")
- Pro-rata upgrade grid renders when upgrades available
- PayPal Smart Buttons per upgrade tier with correct amounts
- Tavus agent initializes from verified session data only (not URL params)
- Syntax: Valid | Deployed: ✅

**Task 3: `/api/paypal-webhook.js`** ✅ LIVE
- Upgrade fraud validation (lines 110–132) deployed
- Amount validation: rejects mismatches >£0.01
- Downgrade prevention: rejects pkg downgrades
- Field validation: ensures upgrade_from and pkg are valid
- Notifies Aaron with `isUpgrade: true, upgradeFrom: pkg` flag
- Syntax: Valid | Deployed: ✅

### Live Upgrade Flow
```
Client payment → build-status.html?token=ORDER_ID
  ↓
Page calls /api/session (verifies PayPal order)
  ↓
If upgrades available: render pro-rata grid with Smart Buttons
  ↓
Client clicks upgrade → new PayPal payment (pro-rata amount)
  ↓
Webhook validates: amount math, no downgrade, valid packages
  ↓
If valid: notify Aaron + queue extra agents
If invalid: reject + return 200 OK (prevent PayPal retries)
  ↓
Original deployment continues in background
```

### Real World Test Checklist — ACTIVE ✅

#### Test 1: First New Client Payment
- [ ] Client pays for Package (1-5)
- [ ] Redirect to `build-status.html?token=ORDER_ID` succeeds
- [ ] Loading overlay appears, then disappears
- [ ] Client data populates correctly (name, email, package)
- [ ] Build steps animate in sequence
- [ ] Tavus agent loads and connects
- [ ] Client receives confirmation email
- [ ] Aaron receives deployment notification
- [ ] Deploy-team skill queued with correct package agents
- **Expected outcome:** Full build completes within estimated ETA

#### Test 2: First Upgrade Payment
- [ ] Client (initial package) sees pro-rata upgrade grid on build-status page
- [ ] Correct upgrade tiers available (tiers above their current package only)
- [ ] Pro-rata amounts calculated correctly (e.g., P1→P3 = £225)
- [ ] Client completes upgrade payment via PayPal Smart Button
- [ ] Webhook validates: amount matches expected pro-rata
- [ ] Aaron receives email flagged as `UPGRADE -- [Business] -- [new pkg] (from [old pkg])`
- [ ] Upgrade agents queued to existing build
- **Expected outcome:** Extra agents (PIXEL, WIRE, etc.) added to running build

#### Edge Cases (if encountered)
- [ ] Fraud attempt (wrong amount): Webhook silently rejects, returns 200 OK
- [ ] Downgrade attempt (P3→P1): Webhook silently rejects, returns 200 OK
- [ ] Duplicate payment event: Idempotency guard blocks duplicate, returns 200 OK
- [ ] Malformed custom_id: Webhook handles gracefully, returns 200 OK
- **Expected outcome:** No error emails; all logged at webhook level

#### Sign-Off
- [ ] Test 1 passed: New client flow validated
- [ ] Test 2 passed: Upgrade flow validated
- [ ] All edge cases handled gracefully
- **Status:** System ready for production load

---

## SELF-EVALUATION GRADES
| Agent | Grade | Primary gap |
|-------|-------|-------------|
| SCOUT | A- | No Playwright visual evidence |
| ATLAS | B | HubSpot pipeline not live (resolved gap: Canva done ✅) |
| SPARK | A | Full captions now done ✅ |
| CHASE | A- | Pipeline documented, not live in HubSpot |
| **Overall** | **B+** | |

---

## SUBSCRIPTION ENGINE — DEPLOYED (Monday 23 June 2026) ✅ COMPLETE

**Build Status:** 6/6 Tasks Complete

### Implementation Summary

All subscription engine components built and syntax-verified:

1. `api/_config/plans.js` — PayPal billing plans storage (auto-generated)
2. `batch-runner/forge-create-plans.js` — OAuth script to create plans in PayPal
3. `api/session.js` (extended) — Returns `subscriptionOptions` array
4. `build-status.html` (extended) — Retainer grid + PayPal Smart Buttons for subscriptions
5. `api/paypal-webhook.js` (extended) — Handles `BILLING.SUBSCRIPTION.CREATED` + `PAYMENT.SALE.COMPLETED`
6. `api/cron/monthly-spark.js` — Vercel Cron runs 1st of month, submits tier-appropriate batch jobs
7. `vercel.json` (extended) — Added crons array with schedule `0 8 1 * *`

### Data Flows

**Subscription Signup:** Client → PayPal Smart Button → Webhook logs to KV + notifies Aaron

**Monthly Cron:** 1st of month 08:00 UTC → Fetch subscriptions → Submit batch jobs → Store results in KV

**Recurring Charge:** PayPal monthly billing → Webhook validates amount + idempotency → Updates KV + notifies Aaron

### Env Vars Required (Add to Vercel NOW)

- `ANTHROPIC_API_KEY` (used by /api/cron/monthly-spark.js)
- `CRON_SECRET` (use any random string; needed for external cron auth)

### Monthly Cron — EasyCron Setup (No Vercel Pro Required)

**Why:** Vercel Cron requires Pro plan. Using free EasyCron service instead.

**Setup (one-time, 2 minutes):**
1. Go to https://easycron.com (free account, no signup req'd on free tier)
2. Click "Create a Cron Job"
3. Fill in:
   - **URL:** `https://forgeisagentic.tech/api/cron/monthly-spark?token=YOUR_CRON_SECRET`
     (Replace `YOUR_CRON_SECRET` with the value you set in Vercel env vars)
   - **Cron Expression:** `0 8 1 * *` (1st of month, 08:00 UTC)
   - **Request Method:** GET
4. Save and verify

**Fallback (if EasyCron unavailable):**
Aaron manually triggers via:
```bash
curl "https://forgeisagentic.tech/api/cron/monthly-spark?token=$CRON_SECRET"
```

**Note:** `vercel.json` has crons array removed — deployment works on free Vercel.

---

## CURRENT ACTION ITEMS (as of 23 June 2026)

| Priority | Item | Status |
|---|---|---|
| ✅ DONE | Step 1: Add ANTHROPIC_API_KEY + CRON_SECRET to Vercel | COMPLETE |
| ✅ DONE | Step 2: PayPal plans (placeholder IDs in use) | COMPLETE |
| ✅ DONE | Step 3: Deploy to Vercel (`vercel --prod`) | COMPLETE |
| ✅ DONE | Step 4: Set up EasyCron monthly trigger | COMPLETE |
| 🟡 MEDIUM | Replace placeholder plan IDs with real PayPal IDs | PENDING |

---

## TODO — Replace Placeholder Plan IDs

**When:** Network is stable (non-protected browser)

**Steps:**
1. Run: `node batch-runner/forge-create-plans.js`
2. This will create real plans in PayPal and populate `api/_config/plans.js` with real IDs
3. Deploy: `vercel --prod`

**Current state:** System is live with placeholder IDs (`I-placeholder-t1`, etc.). Subscriptions will work in sandbox for testing. Replace with real IDs before going live.
| ✅ DONE | ICO registration — ZC176397, expires 16 Jun 2027 | COMPLETE |
| ✅ DONE | Add security headers to `vercel.json` | COMPLETE |
| ✅ DONE | Subscription Engine build — all 6 tasks complete | COMPLETE |
| ✅ DONE | MARK [Logo] — logo-gen endpoint live (resvg-js + bundled fonts) | COMPLETE |
| ✅ DONE | logo-wizard.html + /api/logo-confirm live | COMPLETE |
| ✅ DONE | FORGE logo chosen: Style C (Bold Wordmark) — 9 assets generating | COMPLETE |
| ✅ DONE | Buffer Post 1 scheduled — Mon 23 Jun, 9AM, all 3 channels | COMPLETE |
| ✅ DONE | HubSpot forge_lead_campaign_tag property created | COMPLETE |
| ✅ DONE | paypal-webhook.js syntax fix (trailing fragment removed) | COMPLETE |
| ✅ DONE | deploy-team skill — MARK added as Package 1+ agent | COMPLETE |
| ✅ DONE | brand-kit skill — MARK section already present | COMPLETE |
| ✅ DONE | Create HubSpot 7-stage pipeline manually | COMPLETE — "New Leads" pipeline, all 7 stages confirmed |
| ✅ DONE | Fix PayPal webhook idempotency | COMPLETE |
| ✅ DONE | Add rate limiting to /api/tavus-conversation | COMPLETE |
| 🟡 MEDIUM | Replace placeholder PayPal plan IDs with real IDs | PENDING |
| 🟢 MEDIUM | Publish Post 1 on LinkedIn | PENDING (scheduled Mon 23 Jun) |
| 🟢 MEDIUM | Write Case Study #001 ("FORGE ran its own machine on itself") | PENDING |

---

## MARK [LOGO] — FULLY COMPLETE (20 June 2026)

**Status:** ✅ LIVE — end-to-end verified

- `/api/logo-gen` — generates PNG logos via `@resvg/resvg-js` + bundled DejaVu Sans fonts
- `/api/logo-ai` — fal.ai Ideogram V3 icon generation (returns base64 + cdn_url)
- `/api/logo-confirm` — stores choice in Vercel KV, generates 9 asset URLs, emails client + Aaron
- `/api/logo-icon` — KV lookup + redirect for website header auto-update
- `logo-wizard.html` — 2-step wizard: Step 1 picks AI icon (3 fal.ai variants), Step 2 picks lockup (canvas previews, no server calls)
- `brand-assets.html` — magic link page showing all 9 downloadable PNGs
- All 9 asset formats route through logo-gen with slug param — KV lookup fetches AI icon, composites server-side
- Square formats (pfp, favicon) use `svgAiIconSquare` — full-bleed AI icon, no padding, no expiring CDN URLs
- Verified: full pipeline working end-to-end 20 June 2026

**Wizard URL format:**
```
https://forgeisagentic.tech/logo-wizard?slug={slug}&name={name}&trade={trade}&color={hex_no_hash}&email={email}&pkg={pkg}
```

**Brand assets page:**
```
https://forgeisagentic.tech/brand-assets.html?slug={slug}&token={token}
```
