// api/submit.js — FORGE lead capture + email notifications
// Env vars: HUBSPOT_ACCESS_TOKEN, RESEND_API_KEY, RESEND_FROM_EMAIL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, AARON_WHATSAPP_TO, KLAVIYO_PRIVATE_API_KEY

import { trackPulseEvent } from './_lib/pulse.js';


// ── Rate Limiter ─────────────────────────────────────────────────────────
const RL_WINDOW = 60_000; // 60 seconds
const RL_MAX    = 5;      // max submissions per IP per window
const rlMap     = new Map();
function isRateLimited(ip) {
  const now  = Date.now();
  const hits = (rlMap.get(ip) || []).filter(t => now - t < RL_WINDOW);
  hits.push(now);
  rlMap.set(ip, hits);
  return hits.length > RL_MAX;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const body      = req.body || {};
  const firstName = body['First Name'] || '';
  const lastName  = body['Last Name']  || '';
  const email     = body['Email']      || '';
  const trade     = body['Trade']      || '';
  const area      = body['Area']       || '';
  const message   = body['Message']    || '';
  const logoUrl   = body['Logo']       || '';
  const pkg      = body['Package'] || 'Not specified';
  const fullName  = (firstName + ' ' + lastName).trim();

  if (!email || !trade || !area) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const token     = process.env.HUBSPOT_ACCESS_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'leads@forgeisagentic.tech';
  const twilioSid   = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken  = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom   = process.env.TWILIO_WHATSAPP_FROM;
  const aaronWA      = process.env.AARON_WHATSAPP_TO;

  // ── HubSpot ──────────────────────────────────────────────────────────────
  if (token) {
    try {
      const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          properties: {
            firstname: firstName, lastname: lastName, email,
            jobtitle: trade, city: area,
            lifecyclestage: 'lead', hs_lead_status: 'NEW'
          }
        })
      });
      if (hsRes.ok) {
        const contact = await hsRes.json();
        const noteLines = [];
        if (message && message !== 'None') noteLines.push('Message: ' + message);
        if (logoUrl  && logoUrl  !== 'None') noteLines.push('Logo: '    + logoUrl);
        noteLines.push('Package: ' + pkg);
        if (noteLines.length && contact.id) {
          await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              properties: { hs_note_body: noteLines.join('\n'), hs_timestamp: Date.now().toString() },
              associations: [{ to: { id: contact.id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] }]
            })
          }).catch(e => console.warn('[FORGE] Note failed:', e.message));
        }
      } else if (hsRes.status !== 409) {
        console.error('[FORGE] HubSpot error:', hsRes.status);
      }
    } catch (e) { console.error('[FORGE] HubSpot exception:', e.message); }
  }

  if (resendKey) {
    const hasLogo = logoUrl  && logoUrl  !== 'None';
    const hasMsg  = message  && message  !== 'None';
    const subject = 'New FORGE Lead — ' + (fullName || email) + ' (' + trade + ', ' + area + ')';

    const salesHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + 'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#0a0a0a;color:#f3f4f6;margin:0;padding:0}'
      + '.w{max-width:560px;margin:0 auto;padding:32px 16px}'
      + '.h{background:#111;border:1px solid #1f2937;border-radius:12px 12px 0 0;padding:24px 32px}'
      + '.logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-right:10px}'
      + '.tag{background:#6366f1;color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase}'
      + '.b{background:#111;border:1px solid #1f2937;border-top:none;padding:32px}'
      + '.title{font-size:18px;font-weight:700;color:#fff;margin:0 0 24px}'
      + 'table{width:100%;border-collapse:collapse;margin-bottom:24px}'
      + 'td{padding:10px 12px;border-bottom:1px solid #1f2937;font-size:14px}'
      + 'td:first-child{color:#9ca3af;width:100px;font-weight:500}'
      + 'td:last-child{color:#f3f4f6;font-weight:600}'
      + '.msgbox{background:#0d0d0d;border:1px solid #1f2937;border-radius:8px;padding:14px 16px;font-size:14px;color:#d1d5db;margin-bottom:24px;line-height:1.6}'
      + '.msglabel{color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px}'
      + '.actions{display:flex;gap:12px}'
      + '.btn{display:inline-block;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none}'
      + '.p{background:#6366f1;color:#fff}.s{background:#1f2937;color:#f3f4f6}'
      + '.f{background:#0d0d0d;border:1px solid #1f2937;border-top:none;border-radius:0 0 12px 12px;padding:14px 32px;font-size:12px;color:#6b7280;text-align:center}'
      + '</style></head><body><div class="w">'
      + '<div class="h"><span class="logo">FORGE</span><span class="tag">New Lead</span></div>'
      + '<div class="b"><p class="title">' + subject + '</p>'
      + '<table>'
      + '<tr><td>Name</td><td>' + (fullName || '—') + '</td></tr>'
      + '<tr><td>Email</td><td>' + email + '</td></tr>'
      + '<tr><td>Trade</td><td>' + trade + '</td></tr>'
      + '<tr><td>Area</td><td>' + area + '</td></tr>'
            + '<tr><td>Package</td><td>' + pkg + '</td></tr>'
      + (hasLogo ? '<tr><td>Logo</td><td><a href="' + logoUrl + '" style="color:#6366f1">View logo →</a></td></tr>' : '')
      + '</table>'
      + (hasMsg ? '<p class="msglabel">Message</p><div class="msgbox">' + message + '</div>' : '')
      + '<div class="actions">'
      + '<a href="mailto:' + email + '?subject=Re: Your FORGE enquiry" class="btn p">Reply to Lead</a>'
      + '<a href="https://app.hubspot.com/contacts/" class="btn s">View in HubSpot</a>'
      + '</div></div>'
      + '<div class="f">FORGE Agentic · forgeisagentic.tech · Sent to sales@forgeisagentic.tech</div>'
      + '</div></body></html>';

    // ── Welcome email to the lead ─────────────────────────────────────────
    const greeting = firstName ? 'Hi ' + firstName : 'Hi there';
    const leadHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + 'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#0a0a0a;color:#f3f4f6;margin:0;padding:0}'
      + '.w{max-width:560px;margin:0 auto;padding:32px 16px}'
      + '.h{background:#111;border:1px solid #1f2937;border-radius:12px 12px 0 0;padding:24px 32px}'
      + '.logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px}'
      + '.b{background:#111;border:1px solid #1f2937;border-top:none;padding:32px}'
      + 'h2{font-size:22px;font-weight:700;color:#fff;margin:0 0 16px}'
      + 'p{font-size:15px;color:#d1d5db;line-height:1.7;margin:0 0 16px}'
      + '.highlight{background:#0d0d0d;border-left:3px solid #6366f1;padding:14px 18px;border-radius:0 8px 8px 0;margin:24px 0}'
      + '.highlight p{margin:0;color:#a5b4fc;font-weight:500}'
      + '.btn{display:inline-block;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;background:#6366f1;color:#fff;margin-top:8px}'
      + '.step{display:flex;align-items:flex-start;gap:14px;margin-bottom:16px}'
      + '.num{background:#6366f1;color:#fff;font-size:12px;font-weight:800;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}'
      + '.step p{margin:0;font-size:14px;color:#9ca3af}'
      + '.step strong{color:#f3f4f6}'
      + '.f{background:#0d0d0d;border:1px solid #1f2937;border-top:none;border-radius:0 0 12px 12px;padding:14px 32px;font-size:12px;color:#6b7280;text-align:center}'
      + '</style></head><body><div class="w">'
      + '<div class="h"><span class="logo">FORGE</span></div>'
      + '<div class="b">'
      + '<h2>' + greeting + ', we’ve got your enquiry ✔</h2>'
      + '<p>Thanks for reaching out to FORGE. We build full digital presences for London tradespeople — fast, professional, and built to win you more work.</p>'
      + '<div class="highlight"><p>We’ll be in touch within <strong>24 hours</strong> to walk you through exactly what we’ll build for you.</p></div>'
      + '<p style="color:#9ca3af;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">Here’s what happens next</p>'
      + '<div class="step"><div class="num">1</div><p><strong>We review your enquiry</strong><br>Our team looks at your trade, area, and any details you shared.</p></div>'
      + '<div class="step"><div class="num">2</div><p><strong>We reach out directly</strong><br>Expect a call or email from us within 24 hours to discuss your package.</p></div>'
      + '<div class="step"><div class="num">3</div><p><strong>We build your digital presence</strong><br>Website, brand, CRM, bookings — everything set up in a single session.</p></div>'
      + '<p style="margin-top:24px">In the meantime, take a look at what we can build for you:</p>'
      + '<a href="https://forgeisagentic.tech" class="btn">See what FORGE builds →</a>'
      + '</div>'
      + '<div class="f">FORGE Agentic · forgeisagentic.tech · sales@forgeisagentic.tech<br>You’re receiving this because you submitted an enquiry on our website.</div>'
      + '</div></body></html>';

    try {
      await Promise.all([
        // Sales notification
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
          body: JSON.stringify({ from: 'FORGE Leads <' + fromEmail + '>', to: ['sales@forgeisagentic.tech'], subject, html: salesHtml })
        }),
        // Lead welcome email
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'FORGE <' + fromEmail + '>',
            to: [email],
            subject: 'We’ve got your enquiry, ' + (firstName || 'there') + ' ✔',
            html: leadHtml
          })
        })
      ]);
      console.log('[FORGE] Both emails sent');
    } catch (e) { console.error('[FORGE] Resend error:', e.message); }
  }


  // ── PULSE — track the lead in Klaviyo so a nurture flow can pick it up ──
  // Fire-and-forget: a Klaviyo hiccup should never block the lead response.
  trackPulseEvent({
    email,
    firstName,
    clientSlug: (body['Client Slug'] || 'forge-direct'),
    metricName: 'lead_captured',
    properties: { trade, area, package: pkg },
  }).catch(err => console.error('[PULSE] Non-fatal:', err.message));

  // ── WhatsApp approval prompt ──────────────────────────────────
  if (twilioSid && twilioToken && twilioFrom && aaronWA) {
    const waMsg = [
      '🔨 *New FORGE Lead!*',
      '',
      '👤 ' + fullName,
      '🔧 ' + trade + ' · ' + area,
      '📦 ' + pkg,
      '',
      'Reply *Y* to approve — sends lead a we\'re on it email + updates HubSpot.',
      'Reply *N* to decline.'
    ].join('\n');
    fetch(
      'https://api.twilio.com/2010-04-01/Accounts/' + twilioSid + '/Messages.json',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(twilioSid + ':' + twilioToken).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ From: twilioFrom, To: aaronWA, Body: waMsg }).toString()
      }
    ).catch(e => console.error('Twilio WA:', e.message));
  }
  return res.status(200).json({ success: true });
}
