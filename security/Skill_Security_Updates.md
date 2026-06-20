# FORGE Skill Security Updates
**Apply these via Settings → Capabilities → [skill name] → Edit**

---

## 1. `one-click-website` — Additions Required

### A. Add to "Page structure" section (after the Footer bullet)

Replace the current footer bullet:
```
6. **Footer** — business name, copyright year, optionally a social link placeholder
```

With:
```
6. **Footer** — MANDATORY legal footer. Must include ALL of the following:
   - Business name and copyright year
   - Link to `/privacy-policy` (Privacy Policy)
   - Link to `/terms` (Terms & Conditions)
   - Cookie consent banner (see Section: Cookie Banner below)
   - ICO registration number: "Data Controller registered with the ICO: [ICO_REGISTRATION_NUMBER]" — use `{{ICO_REGISTRATION_NUMBER}}` as placeholder if not provided, FORGE will replace at deploy time
   - Optional: social link placeholder

7. **Cookie Banner** — inject this HTML block just before `</body>`:
```

### B. Add new section: "Cookie Banner (Mandatory)"

Add after the footer section:

````markdown
### Cookie Banner (Mandatory on every site)

Inject the following self-contained cookie banner before `</body>`. It requires no external libraries.

```html
<!-- FORGE Cookie Banner — mandatory on all deployments -->
<div id="cookie-banner" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:1rem 1.5rem;z-index:9999;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;font-family:inherit;font-size:0.875rem;">
  <p style="margin:0;flex:1;min-width:200px;">We use cookies to improve your experience. By continuing to use this site, you accept our <a href="/privacy-policy" style="color:#60a5fa;text-decoration:underline;">Privacy Policy</a>.</p>
  <div style="display:flex;gap:0.75rem;flex-shrink:0;">
    <button onclick="acceptCookies()" style="background:#3b82f6;color:#fff;border:none;padding:0.5rem 1.25rem;border-radius:6px;cursor:pointer;font-size:0.875rem;font-weight:600;">Accept</button>
    <button onclick="declineCookies()" style="background:transparent;color:#9ca3af;border:1px solid #374151;padding:0.5rem 1.25rem;border-radius:6px;cursor:pointer;font-size:0.875rem;">Decline</button>
  </div>
</div>
<script>
  function acceptCookies() { localStorage.setItem('cookie_consent','accepted'); document.getElementById('cookie-banner').style.display='none'; }
  function declineCookies() { localStorage.setItem('cookie_consent','declined'); document.getElementById('cookie-banner').style.display='none'; }
  window.addEventListener('load', function() { if (!localStorage.getItem('cookie_consent')) { document.getElementById('cookie-banner').style.display='flex'; } });
</script>
```
````

### C. Add new section: "Form Security (Mandatory)"

Add after the Cookie Banner section:

````markdown
### Form Security (Mandatory on all contact/quote forms)

Every form must include:

1. **Consent checkbox** (required field, unchecked by default):
```html
<label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.875rem;color:#6b7280;cursor:pointer;">
  <input type="checkbox" name="consent" required style="margin-top:3px;flex-shrink:0;" />
  <span>I agree to be contacted about my enquiry. View our <a href="/privacy-policy">Privacy Policy</a>.</span>
</label>
```

2. **No personal data in URL parameters** — form submissions must POST to Formspree/HubSpot, never GET with data in query string.

3. **Honeypot field** (anti-spam, hidden from users):
```html
<input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off" />
```
````

### D. Add new section: "Security Headers (vercel.json)"

Add as a new step between "Step 1: Generate the website" and "Step 2: Deploy":

````markdown
### Step 1b: Add Security Headers (vercel.json — mandatory)

Every deployment must include a `vercel.json` file in the project root with the following security headers. Copy from `FORGE/security/vercel_security_headers_snippet.json` and adjust the CSP `connect-src` for this client's integrations:

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
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' [ADD CLIENT APIS];" }
      ]
    }
  ]
}
```

CSP `connect-src` values by integration:
- HubSpot: `https://api.hsforms.com https://forms.hubspot.com`
- Formspree: `https://formspree.io`
- Calendly: `https://calendly.com`
````

### E. Update the Privacy Policy / legal pages instruction

In the page structure, replace any existing reference to legal pages with:

```
Legal pages to create alongside index.html:
- `privacy-policy.html` — use template from `FORGE/templates/privacy-policy.html`. Replace all {{PLACEHOLDERS}} with client data. Set ICO_REGISTRATION_NUMBER to FORGE's registered number once confirmed.
- `terms.html` — basic terms of use covering: no liability for service interruption, intellectual property ownership, governing law (England and Wales).
```

---

## 2. `deploy-team` — Additions Required

### A. Add security gate before ATLAS deploys

After the SCOUT → ATLAS handoff gate, add:

````markdown
### Pre-build security gate (ATLAS must confirm before building)

Before ATLAS writes a single line of HTML, confirm:
- [ ] Client vetting completed (see `FORGE/security/Client_Vetting_Criteria.md`)
- [ ] Client Hosting Agreement sent (or confirmed not required for this deploy type)
- [ ] DPA sent if client will collect personal data
- [ ] FORGE ICO registration number available to embed in footer

If any item is unconfirmed, flag to Aaron before proceeding. Do not block the build — flag and continue, but document the gap in the handover.
````

### B. Update Package 1 description for ATLAS

Replace:
```
**Package 1:** Standard website — hero, services, about, trust badges, WhatsApp CTA, cookie banner, Privacy Policy, T&Cs, footer.
```

With:
```
**Package 1:** Standard website — hero, services, about, trust badges, WhatsApp CTA, mandatory cookie banner, Privacy Policy page (from FORGE template with ICO number), T&Cs page, security headers (vercel.json), consent checkbox on all forms, legal footer with ICO registration number.
```

### C. Update FORGE QA checklist

In the "FORGE: Quality Assurance" section, expand the final site audit checklist to include:

```
- [ ] Cookie banner present and functional (accept/decline works)
- [ ] Privacy Policy page exists at /privacy-policy with ICO registration number
- [ ] T&Cs page exists at /terms
- [ ] All forms have consent checkbox (required, unchecked by default)
- [ ] Footer contains ICO registration number
- [ ] vercel.json security headers file present in project
- [ ] No hardcoded API keys or secrets in source HTML
- [ ] HTTPS redirect confirmed
```

---

## How to Apply These Updates

1. Go to **Settings → Capabilities** in Claude desktop
2. Find `one-click-website` → click Edit
3. Paste the additions above into the appropriate sections of the SKILL.md
4. Repeat for `deploy-team`

These changes mean every site FORGE builds from now on will be secure and legally compliant by default — not as a checklist afterthought.
