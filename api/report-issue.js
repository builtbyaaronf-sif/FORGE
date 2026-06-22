// api/report-issue.js — FORGE client issue reporter
// Env vars: RESEND_API_KEY, RESEND_FROM_EMAIL, FORGE_OWNER_EMAIL

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body        = req.body || {};
  const { description, screenshot, pageUrl, siteName, timestamp } = body;

  if (!description) return res.status(400).json({ error: 'No description' });

  const resendKey  = process.env.RESEND_API_KEY;
  const fromEmail  = process.env.RESEND_FROM_EMAIL || 'leads@forgeisagentic.tech';
  const ownerEmail = process.env.FORGE_OWNER_EMAIL || 'builtbyaaronf@gmail.com';

  if (!resendKey) {
    console.error('RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Server config error' });
  }

  const reportTime = new Date(timestamp || Date.now()).toLocaleString('en-GB', { timeZone: 'Europe/London' });
  const site = siteName || pageUrl || 'Unknown site';
  const safeDesc = (description + '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const safeUrl  = (pageUrl  + '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#1a1a2e;border:1px solid rgba(99,102,241,0.3);border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 30px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:28px;">🚨</span>
          <div>
            <div style="color:#fff;font-size:20px;font-weight:700;">Issue Report</div>
            <div style="color:rgba(255,255,255,0.75);font-size:13px;">${site}</div>
          </div>
        </div>
      </div>
      <div style="padding:28px 30px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#888;font-size:13px;width:110px;">Page URL</td>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;">
              <a href="${pageUrl}" style="color:#6366f1;text-decoration:none;">${safeUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#888;font-size:13px;">Reported at</td>
            <td style="padding:10px 0;color:#fff;font-size:13px;">${reportTime}</td>
          </tr>
        </table>
        <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:16px 20px;margin-bottom:16px;">
          <div style="color:#6366f1;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;font-weight:600;">What's wrong</div>
          <div style="color:#fff;font-size:15px;line-height:1.7;">${safeDesc}</div>
        </div>
        ${screenshot ? '<div style="color:#aaa;font-size:12px;">📎 Screenshot attached below</div>' : ''}
      </div>
      <div style="padding:14px 30px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06);">
        <div style="color:#555;font-size:11px;">Sent by FORGE Report Widget · forgeisagentic.tech</div>
      </div>
    </div>
  </div>
</body></html>`;

  const emailPayload = {
    from: fromEmail,
    to:   [ownerEmail],
    subject: `🚨 Issue Report — ${site} — ${reportTime}`,
    html
  };

  if (screenshot) {
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
    emailPayload.attachments = [{ filename: 'screenshot.png', content: base64Data }];
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + resendKey },
      body: JSON.stringify(emailPayload)
    });
    if (!r.ok) {
      const err = await r.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Email failed' });
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Report issue error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
