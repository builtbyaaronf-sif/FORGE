# FORGE Skill Self-Evaluation
# Full Deploy on FORGE itself — 16 June 2026
# Evaluator: FORGE Command Centre

---

## OVERVIEW

This document evaluates the performance of every skill and agent activated during the Full Deploy on FORGE Marketing Agency. The goal is honest assessment: what worked, what broke, what needs fixing, and what we build next.

---

## SKILL: deploy-team

**Grade: B+**

### What worked
- Sequence logic held across a context boundary (compaction) without human intervention — agents picked up where they left off
- Mode detection (FULL DEPLOY) was correct and all 4 agents activated
- Agent handoff signals were produced in the right format and carried the right data forward
- The briefing format and completion signals made progress legible throughout

### What failed / degraded
- The context boundary caused ATLAS to restart mid-phase (HubSpot CRM) — the session summary preserved intent but not tool state
- No automatic progress checkpoint system — if context compacts mid-agent, the next session has to reconstruct which phase was reached

### Improvement actions
1. Add a `FORGE_STATE.md` file to the workspace after each agent completes — a lightweight checkpoint that survives context compaction
2. Add explicit phase tracking to the deploy-team skill: "ATLAS Phase 3: DONE / Phase 4: IN PROGRESS" written to disk, not just signalled in context

---

## SKILL: website-content-extractor (SCOUT)

**Grade: A-**

### What worked
- Correctly identified that FORGE occupies a category with zero direct competitors ("agentic agency")
- Produced a clear, defensible positioning statement
- Primary messaging angle (Speed + AI) was the right call and informed every downstream output
- Design system recommendation (Creative Dark) was appropriate for the category

### What failed / degraded
- Playwright Phase 2 (visual intelligence / screenshots) was not available in this environment — Visual Gap analysis was derived from desk research only, not actual competitor site screenshots
- Without visual evidence, the "visual gap" claim is based on inference, not observation

### Improvement actions
1. When Playwright is unavailable, explicitly note this in the SCOUT completion signal and flag it as a data quality reduction
2. Add a fallback: use `web_fetch` to capture competitor homepage text as a proxy for visual gap analysis
3. Add a "data confidence" score to the brief (e.g. HIGH / MEDIUM / LOW) that downstream agents can use to calibrate their output

---

## SKILL: digital-presence-builder (ATLAS)

**Grade: B**

### What worked
- Website built correctly to the Creative Dark design system spec — letter-spacing, glass nav, reveal animations, legal compliance all present
- Strategy pack generated with all 9 sections, real competitor data, honest SWOT, actionable roadmap
- HubSpot CRM records created (Company ✓, Deal ✓, Contact already existed ✓)
- Legal compliance rule enforced: cookie banner, Privacy Policy, Terms links all included

### What failed / degraded
- **Canva MCP not executed this session** — brand kit (3 assets) was not created. The skill describes Canva as a PHASE 3 deliverable but no Canva API calls were made. This is the most significant gap.
- HubSpot `notes_last_updated` field caused a create failure on first attempt (read-only field). Required a retry without that field — wasted a call.
- `notes` field was included in the initial company create payload despite not being a standard HubSpot property — another failed call
- Vercel deployment blocked in sandbox (npm 403 / CLI unavailable) — Aaron must deploy locally. This is a known constraint but worth flagging clearly in the delivery summary every time.

### Improvement actions
1. **Canva phase**: Add a checkpoint — if Canva MCP calls are not made by the end of ATLAS, flag in the completion signal as "Brand kit: PENDING"
2. **HubSpot**: Remove `notes`, `notes_last_updated`, and other read-only/custom fields from the default company create payload. Stick to safe standard properties only.
3. **Vercel**: Add a clear note at the top of every delivery: "Aaron: run `vercel --prod` from the FORGE folder to go live" — make it impossible to miss

---

## SKILL: social-media-machine (SPARK)

**Grade: A**

### What worked
- 20 posts generated across 4 weeks
- Good platform mix: Instagram, LinkedIn, Google Business (the right 3 for a B2B agency targeting tradesmen)
- Content type variety: Reels, Carousels, Text posts, Case studies, Milestone posts — not all the same format
- Hooks are specific and non-generic ("There are 4 people on the FORGE team. None of them are human." is excellent)
- CSV export format is clean and import-ready
- Content directly reflects the positioning angle from SCOUT — not templated
- Week 4 Post 20 (30-day results milestone) shows forward-planning intelligence

### What failed / degraded
- Full captions were not written for every post — the CSV contains hooks and topics but not full body copy + hashtags for each entry
- Reel scripts (production briefs for video content) were not included — the skill specifies these should be delivered

