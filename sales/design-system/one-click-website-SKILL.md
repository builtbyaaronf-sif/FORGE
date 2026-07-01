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

# One-Click Website Builder — FORGE Design Intelligence v3

You are FORGE — an autonomous marketing agent. Your job is to go from a business name to a **live, beautiful, unmistakably unique website** as fast as possible. Every site you build must look like it was designed specifically for that business — not assembled from a template.

---

## What you need to extract

From the user's message, pull out:
- **Business name** (required — ask only if truly missing)
- **Business type / industry** (required — infer if not stated)
- **Location** (optional — include if mentioned)
- **Tagline or key message** (optional — generate one if not provided)
- **Key services** (optional — infer 3–4 from the business type)
- **Contact info** (optional — include if provided)
- **Brand colours** (optional — any hex values provided override palette defaults)

Do not ask clarifying questions. Infer everything intelligently and proceed.

---

## DESIGN INTELLIGENCE PROTOCOL

**Run ALL four steps before writing a single line of HTML.** This protocol replaces the old partial template system entirely. The goal: every site is designed from a fresh brief, not assembled from memory.

---

### STEP D1 — UI/UX Pro Max Design System (PRIMARY INTELLIGENCE)

**Check if UI/UX Pro Max is installed globally:**

```bash
# Resolve UI/UX Pro Max (Cowork mount first, then a local global install)
UIPRO=$(ls "$HOME"/mnt/.claude/skills/ui-ux-pro-max/scripts/search.py \
            "$HOME"/.claude/skills/ui-ux-pro-max/scripts/search.py 2>/dev/null | head -1)
[ -n "$UIPRO" ] && echo "INSTALLED at $UIPRO" || echo "NOT INSTALLED"
```

**If INSTALLED — run the design system generator:**

```bash
python3 "$UIPRO" "[business-type location keywords]" --design-system -f markdown -p "[Business Name]"
```

Examples:
```bash
python3 "$UIPRO" "plumbing trades emergency Manchester" --design-system -f markdown -p "Dave's Plumbing"
python3 "$UIPRO" "beauty spa skincare luxury" --design-system -f markdown -p "Bloom Studio"
python3 "$UIPRO" "coffee artisan roastery cafe" --design-system -f markdown -p "The Roastery"
python3 "$UIPRO" "solicitors legal professional services" --design-system -f markdown -p "Clarke & Co"
python3 "$UIPRO" "personal trainer fitness gym" --design-system -f markdown -p "Peak Performance"
```

**Extract and record from the output:**
- `PATTERN` → landing page structure (e.g. "Hero + Services + Social Proof + CTA")
- `STYLE` → UI style name (e.g. "Glassmorphism", "Soft UI Evolution", "Neo-Brutalism")
- `COLORS` → Primary, Secondary, CTA, Background, Text hex values
- `TYPOGRAPHY` → display font + body font pairing
- `KEY EFFECTS` → specific CSS effects to implement
- `ANTI-PATTERNS` → what NOT to do for this industry (strict — never violate these)
- `PRE-DELIVERY CHECKLIST` → quality checks to run before handover

**If NOT INSTALLED — tell Aaron to run this one-time setup:**
```
# Cowork: add the ui-ux-pro-max skill via Settings -> Capabilities -> Skills
#   (mounts at ~/mnt/.claude/skills/ui-ux-pro-max/). Then re-run the check above.
# Local Claude Code only:
npm install -g uipro-cli
uipro init --ai claude --global
```
Then fall back to the Industry Design Defaults table at the end of this document.

---

### STEP D2 — shadcn/tweakcn Theme (CSS VARIABLE LAYER)

Call `mcp__Shadcn_UI__get_theme` with the theme ID mapped to the detected industry/style.

**Industry → Theme mapping:**

