import { createClient } from '@vercel/kv';
import crypto from 'crypto';

// BEACON — step 1 of magic-link auth. Client submits their email, we look up
// which client_slug that email belongs to (via KV, populated at deploy time —
// see beacon-dashboard SKILL.md), generate a single-use token, and email a
// link. No passwords, no accounts to manage.
//
// Rate limited hard (3/hour/IP) — this endpoint's only job is "send an email
// if you ask", which is exactly the kind of thing that gets abused for spam
// if left open.
//
// Env vars: KV_REST_API_URL, KV_REST_API_TOKEN, RESEND_API_KEY, RESEND_FROM_EMAIL

const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

const RL_WINDOW = 60 * 60 * 1000;
const RL_MAX = 3;
const rlMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rlMap.get(ip) || []).filter(t => now - t < RL_WINDOW);
  hits.push(now);
  rlMap.set(ip, hits);
  return hits.length > RL_MAX;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests, try again later' });

  if (!kv) return res.status(500).json({ error: 'Not configured' });

  const email = String((req.body || {}).email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  // Client -> email mapping is set up once per client at deploy time:
  // kv.set(`beacon_owner:${email}`, clientSlug). See beacon-dashboard/SKILL.md.
  const clientSlug = await kv.get(`beacon_owner:${email}`);

  // Deliberately vague response either way — don't leak whether an email is
  // registered. The email itself (or lack of one) is the real signal.
  if (clientSlug) {
    const token = crypto.randomBytes(24).toString('hex');
    await kv.set(`beacon_magic:${token}`, JSON.stringify({ email, clientSlug }), { ex: 15 * 60 }); // 15 min, single-use

    if (process.env.RESEND_API_KEY) {
      const link = `https://forgeisagentic.tech/beacon.html?token=${token}`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: [email],
          subject: 'Your dashboard link',
          html: `<p>Here's your dashboard link — it expires in 15 minutes and works once:</p><p><a href="${link}">${link}</a></p><p>Didn't request this? You can ignore this email.</p>`,
        }),
      }).catch(err => console.error('[BEACON] Magic link email failed:', err.message));
    }
  }

  return res.status(200).json({ sent: true });
}
