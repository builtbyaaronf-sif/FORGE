# Legal Gates Roadmap: Lightweight → Production

**Two-stage implementation strategy. Start lightweight, upgrade to enterprise-grade when you scale.**

---

## Stage 1: Lightweight Gate (NOW)

**File:** `LEGAL_GATE_LIGHTWEIGHT.html`  
**Integration:** `LEGAL_GATE_INTEGRATION_GUIDE.md`  
**Setup time:** 5 minutes  
**Cost:** $0  

### What It Does:
- Modal consent gate on first visit
- Stores consent in localStorage
- Works on static HTML sites
- No backend required
- No database needed
- No payment integration

### Perfect For:
✅ New sites without user accounts  
✅ Bootstrap phase (no revenue yet)  
✅ Simple "accept terms" requirement  
✅ Websites without paid features  

### How to Deploy:
1. Copy code from `LEGAL_GATE_LIGHTWEIGHT.html`
2. Paste into `index.html` before `</body>` tag
3. Deploy to Vercel
4. Done.

### Limitations:
❌ No server-side validation (could be bypassed with dev console)  
❌ No database tracking  
❌ No integration with payment systems  
❌ No audit logging  
❌ No subscription revocation  

---

## Stage 2: Production Gate (WHEN YOU NEED IT)

**File:** `LEGAL_GATES_ARCHITECTURE.md`  
**Implementation:** `LEGAL_GATES_IMPLEMENTATION_CHECKLIST.md`  
**Setup time:** 4-5 hours (spread over a week)  
**Cost:** $25-50/month (Supabase database)  

### What It Does:
- Server-side consent validation
- Database-backed subscription tracking
- HMAC webhook signature verification
- Session revocation on suspension
- Complete audit logging
- Payment system integration
- Rate limiting & idempotency
- Enterprise-level security

### Perfect For:
✅ Sites with paid services (Packages 3-5)  
✅ When you have 5+ clients with payment processing  
✅ When you need legal compliance beyond terms acceptance  
✅ When users should lose access if subscription lapses  

### How to Deploy:
1. Set up Supabase database (30 min)
2. Create backend API endpoints (1 hour)
3. Create React components (45 min)
4. Configure webhook with payment provider (30 min)
5. Test everything (1 hour)
6. Deploy (30 min)

### What It Prevents:
✅ Dev console bypass (server validates)  
✅ Subscription expiry (automatic revocation)  
✅ Forged consent (HMAC verification)  
✅ Replay attacks (idempotency checking)  
✅ Legal disputes (complete audit trail)  

---

## Decision Tree

```
Do you have paying clients right now?
├─ NO → Use Lightweight (Stage 1)
│       Deploy immediately. Cost: $0.
│       You have 3-6 months before needing upgrade.
│
└─ YES (or coming soon) → Consider Production (Stage 2)
        Do clients pay via subscription?
        ├─ NO (one-time payments only) → Lightweight is fine
        │
        └─ YES → Use Production (Stage 2)
                Build it before first payment processes.
                Prevents legal/technical debt.
```

---

## Timeline Recommendation

### Bootstrap Phase (Months 1-3)
- Use **Lightweight Gate**
- Focus on landing clients
- Validate market fit
- Cost: $0

### Growth Phase (Months 4-6)
- First few clients acquired
- Start receiving payments
- Upgrade to **Production Gate** if clients pay monthly/recurring
- Cost: +$25-50/month (pays for itself)

### Scale Phase (Months 6+)
- Multiple paying clients
- Subscription/recurring revenue
- Legal compliance critical
- Both systems working together
- Cost: $25-50/month, priceless peace of mind

---

## Data Migration

If you start with Lightweight and later move to Production:

**Your existing consent records:**
- Lightweight stores in `localStorage` (browser-only)
- Production uses Supabase (server database)
- They don't overlap — no migration needed

**What happens:**
1. Old users' localStorage ignored (new server system is source of truth)
2. When they visit, they see production gate (new terms version)
3. They accept on production system
4. Consent recorded in database
5. New, auditable flow begins

No data loss. Clean upgrade path.

---

## Comparison Matrix

