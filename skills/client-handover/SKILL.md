---
name: client-handover
description: >
  Generate a professional client handover document after every FORGE deployment. Creates a
  clean, branded HTML or PDF document summarising everything that was built, all live URLs,
  environment variables to set, login instructions, how to use each deliverable, and recommended
  next steps. Trigger on: "generate handover", "client handover", "create handover doc",
  "what do I send the client", "wrap up the deployment", "deployment complete", or automatically
  at the end of any deploy-team run (all package tiers). This is the last step of every FORGE
  deployment. The client receives this document before Aaron's verbal briefing.
---

# Client Handover Skill

## What This Builds

A professional, FORGE-branded handover document delivered as a single HTML file that:

- Looks great on any device (the client will read it on their phone)
- Covers everything they need to know without jargon
- Includes all live URLs and technical details (for their records)
- Gives clear, numbered next steps so they know exactly what to do first
- Positions FORGE as the professional agency that thinks of everything

This is not a technical report. It is a document a non-technical business owner can read and act on independently.

---

## Inputs

Gather these from the deploy-team run or previous skill outputs. Only `business_name` and `package_tier` are strictly required — everything else is included if available.

| Field | Source | Required? |
|---|---|---|
| `business_name` | Quote wizard / brief | Yes |
| `package_tier` | User prompt | Yes |
| `owner_name` | Brief | Recommended |
| `website_url` | one-click-website output | Yes (P1+) |
| `vercel_project_name` | Vercel deployment | Yes (P1+) |
| `resend_api_key_set` | Boolean — was it set? | P3+ |
| `quote_to_email` | Client's email for quote leads | P3+ |
| `hubspot_portal_id` | hubspot-setup output | P3+ |
| `hubspot_pipeline_name` | hubspot-setup output | P3+ |
| `calendly_scheduling_url` | calendly-setup output | P4+ |
| `calendly_event_types[]` | calendly-setup output | P4+ |
| `canva_design_urls{}` | brand-kit output | P2+ |
| `social_calendar_file` | social-media-machine output | P5+ |
| `social_platforms[]` | social-media-machine output | P5+ |
| `site_audit_summary` | site-audit output | All |
| `env_vars{}` | All relevant env vars | All |
| `next_recommended_package` | Upgrade path | All |

---

## Document Structure

Generate the handover as a single self-contained HTML file named `{business-name-slug}-handover.html`.

Use the FORGE design language:
- Background: `#090909` (FORGE dark canvas)
- Card backgrounds: `#111` with `#222` border
- Accent: `#0099FF`
- Text: `#FFFFFF` / `#AAAAAA` for secondary
- Font: Space Grotesk (heading), Inter (body) — load from Google Fonts
- No images required — pure typography and colour

---

## Section 1: Cover

```html
<!-- Cover section -->
<header>
  <p>FORGE — AI Marketing Agency</p>
  <h1>{business_name}</h1>
  <p>Package {package_tier} Deployment — {today's date}</p>
  <p>Prepared for {owner_name if available}</p>
</header>
```

Under the cover, include a one-sentence value statement:
> "This document covers everything that was built for {business_name} today — and exactly what to do next."

---

## Section 2: What Was Built

List every deliverable based on the package tier. Check off completed items. Flag any that were skipped or need follow-up.

**Package 1 (Launch)**
- [ ] Live website deployed at {website_url}
- [ ] Mobile-first design, SEO meta tags, Google Analytics
- [ ] Floating WhatsApp button: tap to contact instantly
- [ ] Trust badges and testimonials section
- [ ] Cookie consent banner + Privacy Policy + Terms & Conditions
- [ ] Google Business Profile setup guide (see Section 5)

**Package 2 adds:**
- [ ] Canva brand kit: colour palette card, logo concept, social post template, cover image
- [ ] AI-enhanced imagery on key sections

