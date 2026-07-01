// api/beta.js — FORGE beta page
// Static assets: CSS → /beta.css | Client JS → /beta-client.js
//
// ── Rate Limiter ─────────────────────────────────────────────────────────
const RL_WINDOW = 60_000;
const RL_MAX = 30;
const rlMap = new Map();
function isRateLimited(ip) {
const now = Date.now();
const hits = (rlMap.get(ip) || []).filter(t => now - t < RL_WINDOW);
hits.push(now);
rlMap.set(ip, hits);
return hits.length > RL_MAX;
}

export default async function handler(req, res) {
const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
if (isRateLimited(ip)) return res.status(429).send('Too many requests.');

const success = req.query?.success === '1';
const paypalEmail = process.env.PAYPAL_MERCHANT_EMAIL || 'builtbyaaronf@gmail.com';
const baseUrl = 'https://forgeisagentic.tech';

// ── Package data ─────────────────────────────────────────────────────
// Two-product model — replaces the old 5-tier p1-p5 structure. Beta pricing
// (90% off) matches product1b/product2b in api/paypal-webhook.js.
const packages = [
{
id: 'product1b', name: 'Launch', was: '99', now: '9.90',
tagline: 'Your business, live online today.',
features: [
'Live website with real pricing + arrival times',
'Instant quote form, no phone tag',
'Direct booking calendar',
'Instagram showcase + Google reviews on your homepage',
'Cookie banner, Privacy Policy, Terms — fully compliant',
],
},
{
id: 'product2b', name: 'Scale', was: '299.99', now: '29.99',
tagline: 'Everything in Launch, plus the machine that runs your marketing.',
popular: true,
features: [
'Full brand kit — logo, letterhead, signage',
'CRM with leads auto-flowing in',
'Invoicing that tracks what\'s owed and paid',
'Automated follow-up emails to new leads',
'A dashboard summarising everything, always up to date',
'A month of social content, ready to post',
],
},
];

// ── Package card HTML ─────────────────────────────────────────────────
const packageCards = packages.map(pkg => `
<div class="pkg-card${pkg.popular ? ' pkg-card--popular' : ''}">
${pkg.popular ? '<div class="pkg-badge">Most Popular</div>' : ''}
<div class="pkg-header">
<div class="pkg-name">${pkg.name}</div>
<div class="pkg-pricing">
<span class="pkg-was">&pound;${pkg.was}</span>
<span class="pkg-now">&pound;${pkg.now}</span>
</div>
<div class="pkg-tagline">${pkg.tagline}</div>
</div>
<ul class="pkg-features">
${pkg.features.map(f => `<li>${f}</li>`).join('')}
</ul>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" class="pkg-form">
<input type="hidden" name="cmd" value="_xclick">
<input type="hidden" name="business" value="${paypalEmail}">
<input type="hidden" name="item_name" class="paypal-item-name" value="FORGE ${pkg.id.toUpperCase()} — ${pkg.name} (Beta 90% off) [Style: not selected]">
<input type="hidden" name="amount" value="${pkg.now}">
<input type="hidden" name="currency_code" value="GBP">
<input type="hidden" name="return" value="${baseUrl}/beta?success=1">
<input type="hidden" name="cancel_return" value="${baseUrl}/beta">
<input type="hidden" name="no_shipping" value="1">
<input type="hidden" name="no_note" value="1">
<button type="submit" class="pkg-cta">
Pay &pound;${pkg.now} with PayPal
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
</button>
</form>
</div>`).join('');

// ── Success banner ────────────────────────────────────────────────────
const successBanner = success ? `
<div class="success-banner">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
Payment received. We'll be in touch within the hour to get started. Check your email.
</div>` : '';

// ── Page HTML ─────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FORGE Beta — 90% Off | 10 Spots Only</title>
<meta name="description" content="FORGE beta cohort — 90% off any package for London tradespeople. 10 spots only.">
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='200' fill='%23000'/%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23d4f060'/%3E%3Cstop offset='40%25' stop-color='%2360d4b0'/%3E%3Cstop offset='70%25' stop-color='%234ab0e8'/%3E%3Cstop offset='100%25' stop-color='%238040c0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points='100,10 106,90 120,20 108,94 140,38 112,98 160,72 116,104 175,100 116,108 160,128 112,102 140,162 108,106 120,180 106,110 100,190 94,110 80,180 92,106 60,162 88,102 40,128 84,108 25,100 84,104 40,72 88,98 60,38 92,94 80,20 94,90' fill='url(%23g)'/%3E%3C/svg%3E">
<link rel="stylesheet" href="/beta.css">
</head>
<body>

<nav>
<a href="/" class="nav-logo">FORGE.</a>
<span class="nav-badge">Beta Cohort &mdash; 10 Spots</span>
</nav>

${successBanner}

<!-- HERO -->
<section class="hero">
<div class="hero-eyebrow">Private Beta — Not Public</div>
<h1>Your <span class="accent">entire marketing</span><br>department.<br>For under a tenner.</h1>
<p class="hero-sub">You were invited because your work is worth more than your online presence. We're fixing that today. 90% off. Live within hours.</p>
<div class="stats">
<div class="stat"><span class="stat-value">10</span><span class="stat-label">Spots only</span></div>
<div class="stat"><span class="stat-value">90%</span><span class="stat-label">Off all packages</span></div>
<div class="stat"><span class="stat-value">&lt;1</span><span class="stat-label">Hr to live</span></div>
</div>
</section>

<!-- COUNTDOWN -->
<div class="countdown-wrap">
<div class="countdown-label">Offer closes in</div>
<div class="countdown">
<div class="cd-block"><span class="cd-num" id="cd-d">--</span><span class="cd-label">Days</span></div>
<span class="cd-sep">:</span>
<div class="cd-block"><span class="cd-num" id="cd-h">--</span><span class="cd-label">Hours</span></div>
<span class="cd-sep">:</span>
<div class="cd-block"><span class="cd-num" id="cd-m">--</span><span class="cd-label">Mins</span></div>
<span class="cd-sep">:</span>
<div class="cd-block"><span class="cd-num" id="cd-s">--</span><span class="cd-label">Secs</span></div>
</div>
</div>

<!-- ONE ASK -->
<div style="padding: 0 24px; max-width: 1100px; margin: 0 auto 64px;">
<div class="one-ask">
<div class="one-ask-icon">&#127897;</div>
<div>
<div class="one-ask-title">One ask in return</div>
<div class="one-ask-text">After your site is live, click one link. You'll get a 5-minute AI video chat — answer 3 quick questions about how it went. No calls. No scheduling. No live conversation with anyone. One tap, 5 minutes, done. That's the entire deal.</div>
</div>
</div>
</div>

<!-- AESTHETIC PICKER -->
<section class="aesthetic-section" id="style-picker">
<div class="section-label">Step 1 of 2</div>
<h2 class="section-heading">What style feels<br><span class="accent">like your business?</span></h2>
<p class="aesthetic-intro">This shapes your website design, colours, and brand kit. Pick the one that feels closest — we'll fine-tune it to your trade.</p>
<div class="aesthetic-grid">

<button class="aesthetic-card" data-aesthetic="A" data-label="Dark &amp; Bold">
<div class="ae-swatch ae-swatch-a">
<div class="ae-swatch-bg"></div>
<div class="ae-swatch-headline">Boilers Fixed<br>Same Day.</div>
<div class="ae-swatch-accent">Get a Quote</div>
</div>
<div class="ae-info">
<div class="ae-name">Dark &amp; Bold</div>
<div class="ae-desc">High contrast, confident, no-nonsense. Works well for trades, auto, and tech.</div>
<div class="ae-meta">
<span class="ae-dot" style="background:#0A0A0A;border:1px solid #444"></span>
<span class="ae-dot" style="background:#FF6B35"></span>
<span class="ae-dot" style="background:#F5F5F0"></span>
<span class="ae-font">Space Grotesk</span>
</div>
</div>
<div class="ae-check">&#10003;</div>
</button>

<button class="aesthetic-card" data-aesthetic="B" data-label="Clean &amp; Professional">
<div class="ae-swatch ae-swatch-b">
<div class="ae-swatch-bg"></div>
<div class="ae-swatch-headline">South London's<br>Trusted Plumber.</div>
<div class="ae-swatch-accent">Book Now</div>
</div>
<div class="ae-info">
<div class="ae-name">Clean &amp; Professional</div>
<div class="ae-desc">Light, crisp, trusted. Works well for plumbers, professional services, and health.</div>
<div class="ae-meta">
<span class="ae-dot" style="background:#FFFFFF;border:1px solid #ddd"></span>
<span class="ae-dot" style="background:#0071E3"></span>
<span class="ae-dot" style="background:#1D1D1F"></span>
<span class="ae-font">Inter</span>
</div>
</div>
<div class="ae-check">&#10003;</div>
</button>

<button class="aesthetic-card" data-aesthetic="C" data-label="Warm &amp; Artisan">
<div class="ae-swatch ae-swatch-c">
<div class="ae-swatch-bg"></div>
<div class="ae-swatch-headline">Handcrafted.<br>With care.</div>
<div class="ae-swatch-accent">See Our Work</div>
</div>
<div class="ae-info">
<div class="ae-name">Warm &amp; Artisan</div>
<div class="ae-desc">Earthy, personal, approachable. Works well for decorators, gardeners, and wellness.</div>
<div class="ae-meta">
<span class="ae-dot" style="background:#FEFBF6;border:1px solid #ddd"></span>
<span class="ae-dot" style="background:#C8773A"></span>
<span class="ae-dot" style="background:#1C1410"></span>
<span class="ae-font">DM Serif Display</span>
</div>
</div>
<div class="ae-check">&#10003;</div>
</button>

</div>
<p class="aesthetic-note">Not sure? Choose the closest match — we'll confirm before we build anything.</p>
</section>

<!-- PACKAGES -->
<section class="packages-section" id="packages">
<div class="section-label">Step 2 of 2</div>
<h2 class="section-heading">Everything you need.<br><span class="accent">Nothing you don't.</span></h2>
<div id="aesthetic-selection-banner" class="aesthetic-banner" style="display:none">
<span id="aesthetic-banner-text"></span>
<button class="aesthetic-banner-change" onclick="document.getElementById('style-picker').scrollIntoView({behavior:'smooth'})">Change style</button>
</div>
<div class="packages-grid">
${packageCards}
</div>
<p style="text-align:center; font-size:12px; color: var(--muted); margin-top: 20px;">
All prices include 90% beta discount. One-off payment. No monthly fees. VAT may apply.
</p>
</section>

<!-- HOW IT WORKS -->
<section class="how-section">
<div class="section-label">What Happens Next</div>
<h2 class="section-heading"><span class="accent">Live within hours.</span><br>Here's how.</h2>
<div class="steps">
<div class="step">
<div class="step-num">1</div>
<div>
<div class="step-title">You pay and confirm your trade</div>
<div class="step-body">Select your package above. PayPal handles the payment securely. You'll get a confirmation email immediately.</div>
</div>
</div>
<div class="step">
<div class="step-num">2</div>
<div>
<div class="step-title">FORGE builds everything</div>
<div class="step-body">Our AI agents get to work. Website, brand kit, CRM — all deployed and live. You'll hear from us within the hour.</div>
</div>
</div>
<div class="step">
<div class="step-num">3</div>
<div>
<div class="step-title">You get a live URL</div>
<div class="step-body">We send you everything: your live site URL, login details, brand assets, and a full handover document.</div>
</div>
</div>
<div class="step">
<div class="step-num">4</div>
<div>
<div class="step-title">Click the feedback link</div>
<div class="step-body">We send you one link. Click it, answer 3 questions about the experience. Takes 5 minutes. That's the entire ask.</div>
</div>
</div>
</div>
</section>

<!-- FOOTER -->
<footer>
<span class="forge-footer-logo">FORGE.</span>
The AI marketing department for London tradespeople.<br>
<a href="/">forgeisagentic.tech</a> &nbsp;&middot;&nbsp;
<a href="/privacy">Privacy</a> &nbsp;&middot;&nbsp;
<a href="/terms">Terms</a><br>
<span style="margin-top:8px; display:block;">Questions? <a href="mailto:sales@forgeisagentic.tech">sales@forgeisagentic.tech</a></span>
</footer>

<!-- REPORT ISSUE BUTTON -->
<button id="forge-rb" title="Report an issue">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
Something wrong?
</button>

<!-- REPORT ISSUE PANEL -->
<div id="forge-rp">
<h4>Report an issue</h4>
<p>We'll capture a screenshot and send it to the FORGE team.</p>
<div id="forge-ss-wrap"><img id="forge-ss-img" src="" alt="Screenshot"></div>
<textarea id="forge-desc" placeholder="What's wrong? (optional)"></textarea>
<button id="forge-send">Send Report</button>
<div id="forge-status"></div>
</div>

<script src="/beta-client.js"></script>
</body>
</html>`;

res.setHeader('Content-Type', 'text/html; charset=utf-8');
res.setHeader('Cache-Control', 'no-store');
res.status(200).send(html);
}
