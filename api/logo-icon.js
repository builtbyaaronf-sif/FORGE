/**
 * FORGE Logo Icon — Dynamic brand icon for client website headers
 * GET /api/logo-icon?slug=dave-plumbing
 *
 * Looks up the client's confirmed logo choice from Vercel KV.
 * Redirects to logo-gen.js with the correct colour, style and icon params
 * so the website header always shows the client's actual brand icon.
 *
 * Before the client confirms their wizard choice, returns the FORGE default
 * spark in #0099FF — so the header looks good from day one.
 *
 * Zero cost: no AI calls. Just a KV lookup + redirect.
 * SVG scales perfectly at any size — ideal for nav headers.
 */

import { kv } from '@vercel/kv';

const DEFAULT_COLOR = '0099FF';
const DEFAULT_ICON  = 'spark-burst';
const DEFAULT_STYLE = 'A';
const LOGO_GEN_BASE = 'https://forgeisagentic.tech/api/logo-gen';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { slug } = req.query;

  let color = DEFAULT_COLOR;
  let icon  = DEFAULT_ICON;
  let style = DEFAULT_STYLE;

  // Look up client's confirmed logo choice in KV
  if (slug) {
    try {
      const record = await kv.get(`logo:${slug}`);
      if (record) {
        // Strip leading # from stored colour
        color = String(record.color || DEFAULT_COLOR).replace('#', '');
        icon  = record.icon  || DEFAULT_ICON;
        style = record.style || DEFAULT_STYLE;
      }
    } catch (err) {
      // KV failure → fall through to defaults. Never break the website.
      console.error(`logo-icon KV lookup failed for slug "${slug}":`, err.message);
    }
  }

  // Redirect to logo-gen for an SVG square icon.
  // format=pfp renders a 500×500 square — perfect for nav icons.
  // Cache for 1 hour; the redirect target is bust-cached if the slug changes.
  const iconUrl = `${LOGO_GEN_BASE}?color=%23${encodeURIComponent(color)}&style=${encodeURIComponent(style)}&icon=${encodeURIComponent(icon)}&format=pfp&bg=dark&name=`;

  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.redirect(302, iconUrl);
}
