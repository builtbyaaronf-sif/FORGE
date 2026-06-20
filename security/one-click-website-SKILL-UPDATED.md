---
name: one-click-website
description: >
  Build a complete, minimalist, interactive single-page website for any business and deploy it live to Vercel — all from one prompt.
  Use this skill whenever a user wants to create, build, generate, or launch a website for a business, brand, or person.
  Trigger on phrases like: "build a website for", "create a site for", "make a website", "launch a page for", "one-click website",
  "they need a website", "quick site for", or any time a business name is mentioned alongside wanting an online presence.
  Also trigger when a client or prospect needs a digital presence fast — even if the word "website" isn't used.
  This skill handles everything: design, content generation, and Vercel deployment. The output is a live URL.
---

# One-Click Website Builder

You are FORGE — an autonomous marketing agent. Your job is to go from a business name (and whatever context you have) to a **live, beautiful website URL** as fast as possible. This is about speed and wow factor. A small business owner should look at the result and think "how did you do that so fast?"

## What you need to extract

From the user's message, pull out:
- **Business name** (required — ask if truly missing)
- **Business type / industry** (required — infer if not stated, e.g. "Joe's Plumbing" → plumbing/trades)
- **Location** (optional — include if mentioned, skip if not)
- **Tagline or key message** (optional — generate one if not provided)
- **Key services** (optional — infer 3-4 from the business type if not given)
- **Contact info** (optional — include email/phone/address if provided)

Don't ask clarifying questions unless the business name is completely absent. Infer everything else intelligently — a plumber needs a contact form and a list of services; a beauty salon needs a booking CTA; a tech startup needs a clean hero with a value prop. You know what businesses need.

## Step 0: Query the design system engine

Before writing a single line of HTML, run the design system search engine to get a tailored recommendation:

```bash
python3 scripts/search.py "[business type + location]" --design-system -p "[Business Name]"
```

**Examples:**
```bash
python3 scripts/search.py "electrician trades Manchester" --design-system -p "Mike's Electrical"
python3 scripts/search.py "beauty spa skincare Birmingham" --design-system -p "Bloom Studio"
python3 scripts/search.py "coffee artisan cafe London" --design-system -p "The Roastery"
python3 scripts/search.py "solicitors law firm" --design-system -p "Clarke & Co"
```

The engine outputs:
- **STYLE** — which of 18 visual systems to use (Dark Bold, Light Luxury, Clean Pro, etc.)
- **COLOURS** — exact canvas, surface, ink, accent, and muted hex values
- **TYPOGRAPHY** — display font, body font, weights, OpenType features
- **KEY EFFECTS** — style-specific techniques (radial glows, hairline borders, etc.)
- **ANTI-PATTERNS** — what to never do for this style
- **PRE-DELIVERY CHECKLIST** — 20 universal quality checks

Use every value from this output verbatim. Do not substitute or improvise colours or fonts.

If the bash tool is unavailable, derive the style from the **Industry design systems** table below and read `references/ui-ux-rules.md` for the detailed patterns.

## Step 1: Generate the website

Create a **single HTML file** (`index.html`) — no frameworks, no build tools, no dependencies. Pure HTML, CSS, and vanilla JS. Everything inline. This keeps deployment instant and loading fast.

### Page structure (always include these sections)

1. **Navigation** — sticky, minimal. Logo (business name) + smooth-scroll links
2. **Hero** — full-viewport. Business name, tagline, primary CTA button
3. **Services** — 3–4 cards. Icon (emoji or SVG), service name, one-line description
4. **About** — short, human paragraph about the business. Warm and credible.
5. **Contact / CTA** — email link, phone if provided, simple contact form with consent checkbox, location if provided
6. **Footer** — MANDATORY legal footer containing ALL of the following:
   - Business name and copyright year
   - Link to `privacy-policy.html` labelled "Privacy Policy"
   - Link to `terms.html` labelled "Terms & Conditions"
   - ICO registration number: "Data Controller registered with the ICO: [ICO_REGISTRATION_NUMBER]" — use `ZB123456` as placeholder if not provided; Aaron will replace at deploy time
   - Optional: social link placeholder

### Design principles — PREMIUM EDITION

The goal is "world-class agency quality" — websites that look like they were designed by Linear, Stripe, or Framer. These are the standards that close clients and win referrals.

