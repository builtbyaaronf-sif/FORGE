// api/submit.js — FORGE lead capture + email notification
// Env vars: HUBSPOT_ACCESS_TOKEN, RESEND_API_KEY, RESEND_FROM_EMAIL

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body      = req.body || {};
  const firstName = body['First Name'] || '';
  const lastName  = body['Last Name']  || '';
  const email     = body['Email']      || '';
  const trade     = body['Trade']      || '';
  const area      = body['Area']       || '';
  const message   = body['Message']    || '';
  const logoUrl   = body['Logo']       || '';
  const fullName  = (firstName + ' ' + lastName).trim();

  if (!email || !trade || !area) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const token     = process.env.HUBSPOT_ACCESS_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'leads@forgeisagentic.tech';

  // ── HubSpot ──────────────────────────────────────────────
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

  // ── Resend email to sales@ ────────────────────────────────
  if (resendKey) {
    try {
      const hasLogo = logoUrl  && logoUrl  !== 'None';
      const hasMsg  = message  && message  !== 'None';
      const subject = 'New FORGE Lead — ' + (fullName || email) + ' (' + trade + ', ' + area + ')';
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
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
        + '.p{background:#6366f1;color:#fff}'
        + '.s{background:#1f2937;color:#f3f4f6}'
        + '.f{background:#0d0d0d;border:1px solid #1f2937;border-top:none;border-radius:0 0 12px 12px;padding:14px 32px;font-size:12px;color:#6b7280;text-align:center}'
        + '</style></head><body><div class="w">'
        + '<div class="h"><span class="logo">FORGE</span><span class="tag">New Lead</span></div>'
        + '<div class="b">'
        + '<p class="title">' + subject + '</p>'
        + '<table>'
        + '<tr><td>Name</td><td>' + (fullName || '—') + '</td></tr>'
        + '<tr><td>Email</td><td>' + email + '</td></tr>'
        + '<tr><td>Trade</td><td>' + trade + '</td></tr>'
        + '<tr><td>Area</td><td>' + area  + '</td></tr>'
        + (hasLogo ? '<tr><td>Logo</td><td><a href="' + logoUrl + '" style="color:#6366f1">View logo →</a></td></tr>' : '')
        + '</table>'
        + (hasMsg ? '<p class="msglabel">Message</p><div class="msgbox">' + message + '</div>' : '')
        + '<div class="actions">'
        + '<a href="mailto:' + email + '?subject=Re: Your FORGE enquiry" class="btn p">Reply to Lead</a>'
        + '<a href="https://app.hubspot.com/contacts/" class="btn s">View in HubSpot</a>'
        + '</div></div>'
        + '<div class="f">FORGE Agentic · forgeisagentic.tech · Sent to sales@forgeisagentic.tech</div>'
        + '</div></body></html>';

      const er = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
        body: JSON.stringify({ from: 'FORGE Leads <' + fromEmail + '>', to: ['sales@forgeisagentic.tech'], subject, html })
      });
      console.log('[FORGE] Email sent, status:', er.status);
    } catch (e) { console.error('[FORGE] Resend error:', e.message); }
  }

  return res.status(200).json({ success: true });
};
