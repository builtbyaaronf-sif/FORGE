/**
 * FORGE Brand Assets ZIP
 * GET /api/brand-assets-zip?slug=...&token=...
 *
 * Validates token, fetches all 9 logo PNGs from logo-gen,
 * bundles into a ZIP named [slug]-brand-assets.zip and streams back.
 */

import { kv }  from '@vercel/kv';
import JSZip   from 'jszip';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
    const slug  = searchParams.get('slug');
    const token = searchParams.get('token');

    if (!slug || !token) {
      return res.status(400).json({ error: 'Missing slug or token' });
    }

    // Validate token
    const storedSlug = await kv.get(`brand_token:${token}`);
    if (!storedSlug || storedSlug !== slug) {
      return res.status(403).json({ error: 'Invalid or expired link' });
    }

    // Fetch logo record
    const record = await kv.get(`logo:${slug}`);
    if (!record || !record.assets) {
      return res.status(404).json({ error: 'Brand assets not found' });
    }

    // Fetch all PNGs concurrently
    const zip = new JSZip();
    const folder = zip.folder(`${slug}-brand-assets`);

    const fetches = record.assets.map(async (asset) => {
      try {
        const resp = await fetch(asset.url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${asset.key}`);
        const buf = await resp.arrayBuffer();
        folder.file(`${asset.key}.png`, buf);
      } catch (e) {
        console.warn(`ZIP: skipping ${asset.key}:`, e.message);
      }
    });

    await Promise.all(fetches);

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type:               'nodebuffer',
      compression:        'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = `${slug}-brand-assets.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).end(zipBuffer);

  } catch (err) {
    console.error('Brand assets ZIP error:', err);
    return res.status(500).json({ error: 'ZIP generation failed', detail: err.message });
  }
}