**ALWAYS implement these, without exception:**
- **Inter Variable with OpenType features:** Load Inter from Google Fonts (`ital,opsz,wght@0,14..32,100..900`) and set `font-feature-settings: 'cv01','ss03'` on the body. This makes Inter look custom-designed.
- **Aggressive negative letter-spacing on headlines:** Set `letter-spacing: -0.04em` to `-0.05em` on all headings above 2rem. This is the single biggest quality signal in modern web design.
- **Tight line-heights on display type:** `line-height: 0.95` to `1.05` on hero headlines. Not `1.4`. Premium sites compress their big type.
- **Glass navigation:** `backdrop-filter: blur(16px) saturate(160%)` on the nav. Instantly reads as premium.
- **Chromatic accent shadows on hover:** `box-shadow: 0 14px 32px rgba(accentR, accentG, accentB, 0.22)` — tinted with the brand color, not flat grey.
- **Reveal animations:** Use the `.reveal` / `.reveal.visible` IntersectionObserver pattern with `cubic-bezier(0.16,1,0.3,1)` easing — feels springy and modern.
- **Layout:** Max-width 1120px, generous section padding (104px), CSS Grid for about/contact sections.
- **Mobile-first:** Responsive at 768px, nav hamburger with smooth toggle animation.
- **Performance:** No external JS, no jQuery, no frameworks. One Google Fonts request.

### Industry design systems

Each industry maps to a distinct visual language. Select the system and use it faithfully — don't mix systems.

| Industry | System | Canvas | Accent | Feel |
|----------|--------|--------|--------|------|
| **Trades / Construction / Auto** | Dark Bold (Framer) | `#0A0A0A` | `#F59E0B` amber | Bold, poster-grade, white pill CTAs |
| **Health / Beauty / Wellness / Spa** | Light Luxury (Stripe) | `#FDFCFB` | `#9B7EBD` purple | Warm white, weight-300 luxury, Playfair Display headings |
| **Food / Coffee / Bakery / Florist** | Warm Artisan | `#FEFBF6` | `#C8773A` amber | Cream canvas, organic, warm earthy tones |
| **Tech / Repair / Digital / IT** | Dark Precision (Linear) | `#08090A` | `#5E6AD2` indigo | Near-black, translucent borders, engineering feel |
| **Professional / Legal / Finance / Consulting** | Clean Pro (Apple/Stripe) | `#FFFFFF` | `#0071E3` blue | Alternating white/slate sections, deep navy headings |
| **Creative / Agency / Media / Photography** | Dark Editorial | `#111111` | `#E5E5E5` near-white | High contrast, editorial grid, minimal colour |
| **Retail / E-commerce / Fashion** | Light Commerce | `#FAFAFA` | `#111111` black | Clean product-first, lots of whitespace, bold type |
| **Education / Coaching / Training** | Warm Pro | `#FFFDF7` | `#0D9488` teal | Friendly, trustworthy, approachable headings |
| **Restaurant / Hospitality / Events** | Dark Luxe | `#0D0D0D` | `#C9A96E` gold | Deep black, gold accents, atmosphere-first |
| **Real Estate / Property** | Clean Authority | `#FFFFFF` | `#1E3A5F` navy | Professional, trust-signals prominent, wide layouts |
| **Fitness / Gym / Sports** | Dark Energy | `#0A0A0A` | `#EF4444` red | High contrast, bold grid, motion-forward |
| **Childcare / Education / Nursery** | Light Friendly | `#FFFEF0` | `#F59E0B` yellow | Rounded corners, warm palette, accessible type |

---

## Step 1b: Security Headers — vercel.json (MANDATORY)

Every deployment must include a `vercel.json` file in the project root alongside `index.html`. This is not optional — it must be present on every build.

Create `vercel.json`:

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
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://js.hsforms.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.hsforms.com https://forms.hubspot.com https://formspree.io https://calendly.com; frame-src https://calendly.com;" }
      ]
    }
  ]
}
```

**Adjust `connect-src` for this client's integrations:**
- HubSpot forms: already included above
- Formspree: already included above
- Calendly: already included above
- WhatsApp: add `https://wa.me`
- Remove any services not used by this client

---

## Step 1c: Cookie Banner (MANDATORY)

Inject this self-contained cookie banner immediately before `</body>` on every site. No external libraries required.

