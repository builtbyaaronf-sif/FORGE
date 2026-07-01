import { createClient } from '@vercel/kv';
import { sendLogoWizardEmail, sendLogoReceivedEmail } from './_lib/emails.js';

// Final client-intake submission — by the time this fires, every photo, the
// logo, and every accreditation image has already been uploaded individually
// via api/client-intake-photo.js (see that file for why). This endpoint only
// ever receives lightweight blob URLs plus form fields, never image bytes —
// keeps the payload tiny regardless of how many photos the client added.

const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

// client-intake.js only receives orderId + form fields — name/email live in
// the PayPal order itself, not in this payload. Reuse the exact same
// verify-and-decode path api/session.js already uses, rather than storing a
// second copy of clientData in KV that could drift out of sync with PayPal.
async function resolveClientFromOrder(orderId, req) {
  const base = `https://${req.headers.host || 'forgeisagentic.tech'}`;
  const res = await fetch(`${base}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.name || !data.email) return null;
  return { name: data.name, email: data.email, trade: null };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const orderId = (body.orderId || '').trim();

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId — client-intake.html must be opened via the link from build-status.html' });
    }
    if (!kv) {
      console.error('[INTAKE] KV not configured — cannot persist submission');
      return res.status(500).json({ error: 'Storage not configured — contact sales@forgeisagentic.tech' });
    }

    const photoUrls = Array.isArray(body.photoUrls) ? body.photoUrls.filter(u => typeof u === 'string').slice(0, 12) : [];
    const accreditationUrls = Array.isArray(body.accreditationUrls) ? body.accreditationUrls.filter(u => typeof u === 'string').slice(0, 12) : [];

    const record = {
      orderId,
      trade: String(body.trade || '').trim().slice(0, 60),
      services: (Array.isArray(body.services) ? body.services : []).filter(Boolean).slice(0, 20).map(s => String(s).slice(0, 80)),
      workingHours: String(body.workingHours || '').trim().slice(0, 200),
      whatsapp: String(body.whatsapp || '').trim().slice(0, 30),
      googleBusiness: String(body.googleBusiness || '').trim().slice(0, 300),
      instagramHandle: String(body.instagramHandle || '').trim().slice(0, 60),
      photoUrls,
      logoChoice: body.logoChoice === 'have' ? 'have' : 'design', // default to design-for-me if unset
      logoUrl: typeof body.logoUrl === 'string' ? body.logoUrl : null,
      accreditationUrls,
      submittedAt: new Date().toISOString(),
    };

    // Idempotency: a resubmission overwrites rather than duplicates — this is a
    // pre-build intake, not a payment event, so "last submission wins" is
    // correct (unlike the PayPal webhook, which must never double-process).
    await kv.set(`intake:${orderId}`, JSON.stringify(record), { ex: 60 * 60 * 24 * 30 }); // 30 day TTL — covers build + one revision round

    console.log(`[INTAKE] Stored build brief for order ${orderId} — trade: ${record.trade}, ${record.services.length} services, ${photoUrls.length} photos, logo: ${record.logoChoice}`);

    // Notify Aaron the brief landed, and fire the client-facing logo email —
    // this is the fix for the sequencing bug: the old flow emailed the
    // "choose your logo" CTA immediately at payment, before the client had
    // any chance to say "I already have one." Now it fires from here,
    // gated on what logoChoice actually says.
    const notifyPromises = [];

    if (process.env.RESEND_API_KEY) {
      notifyPromises.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL,
            to: ['sales@forgeisagentic.tech'],
            subject: `Build brief received — order ${orderId}`,
            html: `<p>Trade: ${record.trade}</p><p>Services: ${record.services.join(', ')}</p><p>Photos: ${photoUrls.length} · Accreditations: ${accreditationUrls.length} · Logo: ${record.logoChoice}${record.logoUrl ? ' (uploaded)' : ' (design 3 options)'}</p><p>Google Business: ${record.googleBusiness || 'not provided'}</p><p>Fetch full record: <code>kv.get('intake:${orderId}')</code></p>`,
          }),
        }).catch(err => console.error('[INTAKE] Aaron notify email failed:', err.message))
      );

      const client = await resolveClientFromOrder(orderId, req);
      if (client) {
        client.trade = record.trade;
        notifyPromises.push(
          record.logoChoice === 'have'
            ? sendLogoReceivedEmail(client)
            : sendLogoWizardEmail(client, orderId)
        );
      } else {
        console.warn(`[INTAKE] Could not resolve client name/email for order ${orderId} — logo follow-up email skipped`);
      }
    }

    await Promise.all(notifyPromises);

    return res.status(200).json({ received: true, logoChoice: record.logoChoice });
  } catch (err) {
    console.error('[INTAKE] Unhandled error:', err);
    return res.status(500).json({ error: 'Submission failed, please try again' });
  }
}