| Feature | Lightweight | Production |
|---------|-------------|------------|
| Setup time | 5 min | 4-5 hours |
| Cost | $0 | $25-50/mo |
| Server validation | No | Yes (HMAC) |
| Database | No | Yes (Supabase) |
| Audit logging | No | Yes (complete) |
| Payment integration | No | Yes (webhooks) |
| Session revocation | No | Yes (automatic) |
| Subscription tracking | No | Yes (detailed) |
| DEV console bypass risk | Yes | No |
| GDPR audit-ready | No | Yes |
| Scalable to 100+ clients | No | Yes |

---

## Architecture Diagram

```
TODAY (Lightweight):
┌─────────────────┐
│  index.html     │
│  (static site)  │
└────────┬────────┘
         │
         ├─→ LegalGate modal
         │   (localStorage)
         │
         └─→ No backend
             Cost: $0

TOMORROW (Production):
┌─────────────────────────────────────┐
│  Vercel (Frontend + API)            │
│  ┌──────────────────────────────┐   │
│  │ React components + JS gate   │   │ ← Still your site
│  │ (server-side validation)     │   │
│  └───────────┬──────────────────┘   │
│              │                      │
│              ├─→ /api/webhooks      │ ← Receives payment events
│              ├─→ /api/auth          │ ← Records consent
│              └─→ /api/sessions      │ ← Revokes on suspension
└──────────────┬──────────────────────┘
               │
               ├─→ Supabase PostgreSQL
               │   ├─ users
               │   ├─ subscriptions
               │   ├─ audit_logs
               │   ├─ sessions
               │   └─ webhook_events
               │
               └─→ Payment provider (Stripe/Paddle)
                   └─ Webhooks sign payloads (HMAC)
```

---

## Implementation Checklist

### Stage 1 (Lightweight) — Do This Week
- [ ] Review `LEGAL_GATE_LIGHTWEIGHT.html`
- [ ] Read `LEGAL_GATE_INTEGRATION_GUIDE.md`
- [ ] Add code to index.html
- [ ] Deploy to Vercel
- [ ] Test in incognito mode
- [ ] Verify localStorage consent is stored

**Time: 30 minutes**  
**Cost: $0**  
**Benefit: Legal terms accepted before anyone uses your site**

### Stage 2 (Production) — Do When You Have Paying Clients
- [ ] Review `LEGAL_GATES_ARCHITECTURE.md`
- [ ] Read `LEGAL_GATES_IMPLEMENTATION_CHECKLIST.md`
- [ ] Set up Supabase database
- [ ] Create backend API endpoints
- [ ] Build React components
- [ ] Configure payment webhook
- [ ] Test everything
- [ ] Deploy

**Time: 4-5 hours (over 1 week)**  
**Cost: +$25-50/month**  
**Benefit: Server-side validation, audit trail, legal compliance**

---

## Right Now

You have both systems documented:

**Lightweight (ready to deploy):**
1. `LEGAL_GATE_LIGHTWEIGHT.html` ← Copy/paste into index.html
2. `LEGAL_GATE_INTEGRATION_GUIDE.md` ← Step-by-step instructions

**Production (ready when you need it):**
1. `LEGAL_GATES_ARCHITECTURE.md` ← Complete system design
2. `LEGAL_GATES_IMPLEMENTATION_CHECKLIST.md` ← Detailed checklist

---

## Decision: What to Do Today?

**Option A:** Deploy lightweight gate now (recommended)
- Protects your site today
- 5 minutes to ship
- $0 cost
- No technical debt
- Easy to upgrade later

**Option B:** Wait for production system
- More complex
- 4-5 hours to build
- $25-50/month cost
- Overkill for sites without paid features
- Not necessary until you have paying clients

---

## Recommendation

**Deploy Lightweight TODAY.**

Here's why:
1. You have no paying clients yet
2. No database infrastructure ready
3. Vercel is already your host
4. 5-minute setup vs. 5-hour setup
5. $0 cost vs. $25-50/month
6. Legal protection from day 1
7. Easy upgrade path when you scale

Once you land your first paying client, use `LEGAL_GATES_IMPLEMENTATION_CHECKLIST.md` to build the production system.

You'll have both: lightweight for the site, production for the payment platform.

---

**Ship the lightweight gate in the next 30 minutes. Upgrade when revenue arrives.**
