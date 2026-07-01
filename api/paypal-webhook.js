import { createClient } from '@vercel/kv';
import { sendPaymentConfirmedEmail } from './_lib/emails.js';

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const PRICES = {
  // Two-product model — replaces the old 5-tier p1-p5 structure.
  product1: 99,       // Pop Up Website
  product2: 299.99,   // Master Website + Branding
  // Beta (founding 10) — 90% off
  product1b: 9.90,
  product2b: 29.99,
};
const RETAINER_TIERS = { t1: 99, t2: 249, t3: 499 };
const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN ? createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN }) : null;

async function getPayPalToken() {
  const creds = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, { method: 'POST', headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  return (await res.json()).access_token;
}

async function verifyWebhook(req, rawBody) {
  const token = await getPayPalToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ auth_algo: req.headers['paypal-auth-algo'], cert_url: req.headers['paypal-cert-url'], transmission_id: req.headers['paypal-transmission-id'], transmission_sig: req.headers['paypal-transmission-sig'], transmission_time: req.headers['paypal-transmission-time'], webhook_id: process.env.PAYPAL_WEBHOOK_ID, webhook_event: JSON.parse(rawBody) }) });
  return (await res.json()).verification_status === 'SUCCESS';
}

async function notifyDeployment(clientData, orderId, amount, options = {}) {
  const pkg = clientData.pkg || 'unknown';
  const pkgNames = {
    product1: 'Pop Up Website', product2: 'Master Website + Branding',
    product1b: 'Pop Up Website (Beta)', product2b: 'Master Website + Branding (Beta)',
  };
  const isUpgrade = options.isUpgrade || false;
  const upgradeFrom = options.upgradeFrom || null;
  const isSubscription = options.isSubscription || false;
  const isRecurringCharge = options.isRecurringCharge || false;
  const isOneTimeOrder = !isUpgrade && !isSubscription && !isRecurringCharge;

  let subject;
  if (isSubscription) {
    const tierLabel = { t1: 'Local SEO Maintenance', t2: 'Hyper-Local Dominator', t3: 'Total Agentic Dominance' }[clientData.tier] || clientData.tier;
    subject = `SUBSCRIPTION NEW -- ${clientData.name} -- ${tierLabel}`;
  } else if (isRecurringCharge) {
    const tierLabel = { t1: 'Local SEO Maintenance', t2: 'Hyper-Local Dominator', t3: 'Total Agentic Dominance' }[clientData.tier] || clientData.tier;
    subject = `SUBSCRIPTION RECURRING -- ${clientData.name} -- ${tierLabel} -- £${amount}`;
  } else if (isUpgrade) {
    subject = `UPGRADE -- ${clientData.name} -- ${pkgNames[pkg]} (from ${pkgNames[upgradeFrom]})`;
  } else {
    subject = `DEPLOY NOW -- ${clientData.name} -- ${pkgNames[pkg] || pkg} -- £${amount}`;
  }

  // Build one-click deploy URL for standard orders
  let deployButtonHtml = '';
  if (isOneTimeOrder && process.env.DEPLOY_TRIGGER_SECRET && process.env.VERCEL_API_TOKEN) {
    const slug = (clientData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const params = new URLSearchParams({
      token:    process.env.DEPLOY_TRIGGER_SECRET,
      slug,
      name:     clientData.name || '',
      trade:    clientData.trade || clientData.business_type || '',
      location: clientData.location || '',
      pkg,
      email:    clientData.email || '',
    });
    const deployUrl = `https://forgeisagentic.tech/api/deploy-trigger?${params.toString()}`;
    deployButtonHtml = `
      <div style="background:#0a1a0a;border:1px solid rgba(34,197,94,0.3);border-radius:12px;padding:24px;margin:24px 0;text-align:center">
        <div style="color:#22c55e;font-size:11px;letter-spacing:3px;font-weight:700;margin-bottom:10px">ONE-CLICK DEPLOY</div>
        <p style="color:#888;font-size:13px;margin-bottom:16px">Creates Vercel project + deploys starter template. Click once. Done.</p>
        <a href="${deployUrl}" style="display:inline-block;background:#22c55e;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:800;font-size:15px">
          Deploy ${clientData.name} →
        </a>
        <p style="color:#444;font-size:11px;margin-top:10px">Then run full deploy-team skill in Cowork for the complete site.</p>
      </div>`;
  }

  // Send via Resend for rich HTML (falls back to FormSubmit for subscriptions/upgrades)
  if (isOneTimeOrder && process.env.RESEND_API_KEY) {
    const notifyHtml = `
<html>
<body style="background:#090909;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:32px;height:32px;background:#0099FF;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#fff">F</div>
      <span style="font-weight:900;font-size:16px;letter-spacing:2px;color:#fff">FORGE</span>
      <span style="margin-left:auto;background:#22c55e;color:#000;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700">NEW ORDER</span>
    </div>
    <h1 style="font-size:26px;font-weight:900;margin-bottom:4px">${clientData.name}</h1>
    <p style="color:#888;margin-bottom:24px">${pkgNames[pkg] || pkg} &middot; £${amount} &middot; ${clientData.location || 'London'}</p>
    <div style="background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:20px;margin-bottom:8px;font-size:14px;line-height:2">
      <div><span style="color:#555">Business:</span> <strong>${clientData.name}</strong></div>
      <div><span style="color:#555">Trade:</span> ${clientData.trade || clientData.business_type || 'Unknown'}</div>
      <div><span style="color:#555">Location:</span> ${clientData.location || 'Unknown'}</div>
      <div><span style="color:#555">Email:</span> ${clientData.email}</div>
      <div><span style="color:#555">Package:</span> ${pkgNames[pkg] || pkg}</div>
      <div><span style="color:#555">Amount:</span> £${amount}</div>
      <div><span style="color:#555">Order ID:</span> <span style="font-family:monospace;font-size:12px;color:#666">${orderId}</span></div>
    </div>
    ${deployButtonHtml}
    <p style="color:#333;font-size:12px;margin-top:24px">FORGE Agentic Marketing &middot; ICO Registered ZC176397</p>
  </div>
</body>
</html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: ['sales@forgeisagentic.tech'],
        subject,
        html: notifyHtml,
      }),
    });
    return;
  }

  // Fallback: FormSubmit for subscriptions, upgrades, or if Resend not configured
  const action = isSubscription
    ? `SUBSCRIPTION: Activate retainer tier ${clientData.tier}`
    : isRecurringCharge
      ? `SUBSCRIPTION RECURRING: Run monthly cycle for tier ${clientData.tier}`
      : isUpgrade
        ? `UPGRADE: ${upgradeFrom} to ${pkg}`
        : 'DEPLOY: Run deploy-team skill in Cowork';

  await fetch('https://formsubmit.co/ajax/sales@forgeisagentic.tech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ _subject: subject, ACTION: action, Package: pkg, Business: clientData.name, 'Business Type': clientData.business_type === 'limited_company' ? 'Limited Company' : 'Sole Trader', Location: clientData.location || '--', Email: clientData.email, 'Order ID': orderId, Amount: amount, _template: 'table' }),
  });
}

async function updateHubSpotContact(email, utmSource, utmCampaign) {
  if (!process.env.HUBSPOT_PORTAL_ID || !process.env.HUBSPOT_API_KEY) return;
  try {
    const apiKey = process.env.HUBSPOT_API_KEY;
    const properties = {};
    if (utmSource) properties['forge_lead_utm_source'] = utmSource;
    if (utmCampaign) properties['forge_lead_campaign_tag'] = utmCampaign;
    const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }], limit: 1 }) });
    if (!searchRes.ok) return;
    const searchData = await searchRes.json();
    const existingContact = searchData.results?.[0];
    if (existingContact) {
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ properties }) });
    } else {
      properties['email'] = email;
      await fetch('https://api.hubapi.com/crm/v3/objects/contacts', { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ properties }) });
    }
  } catch (err) {
    console.error('HubSpot error:', err.message);
  }
}

// sendClientConfirmation used to live here — it sent the "choose your logo"
// CTA immediately at payment, before the client had any chance to say "I
// already have one" via client-intake.html. That email now lives in
// _lib/emails.js as sendPaymentConfirmedEmail (payment receipt + link to the
// build brief, no logo CTA), and the logo choice itself is emailed from
// api/client-intake.js once the brief actually says what the client wants.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  try {
    const hasCredentials = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_WEBHOOK_ID;
    if (hasCredentials) {
      const valid = await verifyWebhook(req, rawBody);
      if (!valid) {
        console.warn('PayPal webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const event = JSON.parse(rawBody);

    // ── Payment capture (one-time orders) ──────────────────────────────────
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource || {};
      const customId = resource.custom_id || '';
      const amount = resource.amount?.value || '0.00';
      const orderId = resource.id || 'unknown';

      if (kv && orderId !== 'unknown') {
        const isDuplicate = await kv.get(`paypal_processed:${orderId}`);
        if (isDuplicate) {
          console.warn(`Duplicate event for order ${orderId}`);
          return res.status(200).json({ received: true, status: 'duplicate_ignored' });
        }
        await kv.set(`paypal_processed:${orderId}`, 'true', { ex: 604800 });
      }

      let clientData = {};
      try {
        if (customId) clientData = JSON.parse(Buffer.from(customId, 'base64').toString('utf8'));
      } catch (e) {
        console.error('Failed to decode custom_id:', e.message);
        return res.status(200).json({ received: true, warning: 'Invalid custom_id' });
      }

      if (!clientData.name || !clientData.email || !clientData.pkg) {
        console.error('Missing required fields in custom_id');
        return res.status(200).json({ received: true, warning: 'Missing required fields' });
      }

      // Infer business_type from name if not encoded (legacy orders pre-19-Jun-2026)
      if (!clientData.business_type) {
        const ltdPatterns = /\b(ltd|limited|plc|llp|llc|inc|corp|group)\b/i;
        clientData.business_type = ltdPatterns.test(clientData.name) ? 'limited_company' : 'sole_trader';
      }

      const expectedPrice = PRICES[clientData.pkg];
      if (expectedPrice && Math.abs(parseFloat(amount) - expectedPrice) > 0.01) {
        console.error(`Amount mismatch for order ${orderId}: expected £${expectedPrice}, got £${amount}`);
        return res.status(200).json({ received: true, warning: 'Amount mismatch rejected' });
      }

      if (clientData.is_upgrade) {
        if (!clientData.upgrade_from || !PRICES[clientData.upgrade_from]) {
          console.error('Invalid upgrade_from package');
          return res.status(200).json({ received: true, warning: 'Invalid upgrade' });
        }
        if (PRICES[clientData.upgrade_from] >= PRICES[clientData.pkg]) {
          console.error('Attempted downgrade or lateral move');
          return res.status(200).json({ received: true, warning: 'Downgrade rejected' });
        }
        await notifyDeployment(clientData, orderId, amount, { isUpgrade: true, upgradeFrom: clientData.upgrade_from });
        return res.status(200).json({ received: true, action: 'upgrade_queued' });
      }

      const utmSource = clientData.utm_source || null;
      const utmCampaign = clientData.utm_campaign || null;
      if ((utmSource || utmCampaign) && process.env.HUBSPOT_PORTAL_ID && process.env.HUBSPOT_API_KEY) {
        await updateHubSpotContact(clientData.email, utmSource, utmCampaign);
      }

      await Promise.all([
        notifyDeployment(clientData, orderId, amount),
        sendPaymentConfirmedEmail(clientData, orderId, amount)
      ]);

      console.log(`Deployment triggered for ${clientData.name}`);
    }

    // ── Subscription created ──────────────────────────────────────────────
    if (event.event_type === 'BILLING.SUBSCRIPTION.CREATED') {
      const resource = event.resource || {};
      const subscriptionId = resource.id;
      const customIdRaw = resource.customid;

      if (!subscriptionId) {
        console.error('[SUB] Missing subscription ID');
        return res.status(200).json({ received: true, action: 'sub_missing_id' });
      }

      let decoded = {};
      try {
        decoded = JSON.parse(Buffer.from(customIdRaw || '', 'base64').toString('utf8'));
      } catch {
        console.error('[SUB] Failed to decode custom_id for', subscriptionId);
        return res.status(200).json({ received: true, action: 'sub_invalid_custom_id' });
      }

      if (!decoded.email || !decoded.tier || !decoded.is_subscription) {
        console.error('[SUB] Invalid custom_id fields', decoded);
        return res.status(200).json({ received: true, action: 'sub_invalid_fields' });
      }

      if (!RETAINER_TIERS[decoded.tier]) {
        console.error('[SUB] Unknown tier:', decoded.tier);
        return res.status(200).json({ received: true, action: 'sub_unknown_tier' });
      }

      const clientSlug = decoded.name
        ? decoded.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : decoded.email.split('@')[0];

      if (kv) {
        const subBusinessType = decoded.business_type || (
          /\b(ltd|limited|plc|llp|llc|inc|corp|group)\b/i.test(decoded.name || '')
            ? 'limited_company' : 'sole_trader'
        );

        await kv.set(`sub:${subscriptionId}`, JSON.stringify({
          email: decoded.email,
          name: decoded.name || '',
          location: decoded.location || '',
          tier: decoded.tier,
          business_type: subBusinessType,
          client_slug: clientSlug,
          price: RETAINER_TIERS[decoded.tier],
          original_order_id: decoded.original_order_id || '',
          created_at: new Date().toISOString(),
          status: 'active',
          last_run_at: null
        }), { ex: 60 * 60 * 24 * 400 });

        await kv.sadd('forge:active_subscriptions', subscriptionId);
      }

      console.log(`[SUB] Subscription created: ${subscriptionId} | ${decoded.tier} | ${decoded.email}`);
      await notifyDeployment({
        name: decoded.name,
        email: decoded.email,
        location: decoded.location,
        tier: decoded.tier,
        pkg: `retainer-${decoded.tier}`
      }, subscriptionId, RETAINER_TIERS[decoded.tier], { isSubscription: true });

      return res.status(200).json({ received: true, action: 'subscription_recorded' });
    }

    // ── Recurring subscription payment ─────────────────────────────────────
    if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
      const resource = event.resource || {};
      const subscriptionId = resource.billing_agreement_id;

      if (!subscriptionId) {
        console.log('[SUB PAYMENT] No billing_agreement_id — skipping');
        return res.status(200).json({ received: true, action: 'skipped_no_sub_id' });
      }

      const saleId = resource.id;
      const dedupKey = `forge:sale:${saleId}`;
      if (kv) {
        const already = await kv.get(dedupKey);
        if (already) {
          console.log('[SUB PAYMENT] Duplicate sale event, skipping:', saleId);
          return res.status(200).json({ received: true, action: 'duplicate_skipped' });
        }
        await kv.set(dedupKey, '1', { ex: 60 * 60 * 24 * 7 });
      }

      if (!kv) {
        console.error('[SUB PAYMENT] KV not configured');
        return res.status(200).json({ received: true, action: 'kv_unavailable' });
      }

      const clientDataRaw = await kv.get(`sub:${subscriptionId}`);
      if (!clientDataRaw) {
        console.error('[SUB PAYMENT] No KV record for subscription:', subscriptionId);
        return res.status(200).json({ received: true, action: 'sub_not_found_in_kv' });
      }

      const clientData = typeof clientDataRaw === 'string'
        ? JSON.parse(clientDataRaw)
        : clientDataRaw;

      const expectedAmount = RETAINER_TIERS[clientData.tier];
      const capturedAmount = parseFloat(resource.amount?.total || '0');

      if (expectedAmount && Math.abs(capturedAmount - expectedAmount) > 0.01) {
        console.error(`[SUB FRAUD] Amount mismatch. Expected £${expectedAmount}, got £${capturedAmount} for ${subscriptionId}`);
        return res.status(200).json({ received: true, action: 'sub_amount_mismatch' });
      }

      clientData.last_charged_at = new Date().toISOString();
      await kv.set(`sub:${subscriptionId}`, JSON.stringify(clientData), { ex: 60 * 60 * 24 * 400 });

      console.log(`[SUB PAYMENT] Charged £${capturedAmount} for ${subscriptionId} | ${clientData.email}`);
      await notifyDeployment({
        name: clientData.name,
        email: clientData.email,
        location: clientData.location,
        tier: clientData.tier,
        pkg: `retainer-${clientData.tier}-renewal`,
      }, subscriptionId, capturedAmount, { isRecurringCharge: true });

      return res.status(200).json({ received: true, action: 'subscription_renewal_recorded' });
    }

    // Unhandled event type
    console.log('[WEBHOOK] Unhandled event type:', event.event_type);
    return res.status(200).json({ received: true, action: 'unhandled_event' });

  } catch (err) {
    console.error('[WEBHOOK] Unhandled error:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
}