**Package 3 adds:**
- [ ] Multi-step quote wizard embedded on the website
- [ ] Customer autoresponder: every lead gets an immediate confirmation email
- [ ] Leads routed to your email AND stored in HubSpot CRM
- [ ] HubSpot "New Leads" pipeline with 7 stages

**Package 4 adds:**
- [ ] Calendly booking system: customers can book appointments online
- [ ] Booking widget embedded on the website
- [ ] Google Calendar sync (see handover instructions)
- [ ] Bookings tracked in HubSpot pipeline

**Package 5 adds:**
- [ ] Social media strategy: 2 recommended platforms
- [ ] 20 posts across 4 weeks — all written, all ready to schedule
- [ ] CSV file for scheduling tools (Buffer, Later, Hootsuite)
- [ ] Canva social templates for ongoing content creation

---

## Section 3: Your Live Website

```
Website:      {website_url}
Deployed on:  Vercel (forgeisagentic.tech manages this)
Last updated: {today's date}

Your site is live right now. Test it on your phone.
The address above is the permanent link — share it everywhere.
```

If a custom domain was NOT set up, include:
```
DOMAIN NOTE
Your site is currently on a Vercel URL ({website_url}).
To use your own domain (e.g. davesplumbing.co.uk):
  1. Purchase a domain from Namecheap or GoDaddy (£10–15/year)
  2. Message Aaron at FORGE — we'll connect it within 24 hours
```

---

## Section 4: Technical Details (for your records)

> "You don't need to do anything with this section — it's here for reference if you ever need to hand technical details to a developer or check a setting."

Include a collapsible `<details>` element containing:

```
Vercel Project:   {vercel_project_name}
Hosting:          Vercel (free tier — includes SSL, CDN, auto-deploy)

ENVIRONMENT VARIABLES
{list all env vars, with the variable name but NOT the actual values for sensitive ones}
  RESEND_API_KEY     — set ✓ (managed by FORGE)
  QUOTE_TO_EMAIL     — set ✓ ({quote_to_email})
  BUSINESS_NAME      — set ✓ ({business_name})
  HUBSPOT_PORTAL_ID  — set ✓ ({hubspot_portal_id}) [P3+]
  HUBSPOT_FORM_GUID  — {set ✓ / needs configuring — see Section 5} [P3+]

HUBSPOT
  Portal ID:    {hubspot_portal_id}
  Pipeline:     {hubspot_pipeline_name}
  Login:        app.hubspot.com

CALENDLY
  Account:      calendly.com (log in with {owner_email})
  Booking page: {calendly_scheduling_url}
```

---

## Section 5: How To Use Everything

Write this section in plain English. No jargon. One topic per card.

### How to manage your leads (P3+)
```
Every time someone fills in your quote form:
  1. You'll get an email with their details — including a tap-to-call link
  2. They'll receive an instant confirmation from you
  3. Their details are saved in HubSpot at app.hubspot.com

In HubSpot:
  - New leads appear under Contacts → Recent
  - Move them through your "New Leads" pipeline as you talk to them
  - Log notes after each call so you remember where things stand
  - Install the HubSpot mobile app for on-the-go lead management
```

### How to manage your bookings (P4+)
```
Customers can book directly at: {calendly_scheduling_url}
This link is embedded on your website — they can also book via the "Book Now" button.

When someone books:
  - You get an email confirmation with their details
  - It goes straight into your Google Calendar (once connected — see below)
  - The booking appears on your Calendly dashboard at calendly.com

To connect Google Calendar:
  1. Log in to calendly.com
  2. Go to Account → Integrations → Calendar Connections
  3. Connect your Google account
  4. Done — all bookings now appear in your calendar

To change your availability:
  1. Log in to calendly.com
  2. Go to Availability
  3. Adjust hours and save — changes apply immediately
```

