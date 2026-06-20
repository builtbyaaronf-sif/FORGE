---
name: brand-kit
description: >
  Generate a complete Canva brand kit for a FORGE client using the Canva MCP. Creates a colour
  palette card, logo concept (text-based), social post template (1080×1080), Instagram/Facebook
  cover, and exports links the client can access and edit. Trigger on: "brand kit", "Canva brand
  kit", "create their brand", "logo and colours", "Package 2", "Package 3", "Package 4",
  "Package 5", "design assets", "social templates", "give them a brand identity", or any time a
  client needs designed brand assets beyond a website.
  Also auto-triggers inside deploy-team for Package 2+ builds.
  Uses the connected Canva MCP (generate-design, list-brand-kits, export-design, get-assets).
---

# Brand Kit Skill

## What This Builds

A complete, professional brand kit delivered as Canva designs the client can edit, export, and use immediately:

1. **Colour palette card** — primary, secondary, and accent colours with hex codes, displayed cleanly
2. **Logo concept** — text-based wordmark using the brand fonts (not a symbol logo — Canva AI generates typographic treatments)
3. **Social post template** — 1080×1080px Instagram/Facebook post template with brand colours and placeholder content areas
4. **Cover image** — 1200×630px Facebook/LinkedIn cover using the brand colours and business name
5. **Canva share links** — direct edit links for each asset, shared with the client's email

All designs are generated via the Canva MCP and stored in the client's Canva account (or FORGE's account if the client doesn't have one yet).

---

## Inputs

| Field | Description | Default |
|---|---|---|
| `business_name` | Client business name | Required |
| `industry` | Business type/trade | `"general"` |
| `brand_color_primary` | Main brand colour (hex) | From website brief |
| `brand_color_secondary` | Supporting colour (hex) | Derived from primary |
| `brand_color_accent` | CTA/highlight colour (hex) | From website brief |
| `font_style` | `"modern"` / `"classic"` / `"bold"` / `"friendly"` | `"modern"` |
| `tone` | Brand personality in 3 words (from brief) | Derived from industry |
| `tagline` | Optional strapline | Derived from positioning |
| `client_email` | Email to share Canva designs to | Required |

---

## Before You Start: Derive Missing Colours

If `brand_color_secondary` is not provided, derive it from `brand_color_primary`:
- If primary is dark (brightness < 50%): secondary = a lighter tint at 30% opacity on white
- If primary is light: secondary = a darker shade at 70% of original brightness
- Neutral: add a warm grey (`#F5F5F0`) or cool grey (`#F0F4F8`) as a neutral secondary

**Colour validation:** ensure the primary, secondary, and accent colours have sufficient contrast (WCAG AA minimum: 4.5:1 for text). If not, adjust the lightest or darkest shade until they pass.

---

## Font Pairings by Style

| `font_style` | Heading font | Body font |
|---|---|---|
| `modern` | Space Grotesk | Inter |
| `classic` | Playfair Display | EB Garamond |
| `bold` | Bebas Neue | Montserrat |
| `friendly` | Nunito | Poppins |

If `font_style` is not specified, infer from industry:
- Trades/construction → `bold`
- Beauty/wellness → `friendly`
- Professional services → `classic`
- Tech/digital → `modern`

---

## MARK Agent — Logo Wizard (Run FIRST, before any Canva work)

**This is Phase 0 of every brand build.** The logo is the anchor of all brand assets. It must be confirmed before Canva templates are generated so the logo can be embedded in social templates, covers, and the website.

### How MARK works

1. **Build starts immediately** (no waiting). ATLAS deploys the site with a text-based placeholder where the logo will go.

2. **Client receives the logo wizard link** in their confirmation email automatically. The URL format:
   ```
   https://forgeisagentic.tech/logo-wizard.html?slug={client-slug}&name={business_name}&trade={trade}&color={accent_hex}&email={client_email}&pkg={pkg}
   ```

3. **Client picks one of 3 logo styles** (live previews auto-generated in their brand colours):
   - **Style A** — Geometric badge + wordmark (horizontal, for headers/email/banners)
   - **Style B** — Circle badge (square, for all social profile pictures + favicon)
   - **Style C** — Bold wordmark (clean/minimal, for documents/correspondence)

4. **On confirmation**, `/api/logo-confirm` fires automatically:
   - Stores choice in Vercel KV (`logo:{slug}`)
   - Generates 9 named asset URLs
   - Notifies Aaron via email with the full asset pack

5. **Aaron re-deploys the client site** with the chosen logo embedded (2 min manual step).

### 9 assets generated per client

| File key | Use | Style |
|---|---|---|
| `primary` | Website header, email footer, document header | Chosen (A or C) |
| `primary_light` | Invoices, white backgrounds | Chosen (A or C), light bg |
| `icon` | All social profile pictures | Style B |
| `icon_light` | Light-background platforms | Style B, light bg |
| `banner_fb` | Facebook cover (820×312) | Chosen style |
| `banner_li` | LinkedIn cover (1584×396) | Chosen style |
| `banner_ig` | Instagram highlight cover (1080×1080) | Style B |
| `email` | Email signature footer (400×120) | Chosen style |
| `favicon` | Browser tab icon (64×64) | Style B |

### If client doesn't respond in 24 hours

Auto-select Style A. Proceed with Canva assets using Style A. Note in handover that client can revisit the wizard (slug persists in KV for 90 days).

---

## Step 1: Check existing brand kits

Call `list-brand-kits` to see if the connected Canva account already has a brand kit for this client.

- If a matching kit exists: note it, update rather than create from scratch
- If none exists: proceed to Step 2

