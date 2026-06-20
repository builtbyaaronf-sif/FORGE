/**
 * FORGE Logo Generator — v2 Spark Burst
 * GET /api/logo-gen?name=...&trade=...&color=...&style=A&bg=dark&format=default&icon=spark-full
 *
 * Styles:
 *   A      Badge + Wordmark  (spark mark on left, wordmark right)
 *   B      Stacked Mark      (spark mark above, wordmark below)
 *   C      Bold Wordmark     (giant name, no mark, accent bars)
 *   ICON   Standalone icon   (wizard step 2 preview — no wordmark)
 *
 * Icon variants (3 genuinely different compositions — wizard step 2):
 *   spark-full     12 lines balanced burst  — cardinal + off-axis equal weight
 *   spark-cross    12 lines cross-dominant  — cardinals 2x longer, structured
 *   spark-minimal   8 lines diamond burst   — 4 cardinal + 4 diagonal only
 *
 * Formats:
 *   default     900x280   Wordmark preview (A / C)
 *   default_sq  500x500   Stacked / icon preview (B / ICON)
 *   pfp         1080x1080
 *   pfp_gb      720x720
 *   cover_fb    851x315
 *   cover_li    1584x396
 *   cover_gb    1080x608
 *   email_sig   600x180
 *   wordmark    1200x400
 *   favicon     512x512
 */

import { Resvg } from '@resvg/resvg-js';
import { kv } from '@vercel/kv';
import path from 'path';
import { fileURLToPath } from 'url';

// Extend timeout to allow KV lookup + icon fetch for slug-based requests
export const config = { maxDuration: 30 };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESVG_OPTS = {
  font: {
    fontFiles: [
      path.join(__dirname, 'fonts/font-regular.ttf'),
      path.join(__dirname, 'fonts/font-bold.ttf'),
    ],
    loadSystemFonts: false,
    defaultFontFamily: 'DejaVu Sans',
  },
};

const FF = '"DejaVu Sans"';

const FORMATS = {
  default:    { w: 900,  h: 280  },
  default_sq: { w: 500,  h: 500  },
  pfp:        { w: 1080, h: 1080 },
  pfp_gb:     { w: 720,  h: 720  },
  cover_fb:   { w: 851,  h: 315  },
  cover_li:   { w: 1584, h: 396  },
  cover_gb:   { w: 1080, h: 608  },
  email_sig:  { w: 600,  h: 180  },
  wordmark:   { w: 1200, h: 400  },
  favicon:    { w: 512,  h: 512  },
};

const SQUARE_FORMATS = new Set(['pfp', 'pfp_gb', 'favicon', 'default_sq']);
const BANNER_FORMATS = new Set(['cover_fb', 'cover_li', 'cover_gb']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tradeLabel(trade) {
  const t = String(trade || '').toLowerCase().trim();
  if (t.includes('plumb'))                              return 'PLUMBING SERVICES';
  if (t.includes('electr'))                             return 'ELECTRICAL SERVICES';
  if (t.includes('build') || t.includes('construct'))  return 'BUILDING &amp; CONSTRUCTION';
  if (t.includes('roof'))                               return 'ROOFING SERVICES';
  if (t.includes('paint') || t.includes('decor'))      return 'PAINTING &amp; DECORATING';
  if (t.includes('landscape') || t.includes('garden')) return 'LANDSCAPING SERVICES';
  if (t.includes('clean'))                              return 'CLEANING SERVICES';
  if (t.includes('carpen') || t.includes('joiner'))    return 'CARPENTRY &amp; JOINERY';
  if (t.includes('heat') || t.includes('boiler'))      return 'HEATING &amp; BOILER SERVICES';
  if (t.includes('tile') || t.includes('tiling'))      return 'TILING SERVICES';
  if (t.includes('gas'))                                return 'GAS &amp; HEATING SERVICES';
  if (t.includes('agenc') || t.includes('market'))     return 'AGENTIC MARKETING';
  if (t.length > 0) return (t.charAt(0).toUpperCase() + t.slice(1)).toUpperCase() + ' SERVICES';
  return 'PROFESSIONAL SERVICES';
}

function themes(bg) {
  const dark = bg !== 'light';
  return {
    canvas: dark ? '#0A0A0A' : '#FFFFFF',
    text:   dark ? '#FFFFFF' : '#111111',
    muted:  dark ? '#888888' : '#666666',
  };
}

function nameFontSize(name, maxPx, maxPt, minPt = 28) {
  let size = maxPt;
  while (size > minPt && name.length * size * 0.58 > maxPx) size -= 2;
  return size;
}

// ── Color utilities ───────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');
}

function lightenColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function darkenColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

// ── The Spark Burst — FORGE's premium line mark ───────────────────────────────
//
// Lines radiate from a centre node at equal angular intervals.
// Two-tone rendering: inner portion in a deep shade, outer portion in bright
// brand colour, square dots at every tip. Sharp linecap="butt" throughout.
//
// size = burst diameter (tip-to-tip on the cardinal axis), so rLong = size / 2.
//
// Variants:
//   full     12 lines at 30° — cardinal and off-axis arms at close visual weight
//   cross    12 lines at 30° — cardinals 2× longer, off-axis short → cross shape
//   minimal   8 lines at 45° — 4 cardinal + 4 diagonal → clean diamond silhouette

function sparkMark(cx, cy, size, color, variant = 'full') {
  const rLong  = size * 0.50;
  const rShort = size * 0.365;

  const angles = variant === 'minimal'
    ? [0, 45, 90, 135, 180, 225, 270, 315]
    : [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  const cardinals = new Set([0, 90, 180, 270]);

  function lineLen(angle) {
    if (variant === 'cross')   return cardinals.has(angle) ? rLong : rLong * 0.50;
    if (variant === 'minimal') return cardinals.has(angle) ? rLong : rLong * 0.76;
    return cardinals.has(angle) ? rLong : rShort;
  }

  const darkLine    = darkenColor(color, 0.52);
  const brightLine  = lightenColor(color, 0.42);
  const tipColor    = lightenColor(color, 0.54);
  const centerColor = darkenColor(color, 0.62);

  const strokeW    = Math.max(1.5, size * 0.022);
  const tipHalf    = Math.max(3, size * 0.028);
  const centerHalf = Math.max(4, size * 0.034);

  let lines = '';
  let dots  = '';

  for (const angle of angles) {
    const r   = lineLen(angle);
    const rad = (angle * Math.PI) / 180;
    const tx  = +(cx + r * Math.cos(rad)).toFixed(2);
    const ty  = +(cy + r * Math.sin(rad)).toFixed(2);
    const mx  = +(cx + r * 0.46 * Math.cos(rad)).toFixed(2);
    const my  = +(cy + r * 0.46 * Math.sin(rad)).toFixed(2);
    const sw  = strokeW.toFixed(1);
    const cxf = cx.toFixed(2);
    const cyf = cy.toFixed(2);

    // Dark base (full length) then bright overlay on outer 54%
    lines += `<line x1="${cxf}" y1="${cyf}" x2="${tx}" y2="${ty}" stroke="${darkLine}" stroke-width="${sw}" stroke-linecap="butt"/>`;
    lines += `<line x1="${mx}" y1="${my}" x2="${tx}" y2="${ty}" stroke="${brightLine}" stroke-width="${sw}" stroke-linecap="butt"/>`;

    // Square tip dot — cardinal tips slightly larger
    const th = +(tipHalf * (cardinals.has(angle) ? 1.0 : 0.80)).toFixed(2);
    dots += `<rect x="${(tx - th).toFixed(2)}" y="${(ty - th).toFixed(2)}" width="${(th * 2).toFixed(2)}" height="${(th * 2).toFixed(2)}" fill="${tipColor}"/>`;
  }

  // Centre square node
  const ch = centerHalf.toFixed(2);
  dots += `<rect x="${(cx - centerHalf).toFixed(2)}" y="${(cy - centerHalf).toFixed(2)}" width="${(centerHalf * 2).toFixed(2)}" height="${(centerHalf * 2).toFixed(2)}" fill="${centerColor}"/>`;

  return { gradDef: '', elements: lines + dots };
}

// Map icon param → sparkMark variant string
function iconToVariant(icon) {
  if (icon === 'spark-cross')   return 'cross';
  if (icon === 'spark-minimal') return 'minimal';
  return 'full';
}

// ── Standalone icon renderers (wizard step 2, circle container) ───────────────

function svgSparkFull(color, bg, w, h) {
  const { canvas } = themes(bg);
  const bgInner    = darkenColor(color, 0.90);
  const { elements } = sparkMark(250, 250, 320, color, 'full');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${canvas}"/>
  <circle cx="250" cy="250" r="228" fill="${color}" opacity="0.07"/>
  <circle cx="250" cy="250" r="214" fill="${bgInner}"/>
  <circle cx="250" cy="250" r="214" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.22"/>
  ${elements}
</svg>`;
}

function svgSparkCross(color, bg, w, h) {
  const { canvas } = themes(bg);
  const bgInner    = darkenColor(color, 0.90);
  const { elements } = sparkMark(250, 250, 320, color, 'cross');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${canvas}"/>
  <circle cx="250" cy="250" r="228" fill="${color}" opacity="0.07"/>
  <circle cx="250" cy="250" r="214" fill="${bgInner}"/>
  <circle cx="250" cy="250" r="214" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.22"/>
  ${elements}
</svg>`;
}

function svgSparkMinimal(color, bg, w, h) {
  const { canvas } = themes(bg);
  const bgInner    = darkenColor(color, 0.90);
  const { elements } = sparkMark(250, 250, 320, color, 'minimal');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${canvas}"/>
  <circle cx="250" cy="250" r="228" fill="${color}" opacity="0.07"/>
  <circle cx="250" cy="250" r="214" fill="${bgInner}"/>
  <circle cx="250" cy="250" r="214" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.22"/>
  ${elements}
</svg>`;
}

// ── Style A: Badge + Wordmark ─────────────────────────────────────────────────

function svgA(name, trade, color, bg, w, h, variant = 'full', iconDataUri = null) {
  const { canvas, text, muted } = themes(bg);
  const label    = tradeLabel(trade);
  const fontSize = nameFontSize(name, 590, 54, 28);
  const bgInner  = darkenColor(color, 0.90);

  // Badge: use AI icon image if available, otherwise draw SVG spark
  const badgeDefs = iconDataUri ? `<defs>
    <clipPath id="badge-clip">
      <rect x="24" y="24" width="228" height="228" rx="22"/>
    </clipPath>
  </defs>` : '';

  const badge = iconDataUri
    ? `<image x="24" y="24" width="228" height="228" href="${iconDataUri}" clip-path="url(#badge-clip)" preserveAspectRatio="xMidYMid meet"/>`
    : (() => { const { elements } = sparkMark(138, 140, 190, color, variant); return `<rect x="24" y="24" width="228" height="228" rx="22" fill="${bgInner}"/>${elements}`; })();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 900 280">
  <rect width="900" height="280" fill="${canvas}"/>
  ${badgeDefs}
  <rect x="18" y="18" width="240" height="240" rx="26" fill="${color}" opacity="0.07"/>
  ${badge}
  <rect x="24" y="24" width="228" height="228" rx="22" fill="none" stroke="${color}" stroke-width="1" opacity="0.2"/>
  <text x="278" y="${108 + fontSize * 0.6}"
    font-family=${FF} font-size="${fontSize}" font-weight="bold"
    fill="${text}">${esc(name)}</text>
  <rect x="278" y="${116 + fontSize * 0.7}" width="64" height="3.5" rx="1.75" fill="${color}"/>
  <text x="278" y="${148 + fontSize * 0.7}"
    font-family=${FF} font-size="20" font-weight="normal" letter-spacing="4"
    fill="${muted}">${label}</text>
</svg>`;
}

// ── Style B: Stacked Mark ─────────────────────────────────────────────────────

function svgB(name, trade, color, bg, w, h, variant = 'full', iconDataUri = null) {
  const { canvas, text, muted } = themes(bg);
  const label    = tradeLabel(trade);
  const fontSize = nameFontSize(name, 420, 42, 24);
  const bgInner  = darkenColor(color, 0.90);

  const circleDefs = iconDataUri ? `<defs>
    <clipPath id="circle-clip">
      <circle cx="250" cy="170" r="128"/>
    </clipPath>
  </defs>` : '';

  const mark = iconDataUri
    ? `<image x="122" y="42" width="256" height="256" href="${iconDataUri}" clip-path="url(#circle-clip)" preserveAspectRatio="xMidYMid meet"/>`
    : (() => { const { elements } = sparkMark(250, 170, 230, color, variant); return `<circle cx="250" cy="170" r="128" fill="${bgInner}"/>${elements}`; })();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${canvas}"/>
  ${circleDefs}
  <circle cx="250" cy="170" r="138" fill="${color}" opacity="0.07"/>
  ${mark}
  <circle cx="250" cy="170" r="128" fill="none" stroke="${color}" stroke-width="1" opacity="0.2"/>
  <text x="250" y="${340 + fontSize * 0.6}"
    text-anchor="middle"
    font-family=${FF} font-size="${fontSize}" font-weight="bold"
    fill="${text}">${esc(name)}</text>
  <rect x="${250 - 32}" y="${348 + fontSize * 0.7}" width="64" height="3" rx="1.5" fill="${color}"/>
  <text x="250" y="${378 + fontSize * 0.7}"
    text-anchor="middle"
    font-family=${FF} font-size="14" font-weight="normal" letter-spacing="3"
    fill="${muted}">${label}</text>
</svg>`;
}

// ── Square / PFP ──────────────────────────────────────────────────────────────

// AI icon rendered full-bleed in a square canvas — used for pfp, favicon, etc.
function svgAiIconSquare(color, bg, w, h, iconDataUri) {
  const { canvas } = themes(bg);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${canvas}"/>
  <image href="${iconDataUri}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
}

function svgSquare(name, trade, color, bg, w, h, variant = 'full') {
  const { canvas } = themes(bg);
  const bgInner   = darkenColor(color, 0.90);
  const { elements } = sparkMark(250, 250, 310, color, variant);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${canvas}"/>
  <circle cx="250" cy="250" r="228" fill="${color}" opacity="0.07"/>
  <circle cx="250" cy="250" r="214" fill="${bgInner}"/>
  <circle cx="250" cy="250" r="214" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.22"/>
  ${elements}
</svg>`;
}

// ── Style C: Bold Wordmark ────────────────────────────────────────────────────

function svgC(name, trade, color, bg, w, h) {
  const { canvas, text, muted } = themes(bg);
  const label    = tradeLabel(trade);
  const fontSize = nameFontSize(name, 820, 82, 36);
  const nameY    = 120 + fontSize * 0.5;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 900 280">
  <rect width="900" height="280" fill="${canvas}"/>
  <text x="40" y="${nameY}"
    font-family=${FF} font-size="${fontSize}" font-weight="bold"
    fill="${text}">${esc(name)}</text>
  <rect x="40" y="${nameY + 12}" width="180" height="5" rx="2.5" fill="${color}"/>
  <text x="40" y="${nameY + 52}"
    font-family=${FF} font-size="19" font-weight="normal" letter-spacing="6"
    fill="${muted}">${label}</text>
  <rect x="852" y="60"  width="12" height="60" rx="6" fill="${color}"/>
  <rect x="852" y="130" width="12" height="40" rx="6" fill="${color}" opacity="0.45"/>
  <rect x="852" y="180" width="12" height="24" rx="6" fill="${color}" opacity="0.20"/>
</svg>`;
}

// ── Banner ────────────────────────────────────────────────────────────────────

function svgBanner(name, trade, color, bg, w, h) {
  const { canvas, text, muted } = themes(bg);
  const label    = tradeLabel(trade);
  const fontSize = nameFontSize(name, w * 0.87, Math.round(h * 0.24), Math.round(h * 0.10));
  const midY     = h / 2;
  const labelSize = Math.max(12, Math.round(h * 0.06));
  const underlineW = Math.round(w * 0.126);
  const underlineX = Math.round((w - underlineW) / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${canvas}"/>
  <rect x="0" y="0" width="10" height="${h}" fill="${color}"/>
  <rect x="10" y="0" width="${w - 10}" height="3" fill="${color}" opacity="0.35"/>
  <rect x="10" y="${h - 3}" width="${w - 10}" height="3" fill="${color}" opacity="0.35"/>
  <text x="${w / 2}" y="${midY + fontSize * 0.37}"
    text-anchor="middle"
    font-family=${FF} font-size="${fontSize}" font-weight="bold"
    fill="${text}">${esc(name)}</text>
  <rect x="${underlineX}" y="${midY + fontSize * 0.52}" width="${underlineW}" height="4" rx="2" fill="${color}"/>
  <text x="${w / 2}" y="${midY + fontSize * 0.52 + labelSize + 8}"
    text-anchor="middle"
    font-family=${FF} font-size="${labelSize}" font-weight="normal" letter-spacing="6"
    fill="${muted}">${label}</text>
</svg>`;
}

// ── Wizard preview compositing (POST only) ───────────────────────────────────
// Three dedicated SVG builders that composite the AI icon into a lockup.
// Used exclusively by the POST handler — not by GET asset generation.

function previewHorizontal(name, trade, color, bg, iconDataUri) {
  const dark   = bg !== 'light';
  const canvas = dark ? '#0A0A0A' : '#FFFFFF';
  const text   = dark ? '#FFFFFF' : '#111111';
  const muted  = dark ? '#888888' : '#666666';
  const label  = tradeLabel(trade);
  let fs = 54;
  while (fs > 28 && name.length * fs * 0.58 > 590) fs -= 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="280" viewBox="0 0 900 280">
  <rect width="900" height="280" fill="${canvas}"/>
  <defs><clipPath id="bc"><rect x="24" y="24" width="228" height="228" rx="22"/></clipPath></defs>
  <rect x="18" y="18" width="240" height="240" rx="26" fill="${color}" opacity="0.07"/>
  <image x="24" y="24" width="228" height="228" href="${iconDataUri}" clip-path="url(#bc)" preserveAspectRatio="xMidYMid meet"/>
  <rect x="24" y="24" width="228" height="228" rx="22" fill="none" stroke="${color}" stroke-width="1" opacity="0.2"/>
  <text x="278" y="${108 + fs * 0.6}" font-family=${FF} font-size="${fs}" font-weight="bold" fill="${text}">${esc(name)}</text>
  <rect x="278" y="${116 + fs * 0.7}" width="64" height="3.5" rx="1.75" fill="${color}"/>
  <text x="278" y="${148 + fs * 0.7}" font-family=${FF} font-size="20" font-weight="normal" letter-spacing="4" fill="${muted}">${label}</text>
</svg>`;
}

function previewStacked(name, trade, color, bg, iconDataUri) {
  const dark   = bg !== 'light';
  const canvas = dark ? '#0A0A0A' : '#FFFFFF';
  const text   = dark ? '#FFFFFF' : '#111111';
  const muted  = dark ? '#888888' : '#666666';
  const label  = tradeLabel(trade);
  let fs = 42;
  while (fs > 24 && name.length * fs * 0.58 > 420) fs -= 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${canvas}"/>
  <defs><clipPath id="cc"><circle cx="250" cy="170" r="128"/></clipPath></defs>
  <circle cx="250" cy="170" r="138" fill="${color}" opacity="0.07"/>
  <image x="122" y="42" width="256" height="256" href="${iconDataUri}" clip-path="url(#cc)" preserveAspectRatio="xMidYMid meet"/>
  <circle cx="250" cy="170" r="128" fill="none" stroke="${color}" stroke-width="1" opacity="0.2"/>
  <text x="250" y="${340 + fs * 0.6}" text-anchor="middle" font-family=${FF} font-size="${fs}" font-weight="bold" fill="${text}">${esc(name)}</text>
  <rect x="${250 - 32}" y="${348 + fs * 0.7}" width="64" height="3" rx="1.5" fill="${color}"/>
  <text x="250" y="${378 + fs * 0.7}" text-anchor="middle" font-family=${FF} font-size="14" letter-spacing="3" fill="${muted}">${label}</text>
</svg>`;
}

function previewIconOnly(color, bg, iconDataUri) {
  const canvas = bg !== 'light' ? '#0A0A0A' : '#FFFFFF';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${canvas}"/>
  <defs><clipPath id="ic"><circle cx="250" cy="250" r="214"/></clipPath></defs>
  <circle cx="250" cy="250" r="228" fill="${color}" opacity="0.07"/>
  <image x="36" y="36" width="428" height="428" href="${iconDataUri}" clip-path="url(#ic)" preserveAspectRatio="xMidYMid meet"/>
  <circle cx="250" cy="250" r="214" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.22"/>
</svg>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  try {
    // ── POST: wizard lockup preview ──────────────────────────────────────────
    // Used by logo-wizard.html step 2. Receives icon as base64 in the body
    // (avoids URL length limits). Returns a fully composited PNG immediately
    // without any KV or CDN fetch — the icon bytes are in the request.
    if (req.method === 'POST') {
      const {
        name      = 'My Business',
        trade     = 'professional',
        color     = '0099FF',
        bg        = 'dark',
        layout    = 'horizontal',  // 'horizontal' | 'stacked' | 'icon-only'
        icon_url,                  // https CDN URL — server fetches it (keeps request body tiny)
      } = req.body || {};

      if (!icon_url) {
        return res.status(400).json({ error: 'icon_url required' });
      }

      // Fetch the AI icon server-side so the request body stays small
      const iconRes = await fetch(icon_url);
      if (!iconRes.ok) {
        return res.status(502).json({ error: `Icon fetch failed: ${iconRes.status}` });
      }
      const iconBuf  = await iconRes.arrayBuffer();
      const iconB64  = Buffer.from(iconBuf).toString('base64');
      const iconMime = iconRes.headers.get('content-type') || 'image/png';

      const cleanColor  = color.startsWith('#') ? color : `#${color}`;
      const iconDataUri = `data:${iconMime};base64,${iconB64}`;

      let svg;
      if (layout === 'stacked') {
        svg = previewStacked(name, trade, cleanColor, bg, iconDataUri);
      } else if (layout === 'icon-only') {
        svg = previewIconOnly(cleanColor, bg, iconDataUri);
      } else {
        svg = previewHorizontal(name, trade, cleanColor, bg, iconDataUri);
      }

      const resvg = new Resvg(svg, RESVG_OPTS);
      const png   = resvg.render().asPng();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).end(Buffer.from(png));
    }

    // ── GET: standard asset generation ──────────────────────────────────────
    const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
    const name   = searchParams.get('name')   || 'My Business';
    const trade  = searchParams.get('trade')  || 'professional';
    const rawCol = searchParams.get('color')  || '0099FF';
    const color  = rawCol.startsWith('#') ? rawCol : `#${rawCol}`;
    const style  = (searchParams.get('style') || 'A').toUpperCase();
    const bg     = searchParams.get('bg')     || 'dark';
    const icon   = searchParams.get('icon')   || 'spark-full';
    const slug   = searchParams.get('slug')   || null;

    const validIcons = new Set(['spark-full', 'spark-cross', 'spark-minimal']);
    const iconType   = validIcons.has(icon) ? icon : 'spark-full';
    const variant    = iconToVariant(iconType);

    const isIconOnly = style === 'ICON';
    const defaultFmt = (style === 'B' || isIconOnly) ? 'default_sq' : 'default';
    const format     = searchParams.get('format') || defaultFmt;

    const dims = FORMATS[format] || FORMATS.default;
    const { w, h } = dims;

    // If a slug is provided, look up the client's confirmed AI icon from KV
    // and embed it in the SVG so final delivery assets contain the real icon.
    let iconDataUri = null;
    if (slug && !isIconOnly) {
      try {
        const record = await kv.get(`logo:${slug}`);
        if (record?.icon_url && record.icon_url.startsWith('https://')) {
          const imgRes = await fetch(record.icon_url);
          if (imgRes.ok) {
            const buf  = await imgRes.arrayBuffer();
            const b64  = Buffer.from(buf).toString('base64');
            const mime = imgRes.headers.get('content-type') || 'image/png';
            iconDataUri = `data:${mime};base64,${b64}`;
          }
        }
      } catch (e) {
        // KV or fetch failure — fall back to SVG spark. Never break asset delivery.
        console.error('logo-gen icon lookup failed:', e.message);
      }
    }

    let svg;
    if (isIconOnly) {
      if (iconType === 'spark-cross')        svg = svgSparkCross(color, bg, w, h);
      else if (iconType === 'spark-minimal') svg = svgSparkMinimal(color, bg, w, h);
      else                                   svg = svgSparkFull(color, bg, w, h);
    } else if (SQUARE_FORMATS.has(format)) {
      // If we have the AI icon, render it full-bleed on a dark canvas.
      // Otherwise fall back to the SVG spark mark.
      if (iconDataUri) {
        svg = svgAiIconSquare(color, bg, w, h, iconDataUri);
      } else {
        svg = svgSquare(name, trade, color, bg, w, h, variant);
      }
    } else if (BANNER_FORMATS.has(format)) {
      svg = svgBanner(name, trade, color, bg, w, h);
    } else if (style === 'B') {
      svg = svgB(name, trade, color, bg, w, h, variant, iconDataUri);
    } else if (style === 'C') {
      svg = svgC(name, trade, color, bg, w, h);
    } else {
      svg = svgA(name, trade, color, bg, w, h, variant, iconDataUri);
    }

    const resvg = new Resvg(svg, RESVG_OPTS);
    const png   = resvg.render().asPng();

    // Slug-based requests fetch a live icon — don't cache aggressively
    const cacheControl = slug
      ? 'public, s-maxage=3600, stale-while-revalidate=86400'
      : 'public, s-maxage=86400, stale-while-revalidate=604800';

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', cacheControl);
    res.setHeader('Content-Length', png.length);
    res.status(200).end(Buffer.from(png));
  } catch (err) {
    console.error('Logo gen error:', err);
    res.status(500).json({ error: 'Logo generation failed', detail: err.message });
  }
}
