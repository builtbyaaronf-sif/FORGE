# FORGE — Self-Host Security Handover Pack
**For clients who choose to host their own website.**

---

## What This Pack Covers

You've chosen to host your website on your own infrastructure. This pack tells you exactly what you need to do to keep it secure. FORGE has built your site — from this point, the technical responsibility transfers to you.

A personalised video walkthrough (via Tavus) will also be sent to your email, covering all steps below visually.

---

## Part 1 — What We're Handing Over

| Deliverable | Format | Notes |
|---|---|---|
| Full website source code | `.zip` file | All HTML, CSS, JS assets |
| Environment variables list | `.txt` file | Names and descriptions only — you set the values |
| DNS configuration guide | This document, Section 3 | |
| Third-party integration instructions | This document, Section 4 | |
| Deployment guide | This document, Section 2 | |

---

## Part 2 — Recommended Hosting Options

FORGE recommends the following for self-hosted deployments:

### Option A — Vercel (Recommended, Free Tier Available)
1. Create your own account at vercel.com
2. Upload the zip or connect a private GitHub repo
3. Add environment variables under Project → Settings → Environment Variables
4. Add your custom domain under Project → Settings → Domains

### Option B — Netlify
1. Create account at netlify.com
2. Drag and drop the unzipped site folder to deploy
3. Add env vars under Site Settings → Environment Variables
4. Add domain under Domain Management

### Option C — Traditional Web Host (cPanel)
1. Log in to your hosting control panel
2. Upload all files to `public_html` via File Manager or FTP
3. Environment variables: create a `config.js` file — **see security warning below**

> ⚠️ **cPanel Warning:** Traditional hosts don't have secure environment variable storage. If you use cPanel, your API keys may need to be embedded in client-side code. This is a security risk. We strongly recommend Vercel or Netlify instead.

---

## Part 3 — DNS Configuration

After deploying, point your domain to your hosting provider:

### Vercel
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

### Netlify
```
Type: CNAME
Name: www
Value: [your-site-name].netlify.app

Type: A
Name: @
Value: 75.2.60.5
```

DNS changes take 24–48 hours to propagate globally.

---

## Part 4 — Environment Variables You Need to Set

The following variables were used in your site build. You must set these in your hosting provider's environment variable settings:

| Variable Name | What It Is | Where to Get It |
|---|---|---|
| *(Specific to your build — see the accompanying .txt file)* | | |

**Never share these values with anyone.** Treat them like passwords.

---

## Part 5 — SSL Certificate (HTTPS)

Your site **must** run on HTTPS. Without it, browsers will show a security warning and search engines will penalise your rankings.

- **Vercel / Netlify:** SSL is automatic. Nothing to do.
- **cPanel:** Enable "Let's Encrypt SSL" in your cPanel dashboard, then force HTTPS via `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Part 6 — Security Headers

Add the following to your hosting configuration to protect your visitors:

### Vercel / Netlify — via `vercel.json` or `netlify.toml`
(Included in your source zip as `vercel.json`)

### cPanel — via `.htaccess`
Add to the `.htaccess` file in your `public_html` folder:

```apache
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
```

---

## Part 7 — Your Ongoing Responsibilities

By self-hosting, you take on the following responsibilities:

| Responsibility | Frequency |
|---|---|
| Renew your domain name | Annually (set auto-renew) |
| Monitor SSL certificate expiry | Annually (auto-renews on Vercel/Netlify) |
| Review and update third-party integrations | When prompted by the provider |
| Ensure your site complies with UK GDPR | Ongoing |
| Register with the ICO if collecting personal data | Before going live |
| Keep your hosting account credentials secure | Always |

---

## Part 8 — GDPR & Legal Compliance

Your website includes a Privacy Policy, Cookie Banner, and Terms & Conditions. You must:

1. Register with the **ICO** as a data controller if you collect any personal data (names, emails, phone numbers): **ico.org.uk/registration** (£40/year)
2. Keep your Privacy Policy up to date — if you add new data collection, update it
3. Respond to any data subject requests within **30 days**
4. Report data breaches to the ICO within **72 hours** if personal data is at risk

---

## Part 9 — FORGE's Liability Limitation

Once this handover is complete and you have taken control of your hosting:

- FORGE is not liable for any security vulnerabilities, data breaches, or downtime on your self-hosted infrastructure.
- FORGE is not responsible for third-party service failures (HubSpot, Formspree, Calendly, etc.).
- FORGE will provide **1 hour of post-handover support** to assist with deployment questions. Additional support is charged at the day rate in your proposal.

---

## Part 10 — Tavus Onboarding Video

A personalised video walkthrough has been sent to your email address. It covers:
- Uploading your site to Vercel (recommended)
- Setting your environment variables
- Connecting your domain
- Testing your forms

If you haven't received the video, contact: **builtbyaaronf@gmail.com**

---

## Emergency Contact

If something goes wrong during self-hosted deployment:

**Aaron F. — FORGE Agency**
Email: builtbyaaronf@gmail.com
Response time: 1 business day (support beyond the free hour is billable)

---

*FORGE Agency — builtbyaaronf@gmail.com*
*Handover completed: [DATE]*
