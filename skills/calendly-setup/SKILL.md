---
name: calendly-setup
description: >
  Set up Calendly for a new FORGE client using the Calendly MCP. Creates event types, configures
  availability, generates a booking widget embed code for the client's website, and provides
  HubSpot sync instructions. Trigger on: "set up Calendly", "add online booking", "let customers
  book appointments", "Package 4", "Package 5", "booking widget", "schedule meetings", "Calendly
  setup", or any time a client's website needs an embedded booking calendar.
  Also auto-triggers inside deploy-team for Package 4 and 5 builds.
  Uses the connected Calendly MCP (event_types-create_event_type, availability-get_user_availability_schedule).
---

# Calendly Setup Skill

## What This Builds

A complete booking system for a FORGE client, embedded directly into their website:

1. 2–3 event types tailored to the client's services (e.g., "Free Site Visit", "Quote Call", "Consultation")
2. Availability schedule configured for the client's working hours
3. Booking widget embed code dropped into the client's `index.html`
4. Scheduling URL the client can share directly (WhatsApp, email signature, social bio)
5. HubSpot sync instructions — how to push new bookings into the CRM pipeline

---

## Inputs

| Field | Description | Default |
|---|---|---|
| `business_name` | Client business name | Required |
| `business_type` | Trade/service category | `"general"` |
| `services[]` | Client's service list | Required |
| `working_hours` | E.g., "Mon–Fri 8am–6pm, Sat 9am–1pm" | `"Mon–Fri 9am–5pm"` |
| `timezone` | Client's timezone | `"Europe/London"` |
| `primary_event_duration` | Length of main event in minutes | `30` |
| `owner_email` | Client's email address (for the Calendly account) | Required |
| `hubspot_pipeline_id` | From hubspot-setup output (if Package 4+) | Optional |
| `brand_color_accent` | Accent hex colour for widget | `"#0099FF"` |

---

## Step 1: Ground yourself in the Calendly account

Call `users-get_current_user` to confirm the connected account. Note:
- Host URI (required for all subsequent calls)
- Name and timezone of the connected user
- Scheduling URL (the base booking page)

> **Critical:** The Calendly MCP is connected to a single account. If FORGE's own account is connected rather than the client's, the event types and availability will be set up on FORGE's calendar — not the client's. Confirm with Aaron before proceeding which account is active.

If the wrong account is connected: flag this and stop. The client needs to connect their own Calendly account, or Aaron can set this up under a sub-account if the plan allows.

---

## Step 2: Determine event types to create

Based on the `business_type`, define 2–3 event types. Use the table below as the default, then adjust for the client's actual services:

| Business type | Event 1 | Event 2 | Event 3 (optional) |
|---|---|---|---|
| `plumber` / `electrician` / `builder` / `roofer` | Free Site Visit (30 min) | Quote Call (15 min) | — |
| `landscaper` | Free Garden Consultation (45 min) | Project Quote Call (20 min) | — |
| `cleaner` | Free Assessment Visit (30 min) | Callback (15 min) | — |
| `beauty` | Consultation (30 min) | Treatment Booking (60 min) | — |
| `general` | Free Consultation (30 min) | Callback (15 min) | — |

If `services[]` provides enough detail (e.g., "boiler installation", "bathroom renovation"), use the actual service names as event type names rather than the generic defaults above.

---

## Step 3: Check existing event types

Call `event_types-list_event_types` filtered to the host's user URI.

- If suitable event types already exist: note them, skip creation, use them for embed code
- If no event types exist or they don't fit: create new ones in Step 4

---

## Step 4: Create event types

For each event type from Step 2, call `event_types-create_event_type` with:

```
name: {event_name}
duration: {duration in minutes}
description: {2–3 sentence description of what happens in this call/visit — written in the client's voice}
slug: {business-name-event-slug, e.g. "dave-plumbing-site-visit"}
color: {map brand_color_accent to nearest Calendly colour option}
```

Calendly colour options (map to nearest): blue, green, pink, orange, purple, teal, yellow, red.

After creating each event type, save:
- `event_type_uri` — for availability configuration
- `scheduling_url` — the direct booking link for this event

---

## Step 5: Configure availability

Call `availability-get_user_availability_schedule` to see the current availability.

If no schedule exists or it doesn't match the client's working hours: call `event_types-update_event_type_availability_schedule` with a schedule reflecting `working_hours`.

**Availability schedule format:**

```
Monday–Friday: {working_hours start}–{working_hours end}
Saturday: {if applicable from working_hours}
Sunday: unavailable
```

**Buffer times to set:**
- Before event: 15 minutes (travel buffer for trades)
- After event: 15 minutes (admin buffer)