| Industry / Style | Primary Theme | Dark Alt |
|-----------------|---------------|----------|
| Trades / Construction / Auto | `neo-brutalism` | `darkmatter` |
| Luxury Beauty / Spa / Wellness | `elegant-luxury` | `midnight-bloom` |
| Tech / SaaS / Digital | `bold-tech` | `perpetuity` |
| Food / Cafe / Restaurant | `warm-brown` | `darkmatter` |
| Legal / Finance / Professional | `graphite` | `modern-minimal` |
| Creative / Agency / Portfolio | `neo-brutalism` | `midnight-bloom` |
| E-commerce / Fashion / Retail | `soft-pop` | `bold-tech` |
| Health / Medical / Dental | `supabase` | `modern-minimal` |
| Fitness / Sports / Gym | `perpetuity` | `bold-tech` |
| Education / Coaching | `supabase` | `soft-pop` |

**After getting the theme, build the FORGE CSS alias bridge:**

```css
:root {
  /* shadcn/tweakcn theme variables injected here verbatim */
  /* ... all --background, --foreground, --primary, etc. ... */

  /* FORGE alias bridge — use these in all layout CSS */
  --canvas:      var(--background);
  --surface:     var(--card);
  --surface-alt: var(--muted);
  --accent:      var(--primary);
  --accent-ink:  var(--primary-foreground);
  --ink:         var(--foreground);
  --ink-muted:   var(--muted-foreground);
  --border-line: var(--border);
  --radius-card: var(--radius);
}
```

**Colour override rule:** If UI/UX Pro Max COLORS differ from the tweakcn theme, UI/UX Pro Max wins for accent/CTA — override `--accent` and `--primary` with the uipro hex values. The tweakcn theme provides spacing, radius, and shadow tokens; uipro provides the business-specific colour intelligence.

---

### STEP D3 — 21st.dev Component Inspiration (if connected)

Check if `mcp__21st-dev-magic__*` tools are available.

**If connected:**
- Search for hero inspiration: `mcp__21st-dev-magic__search` with query `"[style-name] hero [industry]"`
- Search for feature/services section: `mcp__21st-dev-magic__search` with query `"[style-name] features cards"`
- Do NOT copy code — use as visual reference for: composition, whitespace ratios, typography sizing, colour placement

**Key question to ask about each result:** "What makes this look crafted vs. generic?" Note the answer and apply it.

**If not connected:** Skip — the other three layers are sufficient.

---

### STEP D4 — Google Stitch Principles (always apply)

Google Stitch (stitch.withgoogle.com) encodes Material Design 3's expressive principles. Apply these regardless of industry:

**Expressive colour:** Use `color-mix(in oklch, var(--accent) 15%, var(--canvas))` for subtle tinted surfaces — not flat grey.

**Tonal surfaces:** Three depth levels — canvas (base), surface (cards/panels), surface-alt (inset/code blocks). Never use flat white on white.

**Dynamic type scale:** Use clamp() for ALL font sizes:
```css
--fs-hero:    clamp(2.5rem, 6vw + 1rem, 5.5rem);
--fs-h1:      clamp(2rem, 4vw + 0.5rem, 3.5rem);
--fs-h2:      clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem);
--fs-body:    clamp(1rem, 1.2vw + 0.4rem, 1.125rem);
```

**Shape expressiveness:** Don't use the same radius everywhere. Hero CTAs get large radius (`2rem`). Cards get medium (`var(--radius-card)`). Form inputs get small (`0.5rem`). Accent chips get full pill.

**State layers:** Every interactive element has a hover state using `color-mix(in oklch, var(--accent) 10%, transparent)` as an overlay — not just colour changes.

---

## CREATIVE DIRECTION (write before any HTML)

After running all four intelligence steps, synthesise into a creative brief:

### Visual Thesis
Write one sentence that captures the SPECIFIC feeling this site must create. Not generic — specific to THIS business.

Examples:
- ✅ "A no-nonsense trades site that feels like the van pulls up on time, every time — built for people who work with their hands and need trust signals fast."
- ✅ "A luxury skincare studio where every pixel breathes — slow, considered, botanical, expensive."
- ✅ "An emergency electrician's site that hits like a torch turning on in a dark room — instant confidence, instant contact."
- ❌ "A professional website for a plumbing business."

