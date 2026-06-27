# FORGE Logo & Brand Asset Design System
## `logo_brand_system.md` — v1.0

> **How to use this file in Claude Design:**
> This file lives in the FORGE GitHub repo and is linked via "Link code from GitHub" in every Claude Design session. It is the permanent design system context — never paste it manually. Add the **CLIENT SESSION BRIEF** (Section 6) at the end of each session prompt to inject client-specific variables.

---

## 1. Foundational Philosophy & Taste Standard

Every asset generated under this system must function flawlessly in pure monochrome before any colour or gradient is applied. If it doesn't work in black and white, it doesn't work at all.

The visual tone is **aggressive, precise, and premium** — drawing from modern streetwear identity, minimalist Swiss architecture, and dark-optimised digital art direction. The output must be indistinguishable from the work of a senior brand designer at a top-tier studio.

### Core Design Pillars

**Geometric Reductionism** — Complex concepts must be distilled to their absolute minimal geometric primitives: lines, angles, polygons. One more element than necessary is one too many.

**Asymmetric Tension** — Avoid centered, perfectly mirrored, or balanced compositions. Visual weight must lean, slice, or offset to create motion and energy. Static symmetry signals generic AI output.

**Illuminated Depth** — Colour is treated as light emitting from an absolute dark void. Gradients are high-saturation, multi-stop, directional. Never ambient. Never pastel. Never low-contrast.

**Structural Monochrome First** — Build every mark in `#FFFFFF` on `#000000`. Colour and gradient are applied last, as a layer on top of a resolved geometric structure.

---

## 2. Design Tokens

### A. Colour System

These are the only permitted colour values. Do not invent secondary colours outside these ranges.

```json
{
  "surface": {
    "void_black": "#000000",
    "deep_charcoal": "#0D0D0D"
  },
  "ink": {
    "stark_white": "#FFFFFF",
    "muted_gray": "#8E8E93"
  },
  "gradient_profiles": {
    "profile_01_cyber_punk":    "linear-gradient(135deg, #FF007A 0%, #7B00FF 50%, #00F0FF 100%)",
    "profile_02_electric_aurora": "linear-gradient(135deg, #00FF87 0%, #60EFFF 100%)",
    "profile_03_solar_flare":   "linear-gradient(135deg, #FF416C 0%, #FF4B2B 50%, #FFCC00 100%)",
    "profile_04_deep_chroma":   "linear-gradient(135deg, #050505 0%, #1A1A3A 50%, #0052D4 100%)"
  }
}
```

**Colour Implementation Rule:** Brand marks must be built as flat vectors using `stark_white` on `void_black`. Gradient profiles are applied as: (a) background environments, or (b) masked fills clipped inside geometric shapes. Never as loose ambient glows or drop shadows.

**Per-client colour override:** When a client has an established brand colour (e.g. trades orange `#FF6B35`), it replaces the gradient profile as the single accent. The structure remains monochrome; the accent is the only colour permitted.

### B. Geometry & Shape Rules

| Property | Rule |
|---|---|
| Primary angles | 45°, 60°, 90° — intentional, never arbitrary |
| Icon mark border radius | `0px` — strictly sharp corners |
| Badge/container border radius | `2px` to `4px` maximum |
| Pill shapes | **Forbidden** — no `border-radius: 9999px` anywhere |
| Negative space minimum | 30% of the mark's bounding box must be active negative space (cuts, intersections, stencil effects, broken lines) |
| Symmetry | **Forbidden** — never place a perfectly symmetrical icon centered over centered text |

### C. Typography System

| Style | Application | Rules |
|---|---|---|
| **Bold Condensed** | Power words, trade names | Geometric all-caps sans-serif, `letter-spacing: -0.05em`, `line-height: 0.9` |
| **Dynamic Script** | Secondary personality layer | High-contrast expressive script, always offset or paired with a rigid geometric baseline |
| **Enclosed Frame** | Badge/emblem compositions | Text inside fine-line borders (`1px solid #FFFFFF`), varying scale between primary and secondary elements |

**Typography constraint:** Do not use default Inter, Roboto, or system UI fonts. If a custom typeface cannot load, manipulate standard font paths via SVG: slice crossbars, tighten tracking manually, modify letterforms. The output must not look like a default Google Font rendering.

---

## 3. Logo Architecture Matrix

Select one framework per client based on industry, brand personality, and intended use (van livery, app icon, social profile, etc.).

| Type | Structural Rule | Best For | Reference Marks |
|---|---|---|---|
| **Abstract Geometric** | Hard angle slices, overlapping polygons, negative space cuts, extreme asymmetric balance | Tech, digital, modern agencies | NKL, EQUIP, Vision Protocol, Young Master |
| **Enclosed Emblem** | High-contrast text locked inside a strict square or rectangular bounding box with fine-line border | Trades, heritage, authority-first businesses | MOTHER/PRAY, NOBLE AURA |
| **Asymmetric Typographic** | Contrasting weight mix — heavy condensed sans paired with expressive script or fine secondary line | Creative, lifestyle, personality-led brands | RISE Above, HOPE Full, Daring Dreams |
| **Monolithic Wordmark** | Pure typography, stylised through custom tracking, modified crossbars, or deliberate letterform cuts | Established names, minimalist brands | AMBITION, TIMELESS, RCA |
| **Combination Mark** | Geometric symbol + wordmark, symbol offset (never centered above text) | Most versatile — works across all client types | Burberry, Fendi, Motus, Grifow |

### Industry Direction Guide

