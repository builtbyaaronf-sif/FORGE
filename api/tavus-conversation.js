/**
 * FORGE — Tavus CVI Conversation Creator (Rate-Limited)
 * Vercel Serverless Function: /api/tavus-conversation
 *
 * Creates a Tavus conversational video session for the post-payment
 * welcome agent. Called by build-status.html on page load.
 *
 * RATE LIMITING: 1 session per IP per 5 minutes (prevents abuse)
 *
 * ENV VARS REQUIRED (set in Vercel dashboard):
 *   TAVUS_API_KEY     — from app.tavus.io → API Keys
 *   TAVUS_REPLICA_ID  — from app.tavus.io → Replicas (your AI persona)
 *   TAVUS_PERSONA_ID  — optional, from app.tavus.io → Personas
 *   KV_REST_API_URL   — Vercel KV endpoint (for rate limiting)
 *   KV_REST_API_TOKEN — Vercel KV token (for rate limiting)
 */

import { createClient } from '@vercel/kv';

const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

async function checkRateLimit(ip) {
  if (!kv) return { allowed: true }; // Rate limiting disabled if KV not configured

  const key = `tavus_ratelimit:${ip}`;
  const count = await kv.get(key);

  if (count && count >= 1) {
    return { allowed: false, retryAfter: 300 }; // 5 minutes
  }

  // Increment counter, expire after 5 minutes
  await kv.set(key, 1, { ex: 300 });
  return { allowed: true };
}

export default async function handler(req, res) {
  // CORS — allow requests from the FORGE domain
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Rate Limiting (1 request per IP per 5 minutes) ─────────────────────────
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const rateLimit = await checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    console.warn(`Tavus rate limit exceeded for IP: ${clientIp}`);
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: rateLimit.retryAfter
    });
  }

  const { pkg, name, eta, pkgLabel } = req.body || {};

  if (!process.env.TAVUS_API_KEY || !process.env.TAVUS_REPLICA_ID) {
    return res.status(503).json({ error: 'Tavus not configured' });
  }

  // ── Build personalised context for the AI agent ──────────────────────────
  const pkgNames = { p1: 'Launch', p2: 'Brand', p3: 'Convert', p4: 'Book', p5: 'Grow' };
  const pkgPrices = { p1: '£74.99', p2: '£149.99', p3: '£299.99', p4: '£499.99', p5: '£624.99' };
  const pkgName  = pkgNames[pkg]  || pkgLabel || 'Launch';
  const pkgPrice = pkgPrices[pkg] || '';
  const clientName = name || 'there';
  const timeline = eta || '~10 minutes';

  const conversationalContext = `
You are a friendly, confident FORGE agent — the AI-powered marketing agency.
Your role is to welcome this client immediately after they have just paid for their package.

CLIENT DETAILS:
- Name: ${clientName}
- Package purchased: ${pkgName} (${pkgPrice})
- Estimated delivery: ${timeline}

YOUR OBJECTIVES IN THIS CONVERSATION:
1. Warmly congratulate them by first name for taking action
2. Confirm exactly what they've purchased and what they'll receive
3. Explain that FORGE's AI agents are building their digital presence right now in the background
4. Tell them their handover document with live URLs and login details will be emailed to them within ${timeline}
5. Answer any questions they have about the process, what FORGE does, or what comes next
6. Keep energy high — they've just made a smart business decision and should feel excited, not anxious

TONE: Warm, professional, energetic. Like a brilliant account manager on their first day, not a corporate robot.
NEVER say you are an AI unless directly asked. Stay in character as a FORGE team member.
Keep responses concise — this is a live video call, not an essay.
  `.trim();

  const customGreeting = `Hi ${clientName}! Congratulations — your payment just cleared and the FORGE machine is already running. I'm here to walk you through exactly what's happening and answer any questions you have. How are you feeling?`;

  // ── Call Tavus API ────────────────────────────────────────────────────────
  try {
    const body = {
      replica_id: process.env.TAVUS_REPLICA_ID,
      conversational_context: conversationalContext,
      custom_greeting: customGreeting,
      properties: {
        max_call_duration: 900,      // 15 minutes max
        participant_left_timeout: 60, // end after 60s of no participant
        enable_recording: false,
        language: 'english'
      }
    };

    // Add persona if configured
    if (process.env.TAVUS_PERSONA_ID) {
      body.persona_id = process.env.TAVUS_PERSONA_ID;
    }

    const tavusRes = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.TAVUS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!tavusRes.ok) {
      const err = await tavusRes.text();
      console.error('Tavus API error:', err);
      return res.status(502).json({ error: 'Failed to create conversation', detail: err });
    }

    const data = await tavusRes.json();

    return res.status(200).json({
      conversation_id:  data.conversation_id,
      conversation_url: data.conversation_url,
      status:           data.status
    });

  } catch (err) {
    console.error('Tavus handler error:', err);
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
