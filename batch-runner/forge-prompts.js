// forge-prompts.js
export const SYSTEM_PROMPT = `You are FORGE — an autonomous AI marketing agent.
You build complete digital presences for small businesses with speed and precision.
You respond only with the requested output — no preamble, no explanation, no markdown fences.
All output must be valid for its declared format (JSON, HTML, etc).`

export function p0_designSystem(businessName, industry, location) {
  return `Select the correct design system for this business.

Business: ${businessName}
Industry: ${industry}
Location: ${location}

Design systems:
- Dark Bold: trades, construction, auto. Canvas #0A0A0A, accent #F59E0B amber
- Light Luxury: health, beauty, wellness, spa. Canvas #FDFCFB, accent #9B7EBD purple
- Warm Artisan: food, coffee, bakery, florist. Canvas #FEFBF6, accent #C8773A amber
- Dark Precision: tech, repair, digital, IT. Canvas #08090A, accent #5E6AD2 indigo
- Clean Pro: professional, legal, finance. Canvas #FFFFFF, accent #0071E3 blue
- Creative Dark: agency, media, photography. Canvas #090909, accent #FF3BFF pink

Respond with ONLY valid JSON, no other text:
{
  "system": "Dark Bold",
  "canvas": "#0A0A0A",
  "accent": "#F59E0B",
  "ink": "#FFFFFF",
  "surface": "#141414",
  "tagline_style": "bold, direct, local trades",
  "cta_style": "white pill buttons"
}`
}

export function p1_researchBrief(businessName, location, industry, competitorData) {
  return `You are FORGE's intelligence module. Synthesise a strategic brief for this business.

Business: ${businessName}
Location: ${location}
Industry: ${industry}

Competitor intelligence gathered:
${competitorData}

Produce a complete strategic brief. Respond with ONLY valid JSON:
{
  "business_name": "${businessName}",
  "slug": "business-location",
  "location": "${location}",
  "industry": "${industry}",
  "tagline": "One punchy line for the hero",
  "positioning_statement": "Full positioning sentence",
  "primary_messaging_angle": "The angle that wins vs competitors",
  "services": [
    { "name": "Service name", "description": "One line description" }
  ],
  "usps": ["USP 1", "USP 2", "USP 3"],
  "about": "2-3 sentence about the business, warm and credible",
  "competitors": [
    {
      "name": "Competitor name",
      "strength": "What they do well",
      "gap": "Their weakness to exploit"
    }
  ],
  "swot": {
    "strengths": ["S1", "S2", "S3"],
    "weaknesses": ["W1", "W2"],
    "opportunities": ["O1", "O2", "O3"],
    "threats": ["T1", "T2"]
  },
  "design_system": "Dark Bold",
  "accent_colour": "#F59E0B",
  "canvas_colour": "#0A0A0A",
  "phone": "020 1234 5678",
  "email": "hello@business.co.uk",
  "data_quality": "inferred"
}`
}

export function p2_websiteHtml(brief) {
  return `You are FORGE's website builder. Generate a complete, premium single-page website.

Use the BRIEF provided above.

REQUIREMENTS:
- Single HTML file, everything inline (HTML + CSS + JS)
- Design system: ${brief.design_system} (canvas: ${brief.canvas_colour}, accent: ${brief.accent_colour})
- Inter Variable font from Google Fonts
- Letter-spacing: -0.04em on all headings
- Glass nav: backdrop-filter blur(16px)
- Chromatic hover shadows using accent colour
- IntersectionObserver reveal animations
- Mobile hamburger menu
- Sections: nav, hero, trust strip, services grid, about + stats, contact + form, footer
- Contact form with fake submit handler (no backend)
- All content from brief — no placeholder text

GA4 ANALYTICS (Required):
- Add GA4 measurement snippet in <head>
- Use placeholder: GA_MEASUREMENT_ID (e.g. G-XXXXXXXXXX)
- Include comment: <!-- FORGE Analytics — replace GA_MEASUREMENT_ID before go-live -->
- Configure: anonymize_ip=true, cookieless ping mode
- Do NOT break existing HTML structure

Output ONLY the complete HTML document starting with <!DOCTYPE html>.`
}

/**
 * SPARK Social Content Prompt
 * Generates 20 social posts + reel concepts + SEO copy as structured JSON
 * Consumes the geo-enriched SPARK prompt from forge-spark-engine.js
 *
 * UTM TAGGING: Every post must include a pre-built UTM link appended to the caption CTA.
 * Format: ?utm_source={platform}&utm_medium={content_type}&utm_campaign={month_slug}&utm_content={borough_slug}
 * Example: ?utm_source=instagram&utm_medium=carousel&utm_campaign=jul26_w1&utm_content=lambeth
 */
