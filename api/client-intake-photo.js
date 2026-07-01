import { put } from '@vercel/blob';

// Single-image upload endpoint for client-intake.html.
//
// WHY THIS EXISTS: the wizard originally batched all photos into one POST to
// api/client-intake.js as base64 JSON. Twelve photos at up to 5MB each is
// 60MB+ of payload — Vercel serverless functions cap request bodies well
// under that (4.5MB on Hobby, still a hard ceiling on Pro). That batched
// version would have 500'd on any real submission with more than one or two
// photos. This endpoint takes ONE already-compressed image per request
// (client-intake.html resizes to ~1600px / JPEG before calling this), so
// each request stays small regardless of how many photos the client adds.

const MAX_BYTES = 4 * 1024 * 1024; // raw bytes, post-decode — leaves headroom under Vercel's body limit even after base64's ~33% overhead on the way in

function dataUrlToBuffer(dataUrl) {
  const match = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return { buffer: Buffer.from(match[2], 'base64'), mime: match[1] };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[INTAKE-PHOTO] BLOB_READ_WRITE_TOKEN not configured');
      return res.status(500).json({ error: 'Image storage not configured — contact sales@forgeisagentic.tech' });
    }

    const { orderId, category, name, dataUrl } = req.body || {};
    if (!orderId || !dataUrl) {
      return res.status(400).json({ error: 'Missing orderId or image data' });
    }
    if (!['photos', 'logo', 'accreditations'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const parsed = dataUrlToBuffer(dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'Image could not be read — try a different file' });
    }
    if (parsed.buffer.length > MAX_BYTES) {
      // Should be rare — client compresses before calling this — but never trust the client alone.
      return res.status(413).json({ error: 'Image still too large after compression — try a smaller photo' });
    }

    const safeName = (name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `intake/${orderId}/${category}/${Date.now()}-${safeName}`;

    const blob = await put(key, parsed.buffer, {
      access: 'public',
      contentType: parsed.mime,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('[INTAKE-PHOTO] Upload failed:', err);
    return res.status(500).json({ error: 'Upload failed, please try again' });
  }
}
