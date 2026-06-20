# Buffer API Research — Retainer Flywheel Integration
**Date:** 19 June 2026  
**Scope:** Feasibility of Buffer API for client content calendar import and scheduling  
**Status:** Research Complete — Recommendations Below

---

## EXECUTIVE SUMMARY

Buffer's public API is **partially suitable** for FORGE's integration needs. The main blocker: **no bulk import endpoint**. Content calendars must be pushed to Buffer via individual `POST /updates/create` calls, not CSV import.

**Verdict for Phase 4 (Buffer Layer):** API is functional, but manual client setup (Buffer UI login) is simpler than full integration for first clients. Deferred to Phase 5.

---

## FINDINGS

### 1. Can FORGE auto-import a CSV or JSON content calendar into a client's Buffer queue via API?

**Short answer:** No, not directly.

**Details:**
- Buffer API has no `/bulk/import` or `/csv/import` endpoint
- Updates must be created individually via `POST /updates/create.json`
- To import 20 posts, FORGE would make 20 sequential HTTP requests
- Each request accepts: `text`, `media`, `scheduled_at`, `profile_ids`, `shorten`, `now`, `top`
- CSV would need to be parsed client-side and transformed into JSON payloads

**Implementation cost:** ~2 hours of Node.js work to parse CSV + loop + POST to Buffer API

---

### 2. What OAuth flow does Buffer use for managing multiple client accounts?

**OAuth 2.0 standard flow:**

1. **Redirect** user to: `https://bufferapp.com/oauth2/authorize?client_id=...&redirect_uri=...&response_type=code`
2. User approves in Buffer UI
3. **Get auth code** — redirected back to `redirect_uri?code=1/mWot20jTwojsd00jFlaaR45`
4. **Swap code for token** — `POST /oauth2/token.json` with `client_id`, `client_secret`, `code` (code valid 30 seconds only)
5. Receive long-lived `access_token`

**Multiple account management:**
- One OAuth app can manage multiple client accounts
- Each client authorizes their own Buffer account separately
- FORGE stores their `access_token` securely (Vercel KV or encrypted env var)
- FORGE can post to their profiles using their token

**Issue:** Requires client to have Buffer account + manually authorize FORGE app. Not friction-free during onboarding.

---

### 3. Posting rate limits

**Hard limit:** 60 authenticated requests per user per minute (per Buffer account)

**Implication:**
- 20 posts = 20 requests = ~20 seconds ≪ 60 requests/minute
- **Not a blocker** for single content calendar import (1 client = 1 import = 20 requests done in <1 min)
- **Would be a blocker** for bulk operations across 50+ clients simultaneously

**Custom rate limit:** Buffer states "If you have a need for a higher rate limit, please get in touch so that we can try and help out." — no guaranteed SLA.

---

### 4. Free tier API access?

**Bad news:** "Buffer no longer supports the creation of new developer apps."

**Implications:**
- FORGE cannot register a new Buffer developer app
- Must use an existing app (if Aaron has one) or request special access
- Free Buffer plan exists, but API access unclear
- Likely requires paid plan or API partnership request

**Action required:** Aaron to check if FORGE Buffer account has developer app access, or request via hello@buffer.com

---

## RECOMMENDED INTEGRATION APPROACH

### Phase 4 Option A (Simpler, MVP):
**Manual Buffer setup via UI**
- Client logs into Buffer, connects their social profiles
- Client or FORGE manually pastes captions into Buffer UI
- FORGE provides CSV with caption + scheduling times
- Zero API integration needed
- **Timeline:** 10 min per client, client self-serve or Aaron does it

### Phase 4 Option B (Automated, requires dev):
**Build lightweight POST loop**
1. Parse SPARK social-calendar.json (already structured)
2. For each post, extract: text, platform, scheduled_at
3. Require client to authorize FORGE app (OAuth 2.0 flow) during onboarding
4. POST each to Buffer via `/updates/create.json`
5. Return Buffer post IDs to client for confirmation

**Dev cost:** ~3 hours (OAuth handler + CSV/JSON parser + error handling)  
**Client UX:** 1 extra click to authorize Buffer during checkout  
**Ongoing cost:** ~1 min per client for OAuth flow

---

## RECOMMENDED PATH FORWARD

**Recommendation:** **Defer Buffer API integration to Phase 5.**

**Why:**
1. Phase 4 (Book) focuses on Calendly appointment booking—solving conversion problem
2. Phase 5 (Grow) focuses on ongoing growth—better fit for content distribution
3. Manual Buffer setup via UI is faster for first 10 clients (test market signal)
4. Buffer API is stable and well-documented when ready to automate

**For Phase 4 delivery (immediate):**
- Provide SPARK output as CSV + captions.md
- Document in client handover: "Paste into Buffer manually, or email us for setup help"
- Track feedback: do clients want Buffer integration?

**For Phase 5 (next sprint):**
- Confirm Aaron's Buffer developer app status
- Build OAuth integration + CSV parser
- Automate for new clients

---

## INTEGRATION CHECKLIST (When Ready)

- [ ] Confirm Buffer developer app exists or request access from hello@buffer.com
- [ ] Implement OAuth 2.0 handler (`/api/buffer-oauth-callback`)
- [ ] Create `/api/buffer-import` endpoint (takes SPARK JSON, returns post IDs)
- [ ] Test with 2–3 friendly beta clients
- [ ] Add Buffer auth to client onboarding flow (after Calendly)
- [ ] Document in client-handover skill

---

## APPENDIX: BUFFER API ENDPOINTS (Reference)

| Endpoint | Purpose |
|----------|---------|
| `POST /oauth2/authorize` | Get auth code from user |
| `POST /oauth2/token.json` | Swap code for access token |
| `GET /profiles.json` | List user's connected profiles |
| `POST /updates/create.json` | Create single post |
| `POST /updates/:id/update.json` | Edit pending post |
| `GET /profiles/:id/updates/pending` | List queued posts |
| `GET /profiles/:id/updates/sent` | List sent posts |
| `POST /updates/:id/destroy.json` | Delete post |

---

**Research conducted by:** FORGE Phase 1 Automation  
**Status:** Ready for Phase 4 design review  
