/**
 * FORGE — OG Image Generator
 * Node.js serverless function → returns 1080×1080 PNG
 * Uses sharp to convert SVG → PNG. No edge runtime, no @vercel/og.
 *
 * Usage:
 *   GET /api/og                                              → origin story
 *   GET /api/og?type=deploy&client=Dave%27s+Plumbing&time=00%3A08%3A12
 *   GET /api/og?type=education
 *   GET /api/og?type=offer
 *   GET /api/og?type=custom&title=Your+headline&sub=Subtext
 */

import sharp from 'sharp';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  canvas: '#090909',
  panel:  '#0D0D0D',
  right:  '#111111',
  border: '#1A1A1A',
  blue:   '#0099FF',
  white:  '#FFFFFF',
  muted:  '#888888',
  green:  '#28C840',
  bar:    '#0B0B0B',
};

// ─── Terminal lines per type ───────────────────────────────────────────────────
const LINES = {
  origin: [
    '&gt; Initialising FORGE...',
    '&gt; Running SCOUT [Intel]...',
    '&gt; ATLAS [Build] → website generated',
    '&gt; PIXEL [Brand] → brand kit created',
    '&gt; WIRE [CRM] → HubSpot pipeline live',
    '&gt; BOOK [Booking] → Calendly embedded',
    '&gt; SPARK [Content] → 20 posts written',
    '&gt; FORGE [QA] → all systems green',
    '&gt; ✓ Deploy complete. 00:09:47',
  ],
  deploy: (client, time) => [
    `&gt; Client: ${esc(client)}`,
    '&gt; Running SCOUT [Intel]...',
    '&gt; ATLAS [Build] → website generated',
    '&gt; PIXEL [Brand] → brand kit created',
    '&gt; WIRE [CRM] → pipeline live',
    '&gt; BOOK [Booking] → Calendly embedded',
    '&gt; SPARK [Content] → content written',
    '&gt; FORGE [QA] → all systems green',
    `&gt; ✓ Deploy complete. ${esc(time)}`,
  ],
  education: [
    '&gt; Problem: no website',
    '&gt; Competitors: 3 within 1 mile',
    '&gt; Monthly lost jobs: ~8',
    '&gt; Avg job value: £350',
    '&gt; Annual missed revenue: £33,600',
    '&gt; FORGE solution: Package 1',
    '&gt; Cost: £74.99 (one-time)',
    '&gt; Time to live: under 10 minutes',
    '&gt; ✓ ROI: first job covers it.',
  ],
  offer: [
    '&gt; Package 1 — Launch   £74.99',
    '&gt; Package 2 — Brand    £149.99',
    '&gt; Package 3 — Convert  £299.99',
    '&gt; Package 4 — Book     £499.99',
    '',
    '&gt; No monthly fees.',
    '&gt; No contracts.',
    '&gt; One payment.',
    '&gt; ✓ Live today.',
  ],
};