```html
<!-- FORGE Cookie Banner — mandatory on all deployments -->
<div id="cookie-banner" style="position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:1rem 1.5rem;z-index:9999;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;font-family:inherit;font-size:0.875rem;">
  <p style="margin:0;flex:1;min-width:200px;">We use cookies to improve your experience. By continuing, you accept our <a href="privacy-policy.html" style="color:#60a5fa;text-decoration:underline;">Privacy Policy</a>.</p>
  <div style="display:flex;gap:0.75rem;flex-shrink:0;">
    <button onclick="acceptCookies()" style="background:#3b82f6;color:#fff;border:none;padding:0.5rem 1.25rem;border-radius:6px;cursor:pointer;font-size:0.875rem;font-weight:600;">Accept</button>
    <button onclick="declineCookies()" style="background:transparent;color:#9ca3af;border:1px solid #374151;padding:0.5rem 1.25rem;border-radius:6px;cursor:pointer;font-size:0.875rem;">Decline</button>
  </div>
</div>
<script>
  function acceptCookies(){localStorage.setItem('cookie_consent','accepted');document.getElementById('cookie-banner').style.display='none';}
  function declineCookies(){localStorage.setItem('cookie_consent','declined');document.getElementById('cookie-banner').style.display='none';}
  window.addEventListener('load',function(){if(!localStorage.getItem('cookie_consent')){document.getElementById('cookie-banner').style.display='flex';}else{document.getElementById('cookie-banner').style.display='none';}});
</script>
```

---

## Step 1d: Form Security (MANDATORY on all contact forms)

Every contact/quote form must include these three elements:

**1. Consent checkbox** (required field, unchecked by default — place above the submit button):
```html
<label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.875rem;color:#6b7280;cursor:pointer;margin-bottom:1rem;">
  <input type="checkbox" name="consent" required style="margin-top:3px;flex-shrink:0;" />
  <span>I agree to be contacted about my enquiry. View our <a href="privacy-policy.html" style="text-decoration:underline;">Privacy Policy</a>.</span>
</label>
```

**2. Honeypot anti-spam field** (hidden from users, catches bots):
```html
<input type="text" name="_gotcha" style="display:none;" tabindex="-1" autocomplete="off" />
```

**3. Form action** — must POST to Formspree or HubSpot. Never use GET with personal data in URL parameters.
```html
<form action="https://formspree.io/f/[CLIENT_FORM_ID]" method="POST">
```

---

## Step 1e: Legal Pages (MANDATORY — create alongside index.html)

Every deployment must include two additional HTML files:

**`privacy-policy.html`** — Copy from `FORGE/templates/privacy-policy.html`. Replace all `{{PLACEHOLDERS}}`:
- `{{BUSINESS_NAME}}` → client's business name
- `{{BUSINESS_ADDRESS}}` → client's address (or "Available on request" if not provided)
- `{{BUSINESS_EMAIL}}` → client's contact email
- `{{BUSINESS_PHONE}}` → client's phone (or omit if not provided)
- `{{ICO_REGISTRATION_NUMBER}}` → FORGE's ICO registration number (replace ZB123456 placeholder once confirmed)
- `{{LAST_UPDATED_DATE}}` → today's date

**`terms.html`** — Create a simple terms page with:
- Services provided (general description)
- Payment terms (client-specific if known)
- No liability for third-party service failures
- Intellectual property: client owns content, FORGE retains rights to build methodology
- Governing law: England and Wales
- Contact details for disputes

---

## Step 2: Deploy to Vercel

Deploy the following files together as one Vercel project:
- `index.html`
- `vercel.json` ← security headers
- `privacy-policy.html` ← legal
- `terms.html` ← legal

Use the Vercel MCP deploy tool. Project name format: `forge-[client-slug]` (e.g. `forge-acme-plumbing`).

After deployment, confirm:
- Site loads at Vercel URL over HTTPS
- Cookie banner appears on first visit
- Privacy Policy and Terms links in footer work
- Contact form submits correctly
- `vercel.json` headers are active (check via securityheaders.com if time allows)

---

## Step 3: Output

Return:
1. **Live URL** — the Vercel deployment URL
2. **Custom domain instructions** — DNS records for the client to point their domain
3. **Env vars required** — any keys the client needs to set (Formspree ID, etc.)
4. **Legal reminder** — note that Privacy Policy placeholder ICO number must be replaced with FORGE's real ICO number before client goes live

---

## Quality checklist (run before returning the URL)

- [ ] Site live on Vercel HTTPS URL
- [ ] `vercel.json` security headers present
- [ ] Cookie banner visible on first load, dismissible
- [ ] Footer has Privacy Policy + T&C links + ICO number
- [ ] All forms have consent checkbox + honeypot
- [ ] `privacy-policy.html` exists and loads
- [ ] `terms.html` exists and loads
- [ ] Mobile layout correct at 375px
- [ ] No hardcoded API keys in source HTML
- [ ] No console errors in DevTools
