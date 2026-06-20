/**
 * FORGE Logo Confirmation
 * POST /api/logo-confirm
 * Body: { slug, name, trade, color, style, icon, lockup, email, pkg }
 *
 * 1. Stores logo choice in Vercel KV (90 day TTL)
 * 2. Generates 9 named asset URLs with correct platform dimensions
 * 3. Creates a brand assets page token (magic link)
 * 4. Emails client a magic link to their brand assets page
 * 5. Notifies Aaron with chosen style + re-deploy instruction
 */

import { kv } from '@vercel/kv';

// ── Asset pack definition ─────────────────────────────────────────────────────
// format maps to FORMATS in logo-gen.js
// logo-gen.js automatically routes square formats (pfp, favicon) to the
// fork-circle renderer regardless of style. No override needed here.
const ASSETS = [
  {
    key:    'logo_dark',
    label:  'Primary Logo (Dark Background)',
    use:    'Website header, documents, presentations on dark backgrounds',
    format: 'wordmark',
    bg:     'dark',
  },
  {
    key:    'logo_light',
    label:  'Primary Logo (Light Background)',
    use:    'Invoices, quotes, printed materials, white backgrounds',
    format: 'wordmark',
    bg:     'light',
  },
  {
    key:    'pfp_instagram',
    label:  'Instagram Profile Picture',
    use:    'Upload as your Instagram profile photo',
    format: 'pfp',
    bg:     'dark',
  },
  {
    key:    'pfp_facebook',
    label:  'Facebook Profile Picture',
    use:    'Upload as your Facebook page profile photo',
    format: 'pfp',
    bg:     'dark',
  },
  {
    key:    'pfp_google_business',
    label:  'Google Business Profile Picture',
    use:    'Upload as your Google Business logo',
    format: 'pfp_gb',
    bg:     'dark',
  },
  {
    key:    'cover_facebook',
    label:  'Facebook Cover Photo',
    use:    'Upload directly as your Facebook page cover (851x315)',
    format: 'cover_fb',
    bg:     'dark',
  },
  {
    key:    'cover_linkedin',
    label:  'LinkedIn Cover Photo',
    use:    'Upload directly as your LinkedIn page cover (1584x396)',
    format: 'cover_li',
    bg:     'dark',
  },
  {
    key:    'email_signature',
    label:  'Email Signature Logo',
    use:    'Embed in your Gmail or Outlook email signature',
    format: 'email_sig',
    bg:     'dark',
  },
  {
    key:    'favicon',
    label:  'Favicon',
    use:    'Upload to your website as the browser tab icon',
    format: 'favicon',
    bg:     'dark',
  },
];

// Square formats (pfp, favicon) use the AI-generated icon image directly.
// All other formats (wordmark, covers, email sig) use logo-gen.js SVG renderer.
const SQUARE_FORMATS = new Set(['pfp', 'pfp_gb', 'favicon']);

function buildAssetUrl(base, { name, trade, color, style, icon, slug }, asset) {
  // All formats route through logo-gen with the slug parameter.
  // logo-gen does the KV lookup to fetch the AI icon — no fal.ai CDN URLs
  // which expire. Square formats now use svgAiIconSquare in logo-gen.
  const enc = encodeURIComponent;
  let url = `${base}?name=${enc(name)}&trade=${enc(trade)}&color=${enc(color)}&style=${enc(style)}&bg=${asset.bg}&format=${asset.format}`;
  if (icon) url += `&icon=${enc(icon)}`;
  if (slug) url += `&slug=${enc(slug)}`;
  return url;
}