If the business is a beauty salon or fixed-location service: remove the travel buffer.

---

## Step 6: Generate the booking widget embed code

Calendly's inline embed code (standard across all plan tiers):

```html
<!-- Calendly inline widget: {business_name} -->
<section id="booking" style="padding: 60px 20px; background: #f9f9f9; text-align: center;">
  <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 2rem; margin-bottom: 8px; color: #111;">
    Book Your Free {primary_event_name}
  </h2>
  <p style="font-family: Inter, sans-serif; color: #555; margin-bottom: 32px;">
    Choose a time that works for you — we'll confirm within 2 hours.
  </p>
  <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
  <div class="calendly-inline-widget"
       data-url="{primary_event_scheduling_url}?hide_gdpr_banner=1&primary_color={brand_color_accent_without_hash}"
       style="min-width:320px;height:700px;"></div>
  <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
</section>
```

Replace:
- `{primary_event_name}` — name of the main event type (e.g., "Site Visit")
- `{primary_event_scheduling_url}` — the full Calendly scheduling URL for the primary event type
- `{brand_color_accent_without_hash}` — accent colour without the `#` prefix (e.g., `0099FF`)

**Insertion point in index.html:**
- Insert after the services section and before the footer
- For Package 4: insert after `<section id="quote-wizard">` if present
- Add `<a href="#booking">Book Now</a>` to the navigation

---

## Step 7: Google Calendar sync instructions

Calendly automatically syncs with Google Calendar when the user connects it. Include these instructions in the handover:

```
GOOGLE CALENDAR SYNC
1. Log in to calendly.com
2. Go to Account → Integrations → Calendar Connections
3. Connect Google Calendar
4. Select which calendars Calendly should check for conflicts
5. Select which calendar to add new bookings to (recommend: create a new "Client Bookings" calendar)

Once connected:
- New bookings appear in Google Calendar automatically
- Existing Google Calendar events block the relevant Calendly slots
- Cancellations sync both ways
```

---

## Step 8: HubSpot integration instructions (Package 4+)

Calendly's native HubSpot integration requires a paid Calendly plan. On the free tier, use this Zapier-style workaround (or provide instructions to do it manually):

**Option A: Calendly paid tier (Standard+)**
Connect Calendly to HubSpot via: calendly.com → Integrations → HubSpot. New bookings automatically create contacts and activities in HubSpot.

**Option B: Free tier — manual or Zapier**
Include this in handover notes:
```
FREE TIER HUBSPOT SYNC (manual process)
When a new booking comes in:
1. Open HubSpot → Contacts → New
2. Add the contact: name, email, phone from the Calendly confirmation email
3. Create a Deal in the "New Leads" pipeline → Stage: "Discovery Complete"
4. Log a note: "Calendly booking — [event type] — [date/time]"
5. Set a follow-up task for 1 hour before the appointment

Upgrade to Calendly Standard (£8/month) for automatic sync.
```

**Option C: Calendly webhook → Vercel function → HubSpot (advanced, Package 5)**
For clients who want full automation on the free tier, document this as a future enhancement requiring a Vercel webhook endpoint that receives Calendly events and pushes to HubSpot via the API.

---

## Output

Return a structured summary:

```
==================================================
CALENDLY SETUP COMPLETE: {business_name}
==================================================
Account:        {user name} ({scheduling_url})
Timezone:       {timezone}

EVENT TYPES CREATED
  1. {event_name_1} — {duration} min — {scheduling_url_1}
  2. {event_name_2} — {duration} min — {scheduling_url_2}
  {3. if applicable}

AVAILABILITY
  {Mon–Fri start–end} / {Sat hours or "not available"}
  Buffer: 15 min before + 15 min after

WEBSITE
  Widget embedded in index.html after services section
  Nav link "Book Now" added → #booking

SHARE THIS LINK WITH THE CLIENT
  {primary event scheduling_url}
  (Add to WhatsApp bio, email signature, Google Business Profile)

GOOGLE CALENDAR SYNC
  See handover notes — client connects via calendly.com → Integrations

HUBSPOT SYNC
  {Option A / B / C as applicable}
==================================================
```

---

## Failure handling

| Failure | Action |
|---|---|
| Wrong Calendly account connected | Stop. Flag to Aaron before creating any event types |
| Event type creation fails | Check if free tier limits are reached (Calendly free allows limited event types). Document which were created |
| Scheduling URL not returned | Use `{scheduling_url from get_current_user}/{event_slug}` as fallback |
| Availability update fails | Use Calendly default availability, document for client to update manually |
| HubSpot integration unavailable | Default to Option B (manual), document clearly |
