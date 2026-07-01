import { createClient } from '@vercel/kv';
import crypto from 'crypto';

// BEACON — step 2 of magic-link auth. Exchanges a single-use magic token
// (from the emailed link) for a longer-lived session token. The magic token
// is deleted on first use — replaying the same link a second time fails,
// which is the point.

const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

const SESSION_TTL_SECONDS = 48 * 60 * 60; // 48h, matches the window documented in ledger-mark-paid.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!kv) return res.status(500).json({ error: 'Not configured' });

  const token = String((req.body || {}).token || '').trim();
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const raw = await kv.get(`beacon_magic:${token}`);
  if (!raw) {
    return res.status(401).json({ error: 'Link expired or already used — request a new one' });
  }

  // Delete immediately, before doing anything else. NOTE: this is a
  // get-then-delete, not an atomic get-and-delete — two truly simultaneous
  // requests with the same token could both read it before either deletes
  // it, both getting a valid session. Low severity (magic links are
  // single-click, the race window is milliseconds) but not airtight. If
  // @vercel/kv's SDK exposes an atomic GETDEL in a future version, switch
  // to it.
  await kv.del(`beacon_magic:${token}`);

  const { clientSlug } = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const sessionToken = crypto.randomBytes(32).toString('hex');
  await kv.set(`beacon_session:${sessionToken}`, clientSlug, { ex: SESSION_TTL_SECONDS });

  return res.status(200).json({ sessionToken, clientSlug, expiresInHours: 48 });
}
