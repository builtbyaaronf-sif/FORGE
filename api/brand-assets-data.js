/**
 * FORGE Brand Assets Data
 * GET  /api/brand-assets-data?slug=...&token=...  — load asset pack
 * POST /api/brand-assets-data                     — submit feedback, receive reward
 *
 * POST body: { slug, token, score, impressed, improve }
 * POST response: { success, reward: { post } }   (Google Business post copy)
 */

import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 30 };

// ── Shared token validation ───────────────────────────────────────────────────
async function validateToken(slug, token) {
  const storedSlug = await kv.get(`brand_token:${token}`);
  return storedSlug && storedSlug === slug;
}

// ── Google Business post generator ───────────────────────────────────────────
async function generateGBPost(record) {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Write a Google Business post for a ${record.trade} business called "${record.name}" based in London.

Rules:
- Maximum 150 words
- Punchy, local, professional
- Ends with a clear call to action (call or message for a free quote)
- No hashtags
- No hyphens or dashes
- Write in first person as the business owner
- Mention London or a specific area if it fits naturally

Return only the post text, nothing else.`
    }]
  });
  return msg.content[0].text.trim();
}

// ── GET handler ──────────────────────────────────────────────────────────────
async function handleGet(req, res) {
  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const slug  = searchParams.get('slug');
  const token = searchParams.get('token');

  if (!slug || !token) {
    return res.status(400).json({ error: 'Missing slug or token' });
  }

  const valid = await validateToken(slug, token);
  if (!valid) {
    return res.status(403).json({ error: 'Invalid or expired link' });
  }

  const record = await kv.get(`logo:${slug}`);
  if (!record) {
    return res.status(404).json({ error: 'Brand assets not found for this business' });
  }

  const { token: _tok, ...safeRecord } = record;
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json({ success: true, data: safeRecord });
}

// ── POST handler ─────────────────────────────────────────────────────────────
async function handlePost(req, res) {
  const { slug, token, score, impressed, improve } = req.body || {};

  if (!slug || !token) {
    return res.status(400).json({ error: 'Missing slug or token' });
  }

  const valid = await validateToken(slug, token);
  if (!valid) {
    return res.status(403).json({ error: 'Invalid or expired link' });
  }

  const record = await kv.get(`logo:${slug}`);
  if (!record) {
    return res.status(404).json({ error: 'No record found' });
  }

  // Check for duplicate submission
  const existing = await kv.get(`feedback:${slug}`);
  if (existing) {
    // Still return reward — don't penalise double-submit
    return res.status(200).json({ success: true, reward: { post: existing.post } });
  }

  // Generate Google Business post reward
  const post = await generateGBPost(record);

  // Store feedback
  const feedback = {
    slug,
    score: Number(score) || null,
    impressed: String(impressed || '').slice(0, 500),
    improve:   String(improve  || '').slice(0, 500),
    post,
    submittedAt: new Date().toISOString(),
  };
  await kv.set(`feedback:${slug}`, feedback, { ex: 7776000 }); // 90 days

  // Email Aaron
  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'FORGE <growth@forgeisagentic.tech>',
        to:   [process.env.NOTIFY_EMAIL || 'builtbyaaronf@gmail.com'],
        subject: `FEEDBACK: ${record.name} scored ${score}/10`,
        html: `
<div style="background:#090909;color:#fff;font-family:sans-serif;padding:32px;max-width:600px">
  <div style="color:#0099FF;font-size:20px;font-weight:900;letter-spacing:2px;margin-bottom:4px">FORGE</div>
  <div style="color:#888;font-size:11px;letter-spacing:3px;margin-bottom:28px">CLIENT FEEDBACK</div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="color:#555;padding:6px 0;width:140px">Business</td><td style="color:#fff;font-weight:700">${record.name}</td></tr>
    <tr><td style="color:#555;padding:6px 0">Satisfaction</td><td style="color:#0099FF;font-weight:900;font-size:24px">${score}/10</td></tr>
    <tr><td style="color:#555;padding:6px 0;vertical-align:top">Most impressed by</td><td style="color:#fff">${impressed || 'not answered'}</td></tr>
    <tr><td style="color:#555;padding:6px 0;vertical-align:top">Would improve</td><td style="color:#fff">${improve || 'not answered'}</td></tr>
    <tr><td style="color:#555;padding:6px 0">Submitted</td><td style="color:#fff">${feedback.submittedAt}</td></tr>
  </table>

  <div style="background:#0D1A2A;border-left:3px solid #0099FF;padding:16px;border-radius:0 8px 8px 0">
    <div style="color:#0099FF;font-size:11px;letter-spacing:2px;margin-bottom:8px">GOOGLE BUSINESS POST GENERATED</div>
    <div style="color:#ccc;font-size:14px;line-height:1.6">${post}</div>
  </div>
</div>`,
      }),
    }).catch(e => console.error('Feedback email error:', e.message));
  }

  return res.status(200).json({ success: true, reward: { post } });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET')  return await handleGet(req, res);
    if (req.method === 'POST') return await handlePost(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Brand assets data error:', err);
    return res.status(500).json({ error: 'Request failed', detail: err.message });
  }
}
