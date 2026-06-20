import { createClient } from '@vercel/kv';

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const PRICES = { p1: 74.99, p2: 149.99, p3: 299.99, p4: 499.99, p5: 624.99 };
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
  const pkgNames = { p1: 'Launch', p2: 'Brand', p3: 'Convert', p4: 'Book', p5: 'Grow' };
  const isUpgrade = options.isUpgrade || false;
  const upgradeFrom = options.upgradeFrom || null;
  const isSubscription = options.isSubscription || false;
  const isRecurringCharge = options.isRecurringCharge || false;
  let action, subject;

  if (isSubscription) {
    const tierLabel = { t1: 'Local SEO Maintenance', t2: 'Hyper-Local Dominator', t3: 'Total Agentic Dominance' }[clientData.tier] || clientData.tier;
    action = `SUBSCRIPTION: Activate retainer tier ${clientData.tier}`;
    subject = `SUBSCRIPTION NEW -- ${clientData.name} -- ${tierLabel}`;
  } else if (isRecurringCharge) {
    const tierLabel = { t1: 'Local SEO Maintenance', t2: 'Hyper-Local Dominator', t3: 'Total Agentic Dominance' }[clientData.tier] || clientData.tier;
    action = `SUBSCRIPTION RECURRING: Run monthly cycle for tier ${clientData.tier}`;
    subject = `SUBSCRIPTION RECURRING -- ${clientData.name} -- ${tierLabel} -- £${amount}`;
  } else if (isUpgrade) {
    action = `UPGRADE: ${upgradeFrom} to ${pkg}`;
    subject = `UPGRADE -- ${clientData.name} -- ${pkgNames[pkg]} (from ${pkgNames[upgradeFrom]})`;
  } else {
    action = 'DEPLOY: Run deploy-team skill';
    subject = `DEPLOY NOW -- ${clientData.name} -- ${pkgNames[pkg] || pkg}`;
  }

  await fetch('https://formsubmit.co/ajax/builtbyaaronf@gmail.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ _subject: subject, ACTION: action, Package: pkg, Business: clientData.name, 'Business Type': clientData.business_type === 'limited_company' ? 'Limited Company' : 'Sole Trader', Location: clientData.location || '--', Email: clientData.email, 'Order ID': orderId, Amount: amount, _template: 'table' })
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

async function sendClientConfirmation(clientData, orderId, amount) {
  if (!process.env.RESEND_API_KEY) return;
  const pkg = clientData.pkg || 'p1';
  const pkgNames = { p1: 'Launch', p2: 'Brand', p3: 'Convert', p4: 'Book', p5: 'Grow' };

  // Build logo wizard URL — client picks their logo identity
  const slug  = (clientData.name || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const trade = clientData.trade || clientData.business_type || 'professional';
  const color = encodeURIComponent('#0099FF'); // default; ATLAS will pass the real palette colour in future
  const wizardUrl = `https://forgeisagentic.tech/logo-wizard.html?slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(clientData.name)}&trade=${encodeURIComponent(trade)}&color=${color}&email=${encodeURIComponent(clientData.email)}&pkg=${encodeURIComponent(pkg)}`;

  const html = `
<html>
<body style="background:#090909;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:40px">
      <div style="width:36px;height:36px;background:#0099FF;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:#fff">F</div>
      <span style="font-weight:900;font-size:18px;letter-spacing:2px">FORGE</span>
    </div>

    <h1 style="font-size:28px;font-weight:900;margin-bottom:8px">Your order is confirmed.</h1>
    <p style="color:#888;margin-bottom:32px">Here's what happens next.</p>

    <!-- Order summary -->
    <div style="background:#0D0D0D;border:1px solid #1A1A1A;border-radius:12px;padding:24px;margin-bottom:32px">
      <div style="margin-bottom:12px"><span style="color:#888;font-size:13px">Business</span><br><strong>${clientData.name}</strong></div>
      <div style="margin-bottom:12px"><span style="color:#888;font-size:13px">Package</span><br><strong>${pkgNames[pkg] || pkg}</strong></div>
      <div style="margin-bottom:12px"><span style="color:#888;font-size:13px">Amount paid</span><br><strong>£${amount}</strong></div>
      <div><span style="color:#888;font-size:13px">Order ID</span><br><span style="font-family:monospace;font-size:12px;color:#888">${orderId}</span></div>
    </div>

    <!-- Logo wizard CTA -->
    <div style="background:#0D1A2A;border:1px solid rgba(0,153,255,0.3);border-radius:12px;padding:24px;margin-bottom:32px">
      <div style="color:#0099FF;font-size:11px;letter-spacing:3px;font-weight:700;margin-bottom:12px">ACTION NEEDED: 60 SECONDS</div>
      <h2 style="font-size:20px;font-weight:900;margin-bottom:8px">Choose your logo.</h2>
      <p style="color:#888;font-size:14px;margin-bottom:20px">Before we finalise your build, choose your logo identity. Three options, all designed to match your site. Your choice gets applied across your website, social profiles, and all business assets.</p>
      <a href="${wizardUrl}"
         style="display:inline-block;background:#0099FF;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px">
        Choose my logo →
      </a>
      <p style="color:#555;font-size:12px;margin-top:12px">No action = we'll select the best option for your business automatically after 24 hours.</p>
    </div>

    <!-- What's next -->
    <div style="margin-bottom:32px">
      <div style="color:#888;font-size:12px;letter-spacing:2px;margin-bottom:16px">WHAT HAPPENS NEXT</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:24px;height:24px;background:#0099FF;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">1</div>
          <div><strong>Choose your logo</strong> using the button above</div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:24px;height:24px;background:#1A1A1A;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;color:#888">2</div>
          <div style="color:#888">FORGE builds your complete digital presence</div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:24px;height:24px;background:#1A1A1A;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;color:#888">3</div>
          <div style="color:#888">You receive all assets + a handover document</div>
        </div>
      </div>
    </div>

    <p style="color:#555;font-size:12px;line-height:1.6">Questions? Reply to this email or visit <a href="https://forgeisagentic.tech" style="color:#0099FF">forgeisagentic.tech</a>.<br>FORGE Agentic Marketing · ICO Registered ZC176397</p>

  </div>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [clientData.email], subject: `Your FORGE order is confirmed. One quick step.`, html }),
  });
}

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
        sendClientConfirmation(clientData, orderId, amount)
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