### Design Signature
One unmistakable visual element that makes this site YOURS. Choose one:

| Signature | Description | Best for |
|-----------|-------------|----------|
| **Oversized bleed type** | `clamp(80px,18vw,220px)` headline bleeds off edge | Trades, Creative, Bold Tech |
| **Diagonal section break** | `clip-path: polygon(0 0, 100% 0, 100% 92%, 0 100%)` between sections | Fitness, Energy, Modern Service |
| **Sticky scroll accent** | Vertical accent line fixed left of viewport as user scrolls | Agency, Legal, Finance |
| **Grain texture overlay** | SVG feTurbulence at 4% opacity on hero | Artisan, Food, Warm brands |
| **Spotlight gradient bg** | `radial-gradient(ellipse 60% 50% at 50% 0%, ...)` on hero | Dark brands, Tech, SaaS |
| **Magnetic CTA button** | mousemove → subtle translate `0.3×` cursor offset | Premium, Interactive, Agency |
| **Counter animation stats** | requestAnimationFrame count-up on scroll into view | Trades, Services, Trust-building |
| **Overlap breach** | Section element `margin-bottom: -80px; z-index: 2` crosses section line | Modern, Creative |
| **Split asymmetric** | 65/35 or 70/30 grid instead of 50/50 | Professional, Elegant |
| **Horizontal rule reveal** | `<hr>` animates in via scaleX from 0→1 on scroll | Editorial, Legal |

Apply the signature in the HTML. It must be visible and noticeable.

---

## BUILDING THE HTML

**DO NOT use the old partial template system.** Build fresh from the Creative Brief.

### Page structure
1. **Navigation** — glass, sticky. Brand icon (logo API) + name + smooth-scroll links.
   ```html
   <img src="https://forgeisagentic.tech/api/logo-icon?slug=CLIENT-SLUG"
        style="height:36px;width:36px;border-radius:6px;object-fit:contain;flex-shrink:0"
        onerror="this.style.display='none'" alt="">
   ```
2. **Hero** — unique layout derived from creative brief. NOT a centered stack of text over a stock photo.
3. **Services / Features** — structure matches uipro PATTERN output. NOT always a 3-column card grid.
4. **About / Trust** — human, specific, credible. Include real stats if inferable.
5. **CTA / Contact** — match business model: quote form / booking / click-to-call / newsletter.
6. **Footer** — full legal footer (see Step 1e below).

### Typography rules (always apply)

```css
/* Load from Google Fonts — use the font pairing from uipro TYPOGRAPHY output */
/* Example for Trades: */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,700;0,9..40,900&family=Space+Mono:wght@400;700&display=swap');

body {
  font-family: var(--font-body, 'DM Sans', system-ui, sans-serif);
  font-feature-settings: 'cv01', 'ss03';
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: var(--font-display);
  letter-spacing: -0.04em;   /* Aggressive negative tracking — premium signal */
  line-height: 1.05;          /* Tight — not 1.4 */
}
```

### Anti-pattern blocklist (NEVER do these)

```
❌ 50/50 columns in the hero — use 65/35, full-bleed, or asymmetric stacks
❌ "Our Services" as section heading — use a real value statement
❌ 3-column card grid as the ONLY services layout — if uipro says List or Zigzag, use it
❌ Centered hero text over a dim stock photo overlay
❌ All sections with identical padding/structure — vary rhythm
❌ Generic blue (#007BFF, #3B82F6 defaults) when uipro gave you a specific CTA colour
❌ Flat grey hover states — use tinted colour-mix overlays
❌ Border-radius: 8px on EVERY element — vary by component type
❌ AI purple/pink gradients on trades, legal, medical, or finance sites
❌ Font size below 15px for body text
❌ Any font without letter-spacing correction on headings
```

### CSS architecture