### Improvement actions
1. Enforce a "full caption" rule in the CSV output: every row must have Hook + Body (50–150 words) + CTA + Hashtags (10–15) — not just the hook
2. Add a REELS tab or section to the markdown output with 3–4 full production briefs (30-second script, no-equipment version)
3. Consider producing the CSV + a companion markdown with all full captions, then presenting both

---

## SKILL: marketing:email-sequence (CHASE)

**Grade: A-**

### What worked
- 6-email sequence written in full with A/B subject line variants per email
- Voice is consistent with the brand: direct, fast, proof-led — not corporate
- 30-day multi-channel cadence covers email + phone + DM/WhatsApp + LinkedIn
- Phone scripts included for both call attempts — short, warm, non-scripted-sounding
- Lead scoring framework is industry-specific (trades business owners have different hot signals than SaaS buyers)
- 5 objection scripts — the top one ("I get all my work from word of mouth") is the correct lead objection for this audience
- 30/60/90-day targets are realistic and specific

### What failed / degraded
- HubSpot pipeline setup (7 stages + custom properties) was documented but not executed via the `manage_crm_objects` tool — it exists as instructions in the markdown, not as live HubSpot configuration
- The 6-email sequence exists in a .md file but was not created as a HubSpot email sequence or Klaviyo flow — it's a manual asset, not automated

### Improvement actions
1. After generating the email sequence copy, make the HubSpot pipeline API calls immediately — don't leave them as documented intent
2. Add a step to create the 6 emails as HubSpot email templates using the `manage_crm_objects` tool (or Klaviyo MCP if connected)
3. Flag clearly in the CHASE completion signal: "Pipeline: LIVE in HubSpot ✓ / DOCUMENTED ONLY ✗"

---

## OVERALL FULL DEPLOY ASSESSMENT

| Agent | Core Deliverable | Grade | Critical Gap |
|-------|-----------------|-------|-------------|
| SCOUT | Competitive intelligence | A- | No Playwright visual evidence |
| ATLAS | Website + CRM + Strategy Pack | B | Canva not executed; HubSpot pipeline not live |
| SPARK | 20-post social calendar | A | No full captions or reel scripts |
| CHASE | 6-email sequence + cadence | A- | Pipeline documented, not live in HubSpot |

**Overall FORGE Full Deploy Grade: B+**

The core output is genuinely impressive: a premium website, full competitive analysis, 20 posts, 6 emails, lead scoring, objection scripts, and a strategy pack — in a single session. The gaps are execution gaps (Canva skipped, HubSpot pipeline not live) rather than strategy gaps. The positioning, design, and copy quality are high.

---

## TOP 5 IMPROVEMENTS TO BUILD NEXT

### 1. FORGE_STATE.md checkpoint system
After each agent phase completes, write a lightweight state file to disk. If the context compacts, the next session reads FORGE_STATE.md and resumes from the correct phase without backtracking.

### 2. Canva execution — actually generate the assets
The Canva MCP is connected. The 3 brand assets (palette card, Instagram template, Facebook cover) need to be created and their URLs included in the strategy pack. This is one of the most visible deliverables for clients — it cannot be skipped.

### 3. Full captions in SPARK output
Every social post should have a complete caption (Hook + Body + CTA + Hashtags), not just a hook line. The CSV should be client-deliverable without additional work — currently it's more of a content plan than a ready-to-post document.

### 4. HubSpot pipeline creation in CHASE
The 7-stage pipeline should be created via API during the CHASE run, not just documented. If the API call fails, log it and proceed — but attempt it.

### 5. Auto-deploy capability
When Vercel CLI is available, deploy should happen automatically. Add a check at the start of every deploy: "Is Vercel CLI available? Y → deploy / N → save file and prompt Aaron." Right now this check doesn't exist and deployment silently fails.

---

## WHAT WORKED EXCEPTIONALLY WELL

- **The positioning work.** "World's first agentic marketing department for London tradesmen" is a defensible, category-creating position. No competitor owns this language.
- **The website quality.** The Creative Dark design, glass nav, reveal animations, and legal compliance are all present without being explicitly requested — the skill's defaults are strong.
- **The legal compliance memory rule.** Privacy Policy + T&C + cookie banner appeared automatically in the website without being requested. Memory working as intended.
- **The social hooks.** "There are 4 people on the FORGE team. None of them are human." and "We built FORGE's entire marketing presence this morning. It took 18 minutes." are the kind of hooks that get saved and shared. SPARK's voice is right.
- **Context survival.** The deploy picked up after a full context compaction and continued without Aaron having to re-explain the task. This is the most impressive operational performance of the session.

---

*Self-evaluation complete. The machine is built. The gaps are known. The next session starts with Canva assets.*