const CONTENT = {
  origin:    { title: 'We built it on ourselves first.',  sub: 'Website · Brand · CRM · Booking · Social · AI Video' },
  deploy:    { title: 'Live in under 10 minutes.',        sub: 'Website · Brand · CRM · Booking · Social · AI Video' },
  education: { title: '£33,600 a year. Missed.',          sub: 'The real cost of having no website in London.' },
  offer:     { title: 'Everything your business needs.',  sub: 'One payment. No contracts. Live today.' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function termLines(lines) {
  return lines.map((line, i) => {
    const y = 290 + i * 52;
    return `<text x="44" y="${y}" font-family="monospace" font-size="22" fill="${C.blue}" xml:space="preserve">${line}</text>`;
  }).join('\n');
}

function buildSVG({ lines, title, sub }) {
  // Split title at first period or newline to wrap
  const words = title.split(' ');
  // Simple two-line wrap: split roughly in half
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
  <defs>
    <style>
      text { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }
      .mono { font-family: 'Courier New', Courier, monospace; }
    </style>
  </defs>

  <!-- Canvas -->
  <rect width="1080" height="1080" fill="${C.canvas}"/>

  <!-- ── LEFT: Terminal panel ── -->
  <!-- Panel background -->
  <rect x="40" y="40" width="490" height="1000" rx="10" fill="${C.panel}" stroke="${C.border}" stroke-width="1"/>

  <!-- Title bar -->
  <rect x="40" y="40" width="490" height="44" rx="10" fill="${C.bar}"/>
  <rect x="40" y="64" width="490" height="20" fill="${C.bar}"/>
  <line x1="40" y1="84" x2="530" y2="84" stroke="${C.border}" stroke-width="1"/>

  <!-- Traffic lights -->
  <circle cx="72"  cy="62" r="7" fill="#FF5F57"/>
  <circle cx="94"  cy="62" r="7" fill="#FEBC2E"/>
  <circle cx="116" cy="62" r="7" fill="#28C840"/>

  <!-- Title bar label -->
  <text x="285" y="67" text-anchor="middle" class="mono" font-size="14" fill="${C.muted}">forge-deploy</text>

  <!-- Terminal content -->
  ${termLines(lines)}

  <!-- LIVE badge -->
  <rect x="54" y="988" width="90" height="30" rx="15" fill="#0A0A0A" stroke="${C.border}" stroke-width="1"/>
  <circle cx="76" cy="1003" r="5" fill="${C.green}"/>
  <text x="88" y="1008" class="mono" font-size="13" fill="${C.muted}" letter-spacing="2">LIVE</text>

  <!-- ── RIGHT: Brand + headline ── -->
  <!-- Right panel -->
  <rect x="550" y="0" width="530" height="1080" fill="${C.right}"/>

  <!-- Logo box -->
  <rect x="600" y="60" width="64" height="64" rx="10" fill="${C.panel}" stroke="${C.border}" stroke-width="1"/>
  <text x="632" y="108" text-anchor="middle" font-size="42" font-weight="700" fill="${C.blue}">F</text>

  <!-- FORGE wordmark -->
  <text x="678" y="90" font-size="28" font-weight="700" fill="${C.white}" letter-spacing="2">FORGE</text>
  <text x="678" y="114" font-size="13" font-weight="500" fill="${C.blue}" letter-spacing="4">AGENTIC MARKETING</text>

  <!-- Headline -->
  <text x="600" y="480" font-size="76" font-weight="700" fill="${C.white}" letter-spacing="-2">${esc(line1)}</text>
  <text x="600" y="570" font-size="76" font-weight="700" fill="${C.white}" letter-spacing="-2">${esc(line2)}</text>

  <!-- Subtext -->
  <text x="600" y="630" font-size="20" fill="${C.muted}" letter-spacing="0.3">${esc(sub)}</text>

  <!-- URL pill -->
  <rect x="600" y="960" width="310" height="50" rx="25" fill="#0A0A0A" stroke="${C.blue}" stroke-width="1.5"/>
  <circle cx="628" cy="985" r="5" fill="${C.blue}"/>
  <text x="644" y="991" class="mono" font-size="18" fill="${C.white}">forgeisagentic.tech</text>

</svg>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  try {
    const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
    const type        = searchParams.get('type')   || 'origin';
    const client      = searchParams.get('client') || 'Client';
    const time        = searchParams.get('time')   || '00:09:47';
    const customTitle = searchParams.get('title');
    const customSub   = searchParams.get('sub')    || '';

    const lines   = type === 'deploy'
      ? LINES.deploy(client, time)
      : (LINES[type] || LINES.origin);

    const content = customTitle
      ? { title: customTitle, sub: customSub }
      : (CONTENT[type] || CONTENT.origin);

    const svg = buildSVG({ lines, title: content.title, sub: content.sub });
    const png = await sharp(Buffer.from(svg)).png().toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Length', png.length);
    res.status(200).end(png);
  } catch (err) {
    console.error('OG generation error:', err);
    res.status(500).json({ error: 'Image generation failed', detail: err.message });
  }
}