### How to use your brand kit (P2+)
```
Your Canva designs are at the links below. You'll need a free Canva account to edit them.
  Colour palette:    {canva_design_urls.palette}
  Logo:              {canva_design_urls.logo}
  Social template:   {canva_design_urls.social_post}
  Cover image:       {canva_design_urls.cover}

For social posts: open the social template → click "Use template" or "Make a copy"
→ change the headline text → download as PNG → post.

Your logo: download as PNG and use on all your profiles — WhatsApp, Google Business, Facebook.
```

### How to post your social content (P5+)
```
Your content calendar is in the CSV file attached to this document.
20 posts are written and ready — 4 weeks of content.

To schedule everything in one go:
  1. Create a free Buffer account at buffer.com
  2. Connect your social accounts ({social_platforms})
  3. Import the CSV file (Buffer → New Post → Import)
  4. Review each post, adjust any specific details (prices, dates, local references)
  5. Schedule — Buffer will post automatically

Alternatively, copy each caption and post manually once a week.
```

### Google Business Profile setup (P1+)
```
Google Business Profile (GBP) gets your business showing up on Google Maps
when local customers search for {industry} services nearby.

To set it up:
  1. Go to business.google.com
  2. Search for "{business_name}" — claim it if it exists, create it if not
  3. Set your business category, phone number, address, and opening hours
  4. Add your website: {website_url}
  5. Upload 5–10 photos of your work, your vehicle, or your premises
  6. Ask your first 5 customers for a Google review — paste them this link:
     [Aaron: insert the client's GBP review link here after claiming]

Getting 10+ reviews in the first 30 days is the single biggest driver of local search traffic.
```

---

## Section 6: Next Steps (numbered, actionable)

```
WHAT TO DO TODAY
  1. Open your website on your phone and share the link with 3 people you know
  2. Set up Google Business Profile (Section 5 above — takes 15 minutes)
  3. Ask your first 3 customers for a Google review

THIS WEEK
  4. Connect your Google Calendar to Calendly (if Package 4+)
  5. Log in to HubSpot and set up the mobile app (if Package 3+)
  6. Share the booking link in your WhatsApp bio and email signature (if Package 4+)

IN THE NEXT 30 DAYS
  7. Start posting your social content — the first 20 posts are ready (if Package 5+)
  8. Reply to every lead within 2 hours — this is the most important habit to build
  9. Ask every happy customer for a Google review
```

---

## Section 7: FORGE Contact & Support

```
FORGE — AI Marketing Agency
forgeisagentic.tech

Built by Aaron
builtbyaaronf@gmail.com

SUPPORT
  Questions about your website or tools: email Aaron directly
  Updates or changes to the site: included in your retainer (if applicable)
  New features, additional packages, or upgrades: ask about Package {package_tier + 1}

{if next_recommended_package is set:}
NEXT STEP FOR YOUR BUSINESS
  You're now on Package {package_tier}. The next level — Package {package_tier + 1} — adds:
  {one sentence describing the key feature of the next package}
  Price: {next package price}
  Ask Aaron about upgrading →
```

---

## Output

Save the file as `{business-name-slug}-handover.html` in the FORGE project directory and copy to the workspace folder.

Return:

```
==================================================
CLIENT HANDOVER DOCUMENT COMPLETE
==================================================
File: {business-name-slug}-handover.html
Client: {business_name}
Package: {package_tier}
Sections: Cover / What Was Built / Website / Technical / How-To / Next Steps / Contact

SEND THIS TO THE CLIENT
  Share the HTML file directly — it opens in any browser
  Or copy-paste the "Next Steps" section into a WhatsApp message as a quick follow-up
==================================================
```

---

## Failure handling

| Failure | Action |
|---|---|
| Some inputs missing | Generate the document with placeholder text clearly marked `[TO BE FILLED]` |
| site_audit_summary not provided | Omit the audit section, do not block document creation |
| Canva URLs not available | Include a note: "Brand kit links to be shared by Aaron separately" |
| PDF export required | Pass the HTML file to the `pdf` skill for conversion |