| Industry | Recommended Type | Mark Approach | Avoid |
|---|---|---|---|
| Trades (plumber, electrician, builder) | Enclosed Emblem or Combination | Tool abstracted to geometry — a pipe as two parallel lines, a bolt as a hexagon with a cut | Literal clip-art wrench, drop shadows |
| Beauty / Wellness | Asymmetric Typographic | Script primary, fine sans secondary, single accent colour | Flowers, leaves, generic circles |
| Professional Services / Legal | Monolithic Wordmark or Combination | Clean condensed type, sharp geometric mark from initials | Globes, scales, handshakes |
| Food / Hospitality | Enclosed Emblem or Combination | Bold, high-contrast badge composition | Overworked illustrations, gradient misuse |
| Tech / Digital / Agency | Abstract Geometric | Maximum negative space, angular cuts, no pictorial reference | Safe blue, globe icons, shield shapes |
| Fitness / Sport | Abstract Geometric or Monolithic | Dynamic angle (45°–60°), implied motion through asymmetry | Lightning bolts, flames |

---

## 4. Gradient Application Rules

- Gradients are directional: always `135deg` or `45deg` linear. Never radial centered behind a mark.
- Transitions must be violent — high contrast between stops, not smooth or pastel.
- Gradient is the last thing applied. Resolve the geometric mark first.
- On client sites: gradient profiles are used for hero section backgrounds, section dividers, and CTA hover states only. The logo mark itself remains flat (single colour) for reproduction versatility.

---

## 5. Strict Negative Constraints (Anti-Generic Guard)

These are absolute prohibitions. They exist because these are the default outputs of untrained AI generation and must be actively suppressed.

| Prohibited | Why |
|---|---|
| ❌ Safe SaaS blue (`#0066FF`, `#2563EB`, corporate tech blue) | Signals generic AI/template output immediately |
| ❌ Smooth, perfectly centred circles | The single most overused AI logo element |
| ❌ Generic swooshes, globes, interconnecting rings | Zero distinctiveness, zero memorability |
| ❌ Inter / Roboto / system sans as the primary logotype | Default font = default brand |
| ❌ Pill-shaped containers (`border-radius: 9999px`) | Soft and forgettable — contradicts the structural premise |
| ❌ Perfect bilateral symmetry | Symmetry is safe; safe is invisible |
| ❌ Drop shadows or outer glows on the primary mark | Structural marks don't need depth tricks |
| ❌ More than 2 typefaces in one composition | Visual noise, not sophistication |
| ❌ Gradient as the primary design decision | Gradient must support structure, not replace it |
| ❌ Literal pictorial representations (actual wrench, actual leaf) | Pictorial = generic. Geometric abstraction = premium |

---

## 6. CLIENT SESSION BRIEF (fill in per session)

> **Instructions:** Copy from here to the end of this file into the Claude Design "Any other notes" field for each new client. Fill in the bracketed variables from SCOUT's brief output.

---

```
FORGE CLIENT LOGO BRIEF
========================
Brand name:        [BUSINESS NAME]
Owner:             [OWNER NAME]
Industry:          [TRADE / SECTOR]
Location:          [CITY / REGION — relevant for brand personality]
Brand personality: [3 ADJECTIVES — e.g. "independent, precise, local"]

LOGO ARCHITECTURE
Logo type:         [Abstract Geometric / Enclosed Emblem / Asymmetric Typographic / 
                    Monolithic Wordmark / Combination Mark]
Primary colour:    [HEX — from SCOUT brief, or void_black #000000]
Accent colour:     [HEX — from SCOUT brief]
Gradient profile:  [profile_01 / profile_02 / profile_03 / profile_04 / none]
Secondary text:    [TAGLINE OR DESCRIPTOR — e.g. "South London" or "Est. 2014"]

DELIVERABLES
Generate 3 distinct logo directions for [BUSINESS NAME] strictly following 
the logo_brand_system.md specification loaded from the FORGE GitHub repo.

Direction 1: [Logo type A — e.g. Enclosed Emblem with geometric mark]
Direction 2: [Logo type B — e.g. Combination Mark, asymmetric offset]
Direction 3: [Logo type C — e.g. Monolithic Wordmark with letterform modification]

OUTPUT FORMAT
- Display as interactive visual dashboard, dark background (#000000)
- Each direction: mark only / wordmark only / combination lockup
- All three directions first in monochrome (white on black)
- Then apply accent colour / gradient profile as a second render
- Export-ready: SVG vector structure, no raster effects on the mark itself

NEGATIVE CONSTRAINTS ACTIVE (confirm acknowledgement before generating):
- No safe blues, no smooth circles, no Inter/system fonts
- No symmetrical layouts, no pill shapes, no drop shadows
- No literal pictorial icons — geometric abstraction only
```

---

## 7. MARK Skill Integration (deploy-team reference)

When the FORGE MARK agent runs during a Package 2+ deployment, it:

1. Reads SCOUT's output brief (business name, industry, colours, brand words)
2. Fills in Section 6 above automatically
3. Opens Claude Design (or presents Aaron with the ready-to-paste prompt)
4. Waits for logo direction approval
5. Exports approved mark as `{slug}-logo.svg` and `{slug}-logo.png`
6. Saves to `sales/{client-slug}/brand-assets/`
7. Passes the SVG path to ATLAS (nav brand icon) and PIXEL (Canva template base)

PIXEL's role after MARK: asset composition only — social templates, cover images — using the approved logo rather than generating a new one in Canva.

---

*FORGE Design System — maintained by Aaron | builtbyaaronf@gmail.com*
*Version 1.0 — June 2026*