export function p_spark_social(geoPrompt, brief) {
  return `${geoPrompt}

BUSINESS BRIEF CONTEXT:
- Tagline: "${brief.tagline}"
- Positioning: "${brief.positioning_statement}"
- Primary messaging angle: "${brief.primary_messaging_angle}"
- Services: ${brief.services?.map(s => s.name).join(', ') || 'General trades'}
- USPs: ${brief.usps?.join(' | ') || 'Quality, speed, local expertise'}
- Tone: Direct, experienced, no filler. Speak like a respected London tradesperson.

CONTENT PILLARS FOR THIS TRADE (5 pillars, % weighting):
1. Expert Tips (30%) — position as the authority before they call
2. Transformation / Before & After (25%) — show the work, it sells itself
3. Trust & Credentials (20%) — reviews, accreditations, years in business
4. Local Community (15%) — hyperlocal name recognition
5. Promotional (10%) — rare, specific, high-value offers

POST CALENDAR STRUCTURE:
- Week 1: Foundation — who they are, what they do, why different
- Week 2: Trust & proof — reviews, credentials, before/afters
- Week 3: Education & value — tips, myth-busting, insider knowledge
- Week 4: Community & CTA — local, seasonal, direct offer

CAPTION RULES (non-negotiable):
- Hook NEVER starts with the business name
- Body has at least one specific detail (number, street, real scenario)
- CTA is soft except Pillar 5 posts (promotional = direct)
- Hashtags: minimum 1 location-specific tag per post
- No clichés: no "Look no further", "We've got you covered", "Passionate about"
- Inject boroughs/landmarks naturally — never forced
- Mention ULEZ/congestion compliance where relevant to the trade

UTM LINK GENERATION (Required for every post):
- Platform: 'instagram' | 'linkedin' | 'google_business' (from post.platform field)
- Content type: 'image' | 'carousel' | 'reel' | 'video' (from post.content_type field, lowercase)
- Campaign slug: Generate as {month}{2-digit-year}_w{week_number} (e.g., 'jul26_w1', 'jun26_w2')
- Content (borough): Extract first borough from geo prompt, slugify to lowercase (e.g., 'lambeth', 'croydon')
- Full URL: Append ?utm_source={platform}&utm_medium={content_type}&utm_campaign={campaign_slug}&utm_content={borough_slug} to the website URL in the CTA

Respond with ONLY valid JSON in this exact structure (no markdown, no preamble):
{
  "posts": [
    {
      "week": 1,
      "day": "Monday",
      "platform": "Instagram",
      "content_pillar": "Expert Tips",
      "content_type": "Image",
      "topic": "Brief topic title",
      "hook": "First line of caption — pattern interrupt, no business name",
      "caption": "Full caption including hook + body + CTA with utm_link appended",
      "utm_link": "?utm_source=instagram&utm_medium=image&utm_campaign=jul26_w1&utm_content=lambeth",
      "hashtags": ["#tag1", "#tag2"],
      "visual_direction": "Describe the image or graphic to create",
      "canva_note": "Which template slot or brand element to adapt"
    }
  ],
  "reel_concepts": [
    {
      "post_ref": "Week N, Day X",
      "title": "Reel concept title",
      "duration_seconds": 45,
      "hook_spoken": "Spoken hook line",
      "hook_text_overlay": "On-screen text at 0s",
      "structure": ["0-3s: hook", "3-25s: content", "25-35s: CTA"],
      "production_notes": "Phone camera guidance"
    }
  ],
  "seo_landing_copy": {
    "meta_description": "155-char Google snippet for their website",
    "hero_intro": "2-3 sentence hyperlocal intro block for site homepage"
  },
  "google_business_update": "Short Google Business post (max 1500 chars) for local SEO",
  "carousel_slide_text": {
    "slide_1_headline": "Hook headline for carousel cover",
    "slide_2": "Point 1 text",
    "slide_3": "Point 2 text",
    "slide_4": "Point 3 text",
    "slide_5_cta": "CTA slide text"
  }
}`
}

export function p5_strategyPack(brief) {
  return `You are FORGE's strategy writer. Generate a complete client strategy pack as a single HTML file.

Use the BRIEF provided above.

REQUIREMENTS:
- Dark bold theme matching the website (canvas: ${brief.canvas_colour}, accent: ${brief.accent_colour})
- Inter font
- Sections: cover, what we built, competitive landscape table, positioning statement + 3 angles, SWOT grid, 4 goals with timelines, 90-day roadmap (3 phases), top 5 recommendations, success metrics
- Every section must reference real data from the brief — no generic filler
- Fully self-contained HTML + CSS

Output ONLY the complete HTML document starting with <!DOCTYPE html>.`
}