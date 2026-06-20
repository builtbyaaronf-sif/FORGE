# FORGE — Vercel Deployment Security Checklist
**Run this before every client site goes live. No exceptions.**

---

## Pre-Deployment

- [ ] **Project named correctly** — `forge-[client-slug]` (e.g. `forge-acme-plumbing`)
- [ ] **Deployed under FORGE team account** — not a personal Vercel account
- [ ] **No other client's code in this project** — isolated repo/project
- [ ] **Git repo is private** — source code not publicly accessible
- [ ] **No secrets in source code** — grep for `API_KEY`, `TOKEN`, `SECRET`, `PASSWORD` in all files before deploy
- [ ] **All secrets in Vercel env vars** — set under Project → Settings → Environment Variables
- [ ] **Env vars scoped to Production only** (unless Preview/Dev is needed and documented)
- [ ] **Env var names logged in Client Record** (names only — never values)

---

## Domain & SSL

- [ ] **Domain registered in client's name** on their registrar account
- [ ] **Custom domain added to Vercel project** (Project → Settings → Domains)
- [ ] **SSL certificate provisioned** — Vercel auto-provisions via Let's Encrypt; confirm green padlock
- [ ] **HTTPS redirect enabled** — all HTTP requests redirect to HTTPS (Vercel default; confirm not disabled)
- [ ] **www vs non-www redirect set** — pick one canonical version, redirect the other

---

## Security Headers (paste into `vercel.json`)

Confirm `vercel.json` contains the following before deploy:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' [ADD CLIENT-SPECIFIC APIS HERE];" }
      ]
    }
  ]
}
```

**CSP `connect-src` additions by integration:**
- HubSpot forms: `https://api.hsforms.com https://forms.hubspot.com`
- Formspree: `https://formspree.io`
- Calendly: `https://calendly.com`
- WhatsApp: `https://wa.me`

- [ ] `vercel.json` headers block present and deployed
- [ ] Headers verified using [securityheaders.com](https://securityheaders.com) — minimum grade **B**, target **A**

---

## Forms & Data Collection

- [ ] **Privacy Policy linked in footer** (auto-generated or client-provided)
- [ ] **Cookie banner present** (if using analytics, HubSpot tracking, or any cookies)
- [ ] **Terms & Conditions linked in footer**
- [ ] **Consent checkbox on all forms** ("I agree to be contacted..." with link to Privacy Policy)
- [ ] **Form submissions route to client's system** (Formspree → client email, or HubSpot CRM) — not stored in FORGE infrastructure
- [ ] **No personal data logged to console or Vercel logs**

---

## Third-Party Scripts & Analytics

- [ ] **Only whitelisted scripts included** — no unknown CDN sources
- [ ] **Script integrity attributes added** where possible (SRI hash for external scripts)
- [ ] **Google Analytics / tracking** — only if client has requested AND cookie banner is in place
- [ ] **GA4 measurement ID configured** — Replace `GA_MEASUREMENT_ID` placeholder with actual client GA4 ID (format: G-XXXXXXXXXX)
- [ ] **GA4 snippet verified** — Check that `anonymize_ip: true` and cookieless ping mode are active
- [ ] **No unminified source maps in production** (disable source maps in build config)

---

## Post-Deployment Verification

- [ ] **Site loads on custom domain** over HTTPS
- [ ] **All internal links work** (no broken `/` routes)
- [ ] **Form submission tested** — sends to correct destination, confirmation shown to user
- [ ] **Mobile responsive** — tested at 375px width
- [ ] **Page speed check** — Vercel Analytics or PageSpeed Insights (target 85+ mobile)
- [ ] **Security headers verified** — securityheaders.com grade B or above
- [ ] **No console errors** in browser DevTools
- [ ] **Deployment logged in Client Record** with live URL and date

---

## Handover Sign-Off

- [ ] Client Hosting Agreement signed
- [ ] DPA signed (if collecting personal data)
- [ ] Client Record updated with: live URL, Vercel project name, domain registrar, integrations used, env var names
- [ ] Client briefed on domain renewal responsibility

---

**Checklist completed by:** _______________________ **Date:** ___________
