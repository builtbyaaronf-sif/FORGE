module.exports = async (req, res) => {
  // Handle success redirect after PayPal payment
  const success = req.query && req.query.success === '1';

  const paypalEmail = process.env.PAYPAL_MERCHANT_EMAIL || 'builtbyaaronf@gmail.com';
  const baseUrl = 'https://forgeisagentic.tech';
  const reportApiUrl = `${baseUrl}/api/report-issue`;

  const packages = [
    {
      id: 'p1',
      name: 'Launch',
      was: '74.99',
      now: '7.49',
      tagline: 'Your business, live online today.',
      features: [
        'Live website with clear CTAs',
        'SEO meta and Google Analytics',
        'Floating WhatsApp button',
        'Trust badges section',
        'Cookie banner and Privacy Policy',
        'Google Business Profile guide',
      ],
    },
    {
      id: 'p2',
      name: 'Brand',
      was: '149.99',
      now: '14.99',
      tagline: 'Everything in Launch, plus a brand that stands out.',
      features: [
        'AI imagery tailored to your trade',
        'Canva brand kit: logo, colours, fonts',
        'Testimonials section',
        'Service area map section',
      ],
    },
    {
      id: 'p3',
      name: 'Convert',
      was: '299.99',
      now: '29.99',
      tagline: 'Everything in Brand, plus a machine that captures leads.',
      popular: true,
      features: [
        'Quote wizard with photo upload',
        'Direct call and WhatsApp CTA',
        'Instant lead alerts to your phone &amp; email',
        'HubSpot CRM set up by us',
        'Leads flow into CRM automatically',
      ],
    },
    {
      id: 'p4',
      name: 'Book',
      was: '499.99',
      now: '49.99',
      tagline: 'Everything in Convert, plus online booking.',
      features: [
        'Calendly set up with event types',
        'Booking widget embedded on site',
        'Google Calendar sync',
        'Bookings to HubSpot pipeline',
        'Client history in CRM',
      ],
    },
    {
      id: 'p5',
      name: 'Grow',
      was: '624.99',
      now: '62.49',
      tagline: 'Everything in Book, plus a full month of content.',
      features: [
        'Social media profile setup guide &amp; optimisation tips',
        'Full month of content created',
        'Canva social templates',
        'Consistent brand across all channels',
      ],
    },
  ];

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
        <input type="hidden" name="item_name" value="FORGE Package ${pkg.id.toUpperCase()} â ${pkg.name} (Beta 90% off)">
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
    </div>
  `).join('');

  const successBanner = success ? `
    <div class="success-banner">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
      Payment received. We'll be in touch within the hour to get started. Check your email.
    </div>
  ` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FORGE Beta â 90% Off | 10 Spots Only</title>
  <meta name="description" content="FORGE beta cohort â 90% off any package for London tradespeople. 10 spots only.">
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='200' fill='%23000'/%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23d4f060'/%3E%3Cstop offset='40%25' stop-color='%2360d4b0'/%3E%3Cstop offset='70%25' stop-color='%234ab0e8'/%3E%3Cstop offset='100%25' stop-color='%238040c0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points='100,10 106,90 120,20 108,94 140,38 112,98 160,72 116,104 175,100 116,108 160,128 112,102 140,162 108,106 120,180 106,110 100,190 94,110 80,180 92,106 60,162 88,102 40,128 84,108 25,100 84,104 40,72 88,98 60,38 92,94 80,20 94,90' fill='url(%23g)'/%3E%3C/svg%3E">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --lime: #d4f060;
      --cyan: #60d4b0;
      --bg: #0a0a0a;
      --card: #111111;
      --border: rgba(255,255,255,0.08);
      --text: #f0f0f0;
      --muted: #888;
      --radius: 12px;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      min-height: 100vh;
    }

    /* ââ NAV ââ */
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 32px;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      background: rgba(10,10,10,0.95);
      backdrop-filter: blur(12px);
      z-index: 100;
    }
    .nav-logo {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, var(--lime), var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-decoration: none;
    }
    .nav-badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--lime);
      border: 1px solid rgba(212,240,96,0.3);
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(212,240,96,0.08);
    }

    /* ââ SUCCESS BANNER ââ */
    .success-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(96,212,176,0.12);
      border: 1px solid rgba(96,212,176,0.3);
      color: var(--cyan);
      padding: 14px 32px;
      font-size: 14px;
      font-weight: 500;
    }

    /* ââ HERO ââ */
    .hero {
      text-align: center;
      padding: 80px 24px 60px;
      max-width: 700px;
      margin: 0 auto;
    }
    .hero-eyebrow {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--lime);
      border: 1px solid rgba(212,240,96,0.25);
      padding: 5px 14px;
      border-radius: 20px;
      background: rgba(212,240,96,0.06);
      margin-bottom: 28px;
    }
    .hero h1 {
      font-size: clamp(32px, 6vw, 56px);
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -1.5px;
      margin-bottom: 20px;
    }
    .hero h1 .accent {
      background: linear-gradient(135deg, var(--lime), var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-sub {
      font-size: 17px;
      color: var(--muted);
      max-width: 500px;
      margin: 0 auto 40px;
      line-height: 1.7;
    }

    /* ââ STATS ââ */
    .stats {
      display: flex;
      justify-content: center;
      gap: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      max-width: 480px;
      margin: 0 auto 48px;
    }
    .stat {
      flex: 1;
      padding: 20px 16px;
      text-align: center;
      border-right: 1px solid var(--border);
    }
    .stat:last-child { border-right: none; }
    .stat-value {
      font-size: 26px;
      font-weight: 900;
      background: linear-gradient(135deg, var(--lime), var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: block;
      line-height: 1;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ââ COUNTDOWN ââ */
    .countdown-wrap {
      text-align: center;
      margin-bottom: 64px;
    }
    .countdown-label {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .countdown {
      display: inline-flex;
      gap: 12px;
      align-items: center;
    }
    .cd-block {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .cd-num {
      font-size: 32px;
      font-weight: 900;
      font-variant-numeric: tabular-nums;
      background: linear-gradient(135deg, var(--lime), var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      min-width: 56px;
      text-align: center;
      line-height: 1;
    }
    .cd-label {
      font-size: 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .cd-sep {
      font-size: 28px;
      font-weight: 900;
      color: var(--border);
      margin-bottom: 16px;
    }

    /* ââ ONE ASK ââ */
    .one-ask {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px 32px;
      max-width: 600px;
      margin: 0 auto 64px;
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    .one-ask-icon {
      width: 40px;
      height: 40px;
      min-width: 40px;
      background: rgba(212,240,96,0.1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .one-ask-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--lime);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .one-ask-text {
      font-size: 14px;
      color: var(--muted);
      line-height: 1.6;
    }

    /* ââ SECTION HEADINGS ââ */
    .section-label {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--muted);
      margin-bottom: 12px;
    }
    .section-heading {
      text-align: center;
      font-size: clamp(24px, 4vw, 36px);
      font-weight: 900;
      letter-spacing: -0.8px;
      margin-bottom: 48px;
    }
    .section-heading .accent {
      background: linear-gradient(135deg, var(--lime), var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ââ PACKAGES ââ */
    .packages-section {
      padding: 0 24px 80px;
      max-width: 1100px;
      margin: 0 auto;
    }
    .packages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .pkg-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: border-color 0.2s;
    }
    .pkg-card:hover {
      border-color: rgba(212,240,96,0.25);
    }
    .pkg-card--popular {
      border-color: rgba(212,240,96,0.3);
      background: linear-gradient(160deg, #141a0a 0%, #111 60%);
    }
    .pkg-badge {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: linear-gradient(135deg, var(--lime), var(--cyan));
      color: #000;
      padding: 3px 12px;
      border-radius: 20px;
      white-space: nowrap;
    }
    .pkg-header { margin-bottom: 20px; }
    .pkg-name {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .pkg-pricing {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 10px;
    }
    .pkg-was {
      font-size: 14px;
      color: var(--muted);
      text-decoration: line-through;
    }
    .pkg-now {
      font-size: 30px;
      font-weight: 900;
      background: linear-gradient(135deg, var(--lime), var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }
    .pkg-tagline {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.5;
    }
    .pkg-features {
      list-style: none;
      margin-bottom: 24px;
      flex: 1;
    }
    .pkg-features li {
      font-size: 13px;
      color: #ccc;
      padding: 6px 0;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.4;
    }
    .pkg-features li::before {
      content: '\2713';
      color: var(--lime);
      font-weight: 700;
      font-size: 12px;
      margin-top: 1px;
      flex-shrink: 0;
    }
    .pkg-features li:last-child { border-bottom: none; }
    .pkg-form { margin-top: auto; }
    .pkg-cta {
      width: 100%;
      background: linear-gradient(135deg, var(--lime), var(--cyan));
      color: #000;
      font-size: 13px;
      font-weight: 800;
      border: none;
      border-radius: 8px;
      padding: 13px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: opacity 0.15s, transform 0.15s;
      letter-spacing: 0.2px;
    }
    .pkg-cta:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    /* ââ HOW IT WORKS ââ */
    .how-section {
      padding: 0 24px 80px;
      max-width: 700px;
      margin: 0 auto;
    }
    .steps {
      display: flex;
      flex-direction: column;
      gap: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 24px 28px;
      border-bottom: 1px solid var(--border);
    }
    .step:last-child { border-bottom: none; }
    .step-num {
      width: 28px;
      height: 28px;
      min-width: 28px;
      background: rgba(212,240,96,0.1);
      border: 1px solid rgba(212,240,96,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      color: var(--lime);
      margin-top: 2px;
    }
    .step-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .step-body {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.6;
    }

    /* ââ FOOTER ââ */
    footer {
      border-top: 1px solid var(--border);
      padding: 32px 24px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
    }
    footer a { color: var(--muted); text-decoration: underline; }
    footer .forge-footer-logo {
      font-size: 16px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--lime), var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: block;
      margin-bottom: 8px;
    }

    /* ââ REPORT ISSUE WIDGET ââ */
    #forge-rb {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(20,20,20,0.95);
      border: 1px solid rgba(255,255,255,0.15);
      color: #ccc;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 20px;
      cursor: pointer;
      z-index: 2147483640;
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      transition: border-color 0.2s;
      font-family: inherit;
    }
    #forge-rb:hover { border-color: rgba(212,240,96,0.4); color: #f0f0f0; }
    #forge-rp {
      position: fixed;
      bottom: 70px;
      right: 24px;
      width: 320px;
      background: #141414;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      padding: 20px;
      z-index: 2147483641;
      display: none;
      box-shadow: 0 8px 40px rgba(0,0,0,0.6);
      font-family: inherit;
    }
    #forge-rp h4 { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #f0f0f0; }
    #forge-rp p { font-size: 11px; color: #888; margin-bottom: 14px; }
    #forge-ss-wrap { margin-bottom: 12px; display: none; }
    #forge-ss-wrap img { width: 100%; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); }
    #forge-desc {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #f0f0f0;
      font-size: 13px;
      padding: 10px 12px;
      resize: none;
      height: 80px;
      margin-bottom: 12px;
      font-family: inherit;
    }
    #forge-desc:focus { outline: none; border-color: rgba(212,240,96,0.4); }
    #forge-send {
      width: 100%;
      background: linear-gradient(135deg, #d4f060, #60d4b0);
      color: #000;
      font-size: 12px;
      font-weight: 800;
      border: none;
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      font-family: inherit;
    }
    #forge-status { font-size: 11px; color: #888; text-align: center; margin-top: 8px; min-height: 16px; }

    @media (max-width: 640px) {
      nav { padding: 16px 20px; }
      .hero { padding: 60px 20px 40px; }
      .packages-grid { grid-template-columns: 1fr; }
      .one-ask { flex-direction: column; }
      #forge-rp { width: calc(100vw - 32px); right: 16px; }
    }
  </style>
</head>
<body>

  <nav>
    <a href="/" class="nav-logo">FORGE.</a>
    <span class="nav-badge">Beta Cohort &mdash; 10 Spots</span>
  </nav>

  ${successBanner}

  <!-- HERO -->
  <section class="hero">
    <div class="hero-eyebrow">Private Beta â Not Public</div>
    <h1>Your <span class="accent">entire marketing</span><br>department.<br>For under a tenner.</h1>
    <p class="hero-sub">You were invited because your work is worth more than your online presence. We're fixing that today. 90% off. Live within hours.</p>

    <div class="stats">
      <div class="stat">
        <span class="stat-value">10</span>
        <span class="stat-label">Spots only</span>
      </div>
      <div class="stat">
        <span class="stat-value">90%</span>
        <span class="stat-label">Off all packages</span>
      </div>
      <div class="stat">
        <span class="stat-value">&lt;1</span>
        <span class="stat-label">Hr to live</span>
      </div>
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
        <div class="one-ask-text">After your site is live, click one link. You'll get a 5-minute AI video chat â answer 3 quick questions about how it went. No calls. No scheduling. No live conversation with anyone. One tap, 5 minutes, done. That's the entire deal.</div>
      </div>
    </div>
  </div>

  <!-- PACKAGES -->
  <section class="packages-section">
    <div class="section-label">Pick Your Package</div>
    <h2 class="section-heading">Everything you need.<br><span class="accent">Nothing you don't.</span></h2>
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
          <div class="step-body">Our AI agents get to work. Website, brand kit, CRM â all deployed and live. You'll hear from us within the hour.</div>
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

  <!-- SCRIPTS -->
  <script>
    // ââ COUNTDOWN ââ
    (function() {
      var end = new Date('2026-07-14T23:59:59Z').getTime();
      function tick() {
        var now = Date.now();
        var diff = end - now;
        if (diff <= 0) {
          document.getElementById('cd-d').textContent = '00';
          document.getElementById('cd-h').textContent = '00';
          document.getElementById('cd-m').textContent = '00';
          document.getElementById('cd-s').textContent = '00';
          return;
        }
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        document.getElementById('cd-d').textContent = String(d).padStart(2,'0');
        document.getElementById('cd-h').textContent = String(h).padStart(2,'0');
        document.getElementById('cd-m').textContent = String(m).padStart(2,'0');
        document.getElementById('cd-s').textContent = String(s).padStart(2,'0');
      }
      tick();
      setInterval(tick, 1000);
    })();

    // ââ REPORT ISSUE WIDGET ââ
    (function() {
      var WIDGET_API = '${reportApiUrl}';
      var SITE_NAME = 'FORGE Beta';
      var btn = document.getElementById('forge-rb');
      var panel = document.getElementById('forge-rp');
      var ssWrap = document.getElementById('forge-ss-wrap');
      var ssImg = document.getElementById('forge-ss-img');
      var desc = document.getElementById('forge-desc');
      var send = document.getElementById('forge-send');
      var status = document.getElementById('forge-status');
      var html2canvasLoaded = false;
      var screenshotData = null;
      var panelOpen = false;

      function loadHtml2Canvas(cb) {
        if (html2canvasLoaded) { cb(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = function() { html2canvasLoaded = true; cb(); };
        document.head.appendChild(s);
      }

      function takeScreenshot(cb) {
        loadHtml2Canvas(function() {
          panel.style.display = 'none';
          btn.style.display = 'none';
          setTimeout(function() {
            html2canvas(document.body, { useCORS: true, scale: 0.6, logging: false }).then(function(canvas) {
              screenshotData = canvas.toDataURL('image/png');
              ssImg.src = screenshotData;
              ssWrap.style.display = 'block';
              panel.style.display = 'block';
              btn.style.display = 'flex';
              cb && cb();
            }).catch(function() {
              panel.style.display = 'block';
              btn.style.display = 'flex';
            });
          }, 150);
        });
      }

      btn.addEventListener('click', function() {
        if (panelOpen) {
          panel.style.display = 'none';
          panelOpen = false;
        } else {
          panelOpen = true;
          status.textContent = 'Capturing screenshotâ¦';
          panel.style.display = 'block';
          takeScreenshot(function() { status.textContent = ''; });
        }
      });

      send.addEventListener('click', function() {
        send.disabled = true;
        status.textContent = 'Sendingâ¦';
        fetch(WIDGET_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: desc.value || '(no description)',
            screenshot: screenshotData || null,
            pageUrl: window.location.href,
            siteName: SITE_NAME,
            timestamp: new Date().toISOString()
          })
        })
        .then(function(r) { return r.json(); })
        .then(function() {
          status.textContent = 'â Sent. Thanks for the feedback.';
          desc.value = '';
          screenshotData = null;
          ssWrap.style.display = 'none';
          send.disabled = false;
          setTimeout(function() {
            panel.style.display = 'none';
            panelOpen = false;
            status.textContent = '';
          }, 2500);
        })
        .catch(function() {
          status.textContent = 'Could not send. Try again.';
          send.disabled = false;
        });
      });
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