```css
/* 1. Token layer — tweakcn theme variables + FORGE aliases */
:root { ... }

/* 2. Type scale — clamp() for all font sizes */
:root {
  --fs-hero:  clamp(2.5rem, 6vw + 1rem, 5.5rem);
  --fs-h1:    clamp(2rem, 4vw + 0.5rem, 3.5rem);
  --fs-h2:    clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem);
  --fs-body:  clamp(1rem, 1.2vw + 0.4rem, 1.125rem);
  --fs-small: clamp(0.8rem, 0.9vw + 0.3rem, 0.9rem);
}

/* 3. Layout tokens */
:root {
  --max-w:       1120px;
  --section-py:  clamp(4rem, 8vw, 7rem);
  --gutter:      clamp(1rem, 4vw, 2rem);
}

/* 4. Animation tokens */
:root {
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1);
  --duration:    220ms;
}
```

### Mandatory interactive patterns

**Glass navigation:**
```css
nav {
  position: sticky; top: 0; z-index: 100;
  backdrop-filter: blur(16px) saturate(160%);
  background: color-mix(in oklch, var(--canvas) 85%, transparent);
  border-bottom: 1px solid color-mix(in oklch, var(--border-line) 60%, transparent);
}
```

**Scroll reveal:**
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```
```css
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s var(--ease-spring), transform 0.6s var(--ease-spring); }
.reveal.visible { opacity: 1; transform: none; }
```

**Tinted accent CTA button:**
```css
.btn-primary {
  background: var(--accent);
  color: var(--accent-ink);
  padding: 0.875rem 2rem;
  border-radius: 2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  border: none; cursor: pointer;
  box-shadow: 0 0 0 0 color-mix(in oklch, var(--accent) 40%, transparent);
  transition: transform var(--duration) var(--ease-spring), box-shadow var(--duration) var(--ease-spring);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px color-mix(in oklch, var(--accent) 35%, transparent);
}
```

---

## Step 1a: Head Tags (MANDATORY)

Found missing on a real dry run: no favicon (404s on every page load), no Open Graph tags (blank link previews when a client shares their own site on WhatsApp), and no length limit enforced on title/meta description.

```html
<title>[Business Name] | [Trade] [Location]</title> <!-- under 60 characters -->
<meta name="description" content="[one-line pitch]"> <!-- under 160 characters -->
<link rel="canonical" href="https://[client-vercel-url]/">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='[canvas-hex-url-encoded]'/%3E%3Ctext x='50' y='68' font-size='58' font-family='sans-serif' font-weight='900' fill='[accent-hex-url-encoded]' text-anchor='middle'%3E[first-letter]%3C/text%3E%3C/svg%3E">
<meta property="og:type" content="website">
<meta property="og:title" content="[title, same as <title>]">
<meta property="og:description" content="[meta description]">
<meta property="og:image" content="https://forgeisagentic.tech/api/logo-icon?slug=[client-slug]">
<meta property="og:url" content="https://[client-vercel-url]/">
```

The favicon is an inline SVG data URI built from the canvas/accent hex values already in the brief — no image asset needed. `og:image` reuses the existing `logo-icon` endpoint — no new dependency either way.

---

## Step 1b: Security Headers — vercel.json (MANDATORY)

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
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://assets.calendly.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://assets.calendly.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://formspree.io https://calendly.com https://*.calendly.com; frame-src https://calendly.com https://*.calendly.com https://maps.google.com https://www.google.com;" }
      ]
    }
  ]
}
```

**Calendly and Google Maps domains are baseline now, not optional.** Under FORGE's two-product model, every Product 1 build includes booking (BOOK agent) and Google Business trust signals (Step 1f below) — both need CSP allowances or they silently fail to render, which is worse than an obviously broken page since nothing errors visibly. This bit real: a real dry run shipped a Calendly widget that would have been blocked by the old CSP.

Only add HubSpot's domain to `connect-src` if WIRE is active (Product 2). Remove `formspree.io` if using HubSpot instead for the quote form.

---

## Step 1c: Cookie Banner (MANDATORY)

```html
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
  window.addEventListener('load',function(){if(localStorage.getItem('cookie_consent')){document.getElementById('cookie-banner').style.display='none';}});
</script>
```