---

## Step 2: Generate the colour palette card

Call `generate-design` with:

```
Design type: Presentation (1920×1080) or Custom (2400×600)
Title: "{business_name} — Brand Colours"

Content to generate:
  - 4 colour swatches side by side
  - Under each: colour name + hex code
  - Business name as title
  - Tagline if provided

Colours:
  Swatch 1: Primary — {brand_color_primary} — label "Primary"
  Swatch 2: Secondary — {brand_color_secondary} — label "Secondary"
  Swatch 3: Accent — {brand_color_accent} — label "Accent"
  Swatch 4: White — #FFFFFF — label "Background"

Fonts shown in the design: {heading_font} for the business name, {body_font} for the hex codes
```

Save the returned design ID and share link.

---

## Step 3: Generate the logo concept

Canva generates text-based wordmark treatments — not symbol logos. Set expectations clearly in the handover: this is a professional typographic logo concept; for a bespoke symbol logo, the client would need a human designer.

Call `generate-design` with:

```
Design type: Logo (500×500 square)
Title: "{business_name} Logo"

Prompt: "Clean, professional {font_style} wordmark for '{business_name}', a {industry} business.
Primary colour: {brand_color_primary}. Accent: {brand_color_accent}. White background.
No icons or symbols — typography only. Business name prominently centred.
{tagline if provided: tagline in smaller text below the name}"
```

Generate 2–3 variations if the Canva MCP supports it. Present all to the user and ask which to include in the final kit.

After selection, export the chosen design as PNG (transparent background) and SVG via `export-design`.

---

## Step 4: Generate the social post template

This is the primary reusable template the client will fill in each time they post.

Call `generate-design` with:

```
Design type: Instagram Post (1080×1080)
Title: "{business_name} — Social Post Template"

Prompt: "Branded social post template for '{business_name}'. Background: {brand_color_primary}.
A clear, bold headline text area at the top in white. A subtext area in {brand_color_accent}.
Business name/logo area at the bottom with white text. Space for an image or photo in the background.
Clean, minimal, mobile-first. Font: {heading_font} for headline, {body_font} for subtext.
Professional {industry} business aesthetic. {font_style} design style."
```

Mark the text areas as editable placeholders:
- Headline: "YOUR HEADLINE HERE"
- Subtext: "Supporting detail or offer"
- Footer: "{business_name}"

Save the design ID. This design becomes the master template the client duplicates for every post.

---

## Step 5: Generate the cover image

Call `generate-design` with:

```
Design type: Facebook Cover (1200×630) or LinkedIn Banner
Title: "{business_name} — Cover Image"

Prompt: "Professional Facebook/LinkedIn cover image for '{business_name}', a {industry} business.
Background: gradient from {brand_color_primary} to {brand_color_secondary}.
Business name in large {heading_font} white text, centred. Tagline below if available.
Clean minimal layout — no stock photos, no illustrations. Just typography and colour."
```

---

## Step 6: Share designs with the client

For each design created, call `export-design` to get a view/edit link.

Then attempt to share each design to `client_email` using the Canva MCP's share capability.

If sharing via MCP is not supported: document each design's edit URL in the handover notes and instruct Aaron to manually share from Canva.

---

## Step 7: Create a Canva Brand Kit (if supported)

If the connected Canva account is on a plan that supports Brand Kits (Canva for Teams):

Call `list-brand-kits` to check, then create a brand kit with:
- Name: `{business_name} Brand Kit`
- Primary colour: `{brand_color_primary}`
- Secondary colour: `{brand_color_secondary}`
- Accent colour: `{brand_color_accent}`
- Fonts: `{heading_font}` (heading), `{body_font}` (body)
- Logo: upload the exported PNG from Step 3

If Brand Kits are not available (free plan): skip this step. Document in the handover that the client can upgrade to Canva Teams to enable Brand Kit functionality.

---

## Output

Return a structured summary:

```
==================================================
BRAND KIT COMPLETE: {business_name}
==================================================

COLOURS
  Primary:    {brand_color_primary}
  Secondary:  {brand_color_secondary}
  Accent:     {brand_color_accent}
  Background: #FFFFFF

FONTS
  Heading: {heading_font}
  Body:    {body_font}

CANVA DESIGNS
  Colour palette card:  {edit_url_1}
  Logo concept:         {edit_url_2}
  Social post template: {edit_url_3}
  Cover image:          {edit_url_4}

EXPORTS
  Logo PNG (transparent): {download_url or "download from Canva"}
  Logo SVG:               {download_url or "download from Canva"}

SHARED WITH
  {client_email} — or share the links above manually if auto-share failed

WHAT THE CLIENT CAN DO NOW
  1. Open each Canva link and save a copy to their own Canva account
  2. Use the social post template — duplicate it for every new post
  3. Upload the logo PNG to their website, Google Business Profile, and social bios
  4. Download the cover image and upload to Facebook/LinkedIn

NEXT STEP
  Package 2: brand kit is complete — deploy the website with these brand colours
  Package 3+: quote wizard will use {brand_color_primary} + {brand_color_accent} already set
==================================================
```

---

## Failure handling

| Failure | Action |
|---|---|
| Canva MCP auth error | Stop. Ask Aaron to reconnect the Canva MCP |
| `generate-design` returns error | Try `generate-design-structured` as fallback with explicit layout params |
| Design generation produces off-brand result | Note it and generate 1–2 alternatives. Let Aaron choose |
| Share to client email fails | Document edit URLs in handover — Aaron shares manually |
| Brand Kit creation blocked (free plan) | Skip Step 7, document upgrade path in handover |