function randomToken() {
  return Array.from({ length: 3 }, () =>
    Math.random().toString(36).slice(2, 6)
  ).join('-');
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug, name, trade, color, style, icon, icon_url, lockup, email, pkg } = req.body || {};

    if (!slug || !name || !style) {
      return res.status(400).json({ error: 'Missing required fields: slug, name, style' });
    }

    const validStyles = ['A', 'B', 'C'];
    const chosenStyle = style.toUpperCase();
    if (!validStyles.includes(chosenStyle)) {
      return res.status(400).json({ error: 'Invalid style. Must be A, B, or C.' });
    }

    // AI icon variants replace the old fork-* SVG icons.
    const validIcons = new Set(['spark-burst', 'spark-cross', 'spark-minimal']);
    const chosenIcon    = icon && validIcons.has(icon) ? icon : (icon || null);
    const chosenIconUrl = icon_url && icon_url.startsWith('https://') ? icon_url : null;

    const validLockups = new Set(['horizontal', 'stacked', 'separate']);
    const chosenLockup = lockup && validLockups.has(lockup) ? lockup : 'horizontal';

    const confirmedAt = new Date().toISOString();
    const cleanColor  = String(color || '#0099FF').startsWith('#') ? color : `#${color}`;
    const cleanTrade  = trade || 'professional';

    // Build asset URL pack
    const base   = 'https://forgeisagentic.tech/api/logo-gen';
    const params = { name, trade: cleanTrade, color: cleanColor, style: chosenStyle, icon: chosenIcon, slug };

    const assets = ASSETS.map(a => ({
      key:    a.key,
      label:  a.label,
      use:    a.use,
      format: a.format,
      url:    buildAssetUrl(base, params, a),
    }));

    // Brand assets page token (magic link — 90 day TTL)
    const token = randomToken();

    const logoRecord = {
      slug,
      name,
      trade:       cleanTrade,
      color:       cleanColor,
      style:       chosenStyle,
      icon:        chosenIcon,
      icon_url:    chosenIconUrl,
      lockup:      chosenLockup,
      email:       email || '',
      pkg:         pkg   || '1',
      confirmedAt,
      token,
      assets,
    };

    // Store logo record (keyed by slug)
    await kv.set(`logo:${slug}`, logoRecord, { ex: 7776000 });
    // Store token → slug mapping for brand assets lookup
    await kv.set(`brand_token:${token}`, slug, { ex: 7776000 });

    const brandAssetsUrl = `https://forgeisagentic.tech/brand-assets.html?slug=${encodeURIComponent(slug)}&token=${token}`;

    // ── Email client: magic link ──────────────────────────────────────────────
    if (process.env.RESEND_API_KEY && email) {
      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    process.env.RESEND_FROM_EMAIL || 'FORGE <growth@forgeisagentic.tech>',
          to:      [email],
          subject: `Your brand assets are ready, ${name.split(' ')[0]}`,
          html: `
<div style="background:#090909;color:#fff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:0;margin:0">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px">

    <!-- Header -->
    <div style="margin-bottom:40px">
      <div style="color:#0099FF;font-size:22px;font-weight:900;letter-spacing:3px">FORGE</div>
      <div style="color:#444;font-size:11px;letter-spacing:3px;margin-top:4px">AGENTIC MARKETING</div>
    </div>

    <!-- Heading -->
    <h1 style="font-size:28px;font-weight:900;margin:0 0 8px 0;line-height:1.2">
      Your brand assets are ready.
    </h1>
    <p style="color:#888;font-size:15px;margin:0 0 36px 0">
      9 files. Every platform. Ready to use today.
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:40px">
      <a href="${brandAssetsUrl}"
         style="display:inline-block;background:#0099FF;color:#fff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:17px;letter-spacing:0.5px">
        View your brand assets
      </a>
      <p style="color:#555;font-size:12px;margin-top:12px">
        This link is unique to your business. Bookmark it.
      </p>
    </div>

    <!-- What's included -->
    <div style="background:#111;border-radius:10px;padding:24px;margin-bottom:36px">
      <div style="color:#888;font-size:11px;letter-spacing:3px;margin-bottom:16px">WHAT YOU HAVE</div>
      <table style="width:100%;border-collapse:collapse">
        ${ASSETS.map(a => `
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid #1a1a1a;font-size:13px;color:#fff;font-weight:600">${a.label}</td>
          <td style="padding:6px 0;border-bottom:1px solid #1a1a1a;font-size:12px;color:#555;text-align:right">${a.use}</td>
        </tr>`).join('')}
      </table>
    </div>

    <!-- Footer -->
    <p style="color:#333;font-size:12px;margin:0">
      Your build is in progress. You'll receive a second email when your website goes live.
      Questions? Reply to this email or contact <a href="mailto:growth@forgeisagentic.tech" style="color:#0099FF">growth@forgeisagentic.tech</a>
    </p>

  </div>
</div>`,
        }),
      });
    }

    // ── Notify Aaron ──────────────────────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    process.env.RESEND_FROM_EMAIL || 'FORGE <growth@forgeisagentic.tech>',
          to:      [process.env.NOTIFY_EMAIL || 'builtbyaaronf@gmail.com'],
          subject: `LOGO CONFIRMED: ${name} chose Style ${chosenStyle}`,
          html: `
<div style="background:#090909;color:#fff;font-family:sans-serif;padding:32px;max-width:600px">
  <div style="color:#0099FF;font-size:20px;font-weight:900;letter-spacing:2px;margin-bottom:4px">FORGE</div>
  <div style="color:#888;font-size:11px;letter-spacing:3px;margin-bottom:28px">LOGO CONFIRMED</div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="color:#555;padding:5px 0;width:120px">Business</td>    <td style="color:#fff;font-weight:700">${name}</td></tr>
    <tr><td style="color:#555;padding:5px 0">Style</td>        <td style="color:#0099FF;font-weight:900;font-size:20px">Style ${chosenStyle}</td></tr>
    <tr><td style="color:#555;padding:5px 0">Icon</td>         <td style="color:#fff">${chosenIcon || 'none'}</td></tr>
    ${chosenIconUrl ? `<tr><td style="color:#555;padding:5px 0">Icon URL</td><td><a href="${chosenIconUrl}" style="color:#0099FF;font-size:12px">View AI icon</a></td></tr>` : ''}
    <tr><td style="color:#555;padding:5px 0">Lockup</td>       <td style="color:#fff">${chosenLockup}</td></tr>
    <tr><td style="color:#555;padding:5px 0">Slug</td>         <td style="color:#fff;font-family:monospace;font-size:13px">${slug}</td></tr>
    <tr><td style="color:#555;padding:5px 0">Package</td>      <td style="color:#fff">${pkg || '1'}</td></tr>
    <tr><td style="color:#555;padding:5px 0">Client email</td> <td style="color:#fff">${email || 'not provided'}</td></tr>
    <tr><td style="color:#555;padding:5px 0">Confirmed</td>    <td style="color:#fff">${confirmedAt}</td></tr>
  </table>

  <div style="background:#0D1A2A;border-left:3px solid #0099FF;padding:16px;border-radius:0 8px 8px 0;margin-bottom:20px">
    <div style="color:#0099FF;font-size:11px;letter-spacing:2px;margin-bottom:6px">NEXT STEP</div>
    <div style="color:#ccc;font-size:14px">Re-deploy <code style="background:#222;padding:2px 6px;border-radius:4px">forge-${slug}</code> with the chosen logo embedded in the header. Run <code style="background:#222;padding:2px 6px;border-radius:4px">vercel --prod</code>.</div>
  </div>

  <a href="${brandAssetsUrl}" style="color:#0099FF;font-size:13px">View client brand assets page</a>
</div>`,
        }),
      });
    }

    res.status(200).json({
      success:        true,
      message:        `Logo Style ${chosenStyle}${chosenIcon ? ` with ${chosenIcon} icon (${chosenLockup} lockup)` : ''} confirmed for ${name}.`,
      slug,
      confirmedAt,
      brandAssetsUrl,
      assets,
    });

  } catch (err) {
    console.error('Logo confirm error:', err);
    res.status(500).json({ error: 'Logo confirmation failed', detail: err.message });
  }
}