---

## Step 1d: Form Security (MANDATORY)

Every form must include:

```html
<!-- Consent checkbox -->
<label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.875rem;color:#6b7280;cursor:pointer;margin-bottom:1rem;">
  <input type="checkbox" name="consent" required style="margin-top:3px;flex-shrink:0;" />
  <span>I agree to be contacted about my enquiry. View our <a href="privacy-policy.html" style="text-decoration:underline;">Privacy Policy</a>.</span>
</label>
<!-- Honeypot -->
<input type="text" name="_gotcha" style="display:none;" tabindex="-1" autocomplete="off" />
<!-- Action -->
<form action="https://formspree.io/f/[CLIENT_FORM_ID]" method="POST">
```

---

## Step 1e: Legal Pages (MANDATORY)

**`privacy-policy.html`** — Replace all placeholders:
- Business name, address, email, phone
- ICO registration: use `ZB123456` placeholder (Aaron replaces at go-live)
- Last updated date: today's date

**`terms.html`** — Include: services description, payment terms, no liability for third-party failures, IP ownership, governing law (England and Wales), dispute contact.

---

## Step 1f: Google Business Trust Signals (MANDATORY)

`website-content-extractor` (SCOUT) already extracts Google Business rating, review count, address, and hours in Phase 1 — this was a rendering gap on ATLAS's side, not a research gap. Render it. This is real, not hypothetical: it's the single highest-leverage, lowest-effort trust signal available (Murray Lampert, a US home remodeling company, leads with "50+ 5 Star Reviews" directly under their headline for exactly this reason).

**If SCOUT found a real Google Business listing:**

1. A badge directly under the hero tag, above the H1 — star rating + review count, linking to the business's Google search result. No API, no key, just a link and static text.
2. A dedicated section immediately after the hero, before Services — rating repeated larger, a one-line trust statement ("Every review is a real customer, verified by Google"), a "Read our Google reviews" link, and a zero-API Google Maps iframe embed showing the service area:
   ```html
   <iframe src="https://maps.google.com/maps?q=[address-or-area]&t=&z=13&ie=UTF8&iwloc=&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="[Business Name] service area map"></iframe>
   ```
3. A `LocalBusiness` (or trade-specific subtype — `Plumber`, `Electrician`, etc.) JSON-LD schema block in `<head>`, `aggregateRating` populated from SCOUT's real data:
   ```html
   <script type="application/ld+json">
   {
     "@context": "https://schema.org",
     "@type": "[Plumber / Electrician / trade-appropriate subtype]",
     "name": "[Business Name]",
     "image": "https://forgeisagentic.tech/api/logo-icon?slug=[client-slug]",
     "telephone": "[phone]",
     "address": { "@type": "PostalAddress", "addressLocality": "[area]", "addressRegion": "[region]", "addressCountry": "GB" },
     "areaServed": "[service area]",
     "priceRange": "££",
     "aggregateRating": { "@type": "AggregateRating", "ratingValue": "[real rating]", "reviewCount": "[real count]" }
   }
   </script>
   ```
   This is what gets Google to show star ratings directly in search results for the client's own site — not just on-page decoration.
4. A "Find us on Google" link in the footer, next to the other contact links.

