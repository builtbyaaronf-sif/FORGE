# FORGE Analytics Engine — GEO STRATEGY
**Conversational Optimization Matrix | Retainer Tier Partition**
**Last updated: 19 June 2026**

---

## PURPOSE

This document defines how FORGE partitions geographic targeting depth, content optimization scope, and monthly reporting intensity across the three retainer tiers. Every monthly SCOUT/SPARK cycle reads this matrix to determine what gets generated, at what granularity, and for which geo zones.

---

## TIER MATRIX

### T1 — Local SEO Maintenance Engine (£99/mo)

**Geo scope:** Single quadrant (the client's primary operating area)
**Borough depth:** 2 primary boroughs only
**Keyword refresh:** Top 5 search terms, refreshed monthly
**Content output:** 2 SEO blog post outlines + 2 Google Business Profile updates

**Conversational Optimization Target:**
Maintain existing ranking position. Defend primary borough keywords against local competitors. Zero growth campaigns — pure signal maintenance.

**SCOUT directive:**
```
SCOUT_SCOPE: single_quadrant
BOROUGH_LIMIT: 2
KEYWORD_POOL: 5
CAMPAIGN_MODE: maintenance
COMPETITOR_SCAN: top_3_local
```

**Reporting cadence:** Monthly. Single-page digest. Metrics: GBP views, search impressions, keyword position delta.

**Geo zones allocated:**

| Zone | Boroughs | Landmark anchors |
|------|----------|-----------------|
| North | Islington, Camden | Upper Street, Camden Market |
| South | Lambeth, Southwark | Clapham Common, Brixton Market |
| East | Tower Hamlets, Newham | Canary Wharf, Victoria Park |
| West | Hammersmith, Fulham | King's Road, Fulham Broadway |

---

### T2 — Hyper-Local Dominator (£249/mo)

**Geo scope:** Full quadrant + adjacent borough bleed
**Borough depth:** 4–5 boroughs, including secondary adjacency
**Keyword refresh:** Top 15 search terms + 3 long-tail clusters
**Content output:** Everything in T1 + 8 Canva design card variations + 4 SPARK short-form reel prompts

**Conversational Optimization Target:**
Active growth within the assigned quadrant. Capture competitor keyword gaps. Build content velocity. Instagram + LinkedIn brand signal dominance.

**SCOUT directive:**
```
SCOUT_SCOPE: full_quadrant_plus_adjacency
BOROUGH_LIMIT: 5
KEYWORD_POOL: 15
LONG_TAIL_CLUSTERS: 3
CAMPAIGN_MODE: growth
COMPETITOR_SCAN: top_5_local
CONTENT_VELOCITY: high
```

**Reporting cadence:** Monthly. Two-page digest. Metrics: all T1 metrics + Instagram reach, reel views, GBP website clicks, enquiry conversion rate.

**Geo zones allocated (full quadrant + bleed):**

| Zone | Primary boroughs | Bleed boroughs |
|------|-----------------|----------------|
| North | Islington, Camden, Hackney | Barnet, Haringey |
| South | Lambeth, Southwark, Clapham | Wandsworth, Lewisham |
| East | Tower Hamlets, Newham | Waltham Forest, Redbridge |
| West | Hammersmith, Fulham, Kensington | Chelsea, Ealing |

**Canva card matrix (8 designs per cycle):**
- 4× Educational (trade tip, myth-busting, FAQ, compliance fact)
- 2× Trust (review screenshot, before/after)
- 2× Local (landmark photo hook, borough name drop)

**Reel prompt matrix (4 per cycle):**
- 1× Explainer (trade process, under 30 seconds)
- 1× Before/after reveal
- 1× Local knowledge (ULEZ, planning, borough-specific)
- 1× CTA-forward (direct enquiry driver)

---

### T3 — Total Agentic Dominance (£499/mo)

**Geo scope:** All four London quadrants simultaneously
**Borough depth:** Full Greater London coverage (all 32 boroughs + City of London)
**Keyword refresh:** Full keyword universe — 40+ terms, refreshed monthly with search volume validation
**Content output:** Everything in T2 × 4 quadrants + active conversion feedback loop

**Conversational Optimization Target:**
Multi-quadrant domination. SCOUT analyses which geo zones drove enquiries last month and dynamically reallocates content weight to highest-converting areas. SPARK generates quadrant-specific content variants. The system learns and compounds.

**SCOUT directive:**
```
SCOUT_SCOPE: all_quadrants
BOROUGH_LIMIT: unlimited
KEYWORD_POOL: 40+
LONG_TAIL_CLUSTERS: 12
CAMPAIGN_MODE: domination
COMPETITOR_SCAN: full_market
CONTENT_VELOCITY: maximum
FEEDBACK_LOOP: active
QUADRANT_WEIGHTING: dynamic
```

**Reporting cadence:** Monthly. Full four-page report. Metrics: all T2 metrics × quadrant + attribution modelling (best-performing geo zone, content type, keyword cluster). Includes next-month optimization directives auto-written by SCOUT.

**Feedback loop schema:**

```json
{
  "cycle": "2026-07",
  "quadrant_performance": {
    "north": { "enquiries": 12, "gBP_clicks": 340, "top_keyword": "boiler repair Islington" },
    "south": { "enquiries": 8,  "gBP_clicks": 210, "top_keyword": "emergency plumber Clapham" },
    "east":  { "enquiries": 19, "gBP_clicks": 490, "top_keyword": "plumber Canary Wharf" },
    "west":  { "enquiries": 5,  "gBP_clicks": 180, "top_keyword": "heating engineer Chelsea" }
  },
  "scout_directives_for_next_cycle": {
    "increase_weight": ["east"],
    "hold_weight": ["north", "south"],
    "reduce_weight": ["west"],
    "new_keyword_targets": ["emergency plumber Stratford", "boiler service Hackney"],
    "drop_underperforming_keywords": ["heating engineer Ealing"]
  }
}
```

**Canva card matrix (32 designs per cycle):**
8 designs per quadrant, following the T2 mix, with quadrant-specific landmark and borough references baked into every design brief.

**Reel prompt matrix (16 per cycle):**
4 reels per quadrant. Each reel brief specifies the exact borough/landmark to reference in the hook text overlay.

---

## ALLOCATION LOGIC FOR MONTHLY-SPARK CRON

When `/api/cron/monthly-spark.js` fires, it reads the subscriber's `tier` from KV and selects the SCOUT directive block accordingly:

```javascript
const GEO_SCOPE = {
  t1: { quadrants: 1, boroughs: 2,  keywords: 5,  mode: 'maintenance' },
  t2: { quadrants: 1, boroughs: 5,  keywords: 15, mode: 'growth'      },
  t3: { quadrants: 4, boroughs: 33, keywords: 40, mode: 'domination'  }
}
```

The SCOUT prompt receives this config as structured context before generating the next-month optimization directives.

---

## UPGRADE TRIGGER CONDITIONS

SPARK should flag an upgrade recommendation in the monthly report when:

| Condition | Recommend upgrade to |
|-----------|---------------------|
| T1 client: GBP views >500/mo for 2 consecutive months | T2 |
| T1 client: any keyword ranking in top 5 | T2 |
| T2 client: enquiries from 3+ boroughs in one month | T3 |
| T2 client: competitor displacement in primary borough | T3 |
| T3 client: multi-quadrant enquiry volume | Bespoke enterprise pricing |

Upgrade flags are written to the monthly report's `recommendations` block and surfaced as a highlighted callout in the HTML report template.

---

## LONDON CONTEXT CONSTANTS

These regional variables are injected into every SCOUT/SPARK prompt at all tiers:

```
ULEZ_ZONES: Central London, North and East London extension zones
CONGESTION_CHARGE: weekdays 7am–6pm, central zone
WATER_HARDNESS: Thames Water hardness 300mg/L+ (south/east particularly high)
PLANNING_CONSIDERATIONS: conservation areas in west/central, Article 4 directions
MATERIALS_NOTE: Victorian/Georgian stock prevalent north; new build concentration east
```

---

*FORGE Analytics Engine | GEO_STRATEGY.md | Part of skills/analytics-engine*
