// Shared email senders — pulled out of api/paypal-webhook.js so client-intake.js
// can send the logo-wizard follow-up without duplicating the HTML template.
// Prefixed with _lib so Vercel doesn't treat this folder as its own route.

const BRAND_HEADER = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:40px">
      <div style="width:36px;height:36px;background:#0099FF;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:#fff">F</div>
      <span style="font-weight:900;font-size:18px;letter-spacing:2px">FORGE</span>
    </div>`;

const BRAND_FOOTER = `
    <p style="color:#555;font-size:12px;line-height:1.6">Questions? Reply to this email or contact <a href="mailto:sales@forgeisagentic.tech" style="color:#0099FF">sales@forgeisagentic.tech</a>.<br>FORGE Agentic Marketing &middot; ICO Registered ZC176397</p>`;

function wrap(inner) {
  return `<html><body style="background:#090909;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:0"><div style="max-width:600px;margin:0 auto;padding:40px 24px">${inner}</div></body></html>`;
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [to], subject, html }),
  }).catch(err => console.error('[EMAIL] Send failed:', err.message));
}

// Sent at PAYMENT time. No logo CTA here — that used to fire immediately,
// before the client had any chance to say "I already have a logo" in
// client-intake.html. Now this just confirms payment and points at the
// build brief, which is where the logo choice actually gets made.
export async function sendPaymentConfirmedEmail(clientData, orderId, amount) {
  const intakeUrl = `https://forgeisagentic.tech/client-intake.html?orderId=${encodeURIComponent(orderId)}`;
  const html = wrap(`
    ${BRAND_HEADER}
    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Your order is confirmed.</h1>
    <p style="color:#888;margin-bottom:32px">One quick step and we start building.</p>

    <div style="background:#0D0D0D;border:1px solid #1A1A1A;border-radius:12px;padding:24px;margin-bottom:32px">
      <div style="margin-bottom:12px"><span style="color:#888;font-size:13px">Business</span><br><strong>${clientData.name}</strong></div>
      <div style="margin-bottom:12px"><span style="color:#888;font-size:13px">Amount paid</span><br><strong>£${amount}</strong></div>
      <div><span style="color:#888;font-size:13px">Order ID</span><br><span style="font-family:monospace;font-size:12px;color:#888">${orderId}</span></div>
    </div>

    <div style="background:#0D1A2A;border:1px solid rgba(0,153,255,0.3);border-radius:12px;padding:24px;margin-bottom:32px">
      <div style="color:#0099FF;font-size:11px;letter-spacing:3px;font-weight:700;margin-bottom:12px">ACTION NEEDED: 3 MINUTES</div>
      <h2 style="font-size:20px;font-weight:900;margin-bottom:8px">Complete your build brief.</h2>
      <p style="color:#888;font-size:14px;margin-bottom:20px">Trade, services, photos, and how you want your logo handled — this is what makes your site look like yours. We start assembling the final build once this is in.</p>
      <a href="${intakeUrl}" style="display:inline-block;background:#0099FF;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px">Complete your build brief →</a>
    </div>

    ${BRAND_FOOTER}
  `);
  await sendEmail({ to: clientData.email, subject: 'Your FORGE order is confirmed. One quick step.', html });
}

// Sent AFTER client-intake.js stores the brief — only if logoChoice === 'design'.
// If the client already uploaded their own logo, this never fires; MARK just
// applies the uploaded file instead of generating options.
export async function sendLogoWizardEmail(clientData, orderId) {
  const slug  = (clientData.name || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const trade = clientData.trade || 'professional';
  const color = encodeURIComponent('#0099FF');
  const wizardUrl = `https://forgeisagentic.tech/logo-wizard.html?slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(clientData.name)}&trade=${encodeURIComponent(trade)}&color=${color}&email=${encodeURIComponent(clientData.email)}`;

  const html = wrap(`
    ${BRAND_HEADER}
    <h1 style="font-size:26px;font-weight:900;margin-bottom:8px">Choose your logo.</h1>
    <p style="color:#888;margin-bottom:28px">Thanks, your build brief is in. Last thing before we assemble your site.</p>
    <div style="background:#0D1A2A;border:1px solid rgba(0,153,255,0.3);border-radius:12px;padding:24px;margin-bottom:24px">
      <p style="color:#888;font-size:14px;margin-bottom:20px">Three options, all designed to match your brand. Pick one and it's applied across your website and every asset we generate.</p>
      <a href="${wizardUrl}" style="display:inline-block;background:#0099FF;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px">Choose my logo →</a>
      <p style="color:#555;font-size:12px;margin-top:12px">No action = we'll select the best option automatically after 24 hours.</p>
    </div>
    ${BRAND_FOOTER}
  `);
  await sendEmail({ to: clientData.email, subject: 'One last step — choose your logo', html });
}

// Sent AFTER client-intake.js stores the brief — only if logoChoice === 'have'.
export async function sendLogoReceivedEmail(clientData) {
  const html = wrap(`
    ${BRAND_HEADER}
    <h1 style="font-size:26px;font-weight:900;margin-bottom:8px">Got your logo. Building now.</h1>
    <p style="color:#888;margin-bottom:28px">Thanks, ${clientData.name} — your build brief and logo are both in. No further action needed. We'll email you the moment your site is live.</p>
    ${BRAND_FOOTER}
  `);
  await sendEmail({ to: clientData.email, subject: 'Got it — building your site now', html });
}