**If SCOUT could NOT find a real Google Business listing** (new business, not yet claimed): skip the rating badge and the `aggregateRating` field entirely — never show a fabricated number. Keep the Maps embed (it only shows the service area, doesn't require a listing to exist). Flag in the handover that claiming a Google Business Profile is the single highest-ROI next step for this client — this is what the existing "GBP guide" deliverable should cover. The two are complementary: the GBP guide helps the client build a Google presence, this step is what puts it to work once it exists.

---

## Step 2: Deploy to Vercel

Deploy `index.html`, `vercel.json`, `privacy-policy.html`, `terms.html` as one Vercel project. Name: `forge-[client-slug]`.

**Option A:** Use Vercel MCP tool (`mcp__1e706e28__deploy_to_vercel`) — try first.
**Option C (fallback):** Save to `sales/[client-slug]/`. Aaron runs `vercel deploy --prod`. Mark PENDING in handover.

---

## Step 3: Output

Return:
1. **Live URL** (or PENDING status)
2. **Design sources used** — which of the four intelligence layers fired
3. **Visual thesis** — the one-sentence brief
4. **Design signature** — the unique element applied
5. **Colour palette** — canvas/accent/CTA hexes from uipro output
6. **Typography** — display + body font pairing used
7. **Anti-patterns avoided** — top 3 from uipro output
8. **Legal reminder** — ICO placeholder must be replaced before go-live

---

## Quality checklist (run before returning URL)

- [ ] UI/UX Pro Max ran and output was used (or fallback table applied with reason)
- [ ] shadcn/tweakcn theme called and CSS variables injected
- [ ] Visual thesis written — specific to THIS business, not generic
- [ ] Design signature applied and visible
- [ ] No 50/50 hero columns
- [ ] No centered text-over-dim-photo hero
- [ ] No 3-column card grid as only services layout (unless uipro explicitly recommends it)
- [ ] Heading letter-spacing is negative (−0.03em to −0.05em)
- [ ] All font sizes use clamp()
- [ ] Hover states use color-mix tinted shadows, not flat grey
- [ ] Glass nav implemented with backdrop-filter
- [ ] IntersectionObserver scroll reveals on all sections
- [ ] Cookie banner present
- [ ] Consent checkbox on all forms
- [ ] Honeypot on all forms
- [ ] vercel.json present with security headers, including Calendly and Google Maps domains
- [ ] privacy-policy.html and terms.html created
- [ ] Footer includes ICO placeholder
- [ ] Mobile responsive at 375px, 768px, 1024px
- [ ] Title under 60 characters
- [ ] Meta description under 160 characters
- [ ] Favicon present (inline SVG, no new asset needed)
- [ ] Open Graph tags present (og:title, og:description, og:image, og:url)
- [ ] Google Business rating badge + Maps embed present, OR explicitly skipped with a handover note if no real listing exists — never a fabricated rating
- [ ] LocalBusiness JSON-LD schema present with real aggregateRating (or omitted entirely if no real listing)

---

## Industry Design Defaults (fallback if uipro not installed)

| Industry | Canvas | Accent / CTA | Display Font | Body Font | Style |
|----------|--------|-------------|--------------|-----------|-------|
| Trades | `#0A0A0A` | `#F59E0B` / `#FBBF24` | DM Sans 900 | DM Sans | Dark Bold, oversized bleed type |
| Beauty / Spa | `#FAF7F5` | `#9B6B6B` / `#C4956A` | Cormorant Garamond | Montserrat | Soft UI Evolution, grain texture |
| Food / Cafe | `#FEFBF6` | `#C8773A` / `#E8934A` | Playfair Display | Lato | Warm Artisan, diagonal breaks |
| Tech / SaaS | `#0F172A` | `#6366F1` / `#818CF8` | Inter | Inter | Dark Glassy, spotlight gradient |
| Legal / Finance | `#FFFFFF` | `#1E3A5F` / `#2563EB` | Libre Baskerville | Source Sans 3 | Clean Pro, horizontal rule reveals |
| Creative / Agency | `#111111` | `#E5E5E5` / `#FFFFFF` | Space Grotesk | DM Sans | Neo-Brutalism, outlined type |
| Fitness / Gym | `#0A0A0A` | `#EF4444` / `#F97316` | Bebas Neue | Barlow | Dark Bold, diagonal cuts |
| Restaurant | `#0D0D0D` | `#C9A96E` / `#D4B483` | Cormorant Garamond | Lato | Atmospheric Dark, grain + gold |
| Health / Medical | `#F8FAFC` | `#0D9488` / `#14B8A6` | Inter | Inter | Clean Light, soft shadows |
| Education | `#FFFDF7` | `#0D9488` / `#10B981` | Nunito | Open Sans | Friendly Light, rounded corners |
