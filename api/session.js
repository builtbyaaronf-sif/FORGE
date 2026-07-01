/**
 * FORGE — Session Layer (Secure Server-Side Verification)
 * Vercel Serverless Function: /api/session
 *
 * Verifies PayPal orders server-side and returns validated client data
 * with pro-rata upgrade grid for upsell during build process, plus subscription options.
 *
 * Endpoint: POST /api/session
 * Input:  { orderId: string }
 * Output: { name, email, location, pkg, pkgLabel, pkgPrice, eta, paypal_client_id, proRataGrid, subscriptionOptions }
 */

import { getActivePlans } from './_config/plans.js';

// Two-product model — replaces the old p1-p5 tiers.
const PRICES = { product1: 99, product2: 299.99 };
const LABELS = { product1: 'Launch', product2: 'Scale' };
const ETAs = { product1: '~10 mins', product2: '~25 mins' };

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalToken() {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    throw new Error(`PayPal token failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchPayPalOrder(orderId, token) {
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`PayPal order fetch failed: ${res.status}`);
  }

  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.body || {};

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'orderId required' });
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return res.status(500).json({ error: 'PayPal credentials not configured' });
  }

  try {
    const token = await getPayPalToken();
    const order = await fetchPayPalOrder(orderId, token);

    if (order.status !== 'COMPLETED' && order.status !== 'APPROVED') {
      console.warn(`Order ${orderId} status not complete: ${order.status}`);
      return res.status(402).json({ error: 'payment_not_complete' });
    }

    const customId = order.purchase_units?.[0]?.custom_id;
    if (!customId) {
      console.error(`Order ${orderId} missing custom_id`);
      return res.status(400).json({ error: 'invalid_custom_id' });
    }

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(customId, 'base64').toString('utf8'));
    } catch (e) {
      console.error(`Failed to decode custom_id for order ${orderId}:`, e.message);
      return res.status(400).json({ error: 'invalid_custom_id' });
    }

    if (!decoded.name || !decoded.email) {
      console.error(`Custom_id missing required fields for order ${orderId}`);
      return res.status(400).json({ error: 'invalid_custom_id' });
    }

    const pkg = decoded.pkg || 'product1';
    const currentPrice = PRICES[pkg] ?? PRICES.product1;

    // Two-product model has exactly one upgrade path: Product 1 -> Product 2.
    // Grid stays an array (build-status.html already iterates it) but it's
    // one card now instead of up to four.
    const proRataGrid = Object.entries(PRICES)
      .filter(([key]) => PRICES[key] > currentPrice)
      .map(([key, price]) => ({
        pkg: key,
        label: LABELS[key],
        retail_price: price,
        pro_rata_price: parseFloat((price - currentPrice).toFixed(2)),
        is_recommended: key === 'product2' && pkg === 'product1',
      }));

    const activePlans = getActivePlans();
    const subscriptionOptions = Object.entries(activePlans)
      .filter(([key]) => key !== 'product_id')
      .map(([tier, plan]) => ({
        tier,
        plan_id: plan.plan_id,
        label: plan.label,
        monthly_label: plan.monthly_label,
        price: plan.price,
        deliverables: {
          t1: ['Monthly SCOUT rescrape', '2 SEO blog posts', '2 Google Business updates'],
          t2: ['Everything in T1', '8 Canva design variations', '4 SPARK reel prompts'],
          t3: ['Everything in T2 at multi-quadrant scale', 'Live conversion feedback loop', 'Dynamic monthly prompt rewriting']
        }[tier],
        trial_days: 30
      }))
      .filter(opt => opt.plan_id !== null);

    // Infer business_type for legacy orders that predate the field
    const businessType = decoded.business_type || (
      /\b(ltd|limited|plc|llp|llc|inc|corp|group)\b/i.test(decoded.name || '')
        ? 'limited_company' : 'sole_trader'
    );

    return res.status(200).json({
      name: decoded.name,
      email: decoded.email,
      location: decoded.location || '',
      pkg,
      pkgLabel: LABELS[pkg] || pkg,
      pkgPrice: `£${currentPrice.toFixed(2)}`,
      eta: ETAs[pkg] || 'within the hour',
      business_type: businessType,
      paypal_client_id: process.env.PAYPAL_CLIENT_ID || null,
      proRataGrid,
      subscriptionOptions,
    });
  } catch (err) {
    console.error(`[SESSION] Failed to verify order:`, err.message);
    // Fail open with sane defaults rather than a raw 500 — build-status.html
    // still needs to render something for the client even if PayPal's API
    // is briefly unreachable. This mirrors the fallback object already
    // hardcoded further down in build-status.html for the no-orderId case.
    return res.status(200).json({
      name: '',
      email: '',
      location: '',
      pkg: 'product1',
      pkgLabel: LABELS.product1,
      pkgPrice: `£${PRICES.product1.toFixed(2)}`,
      eta: 'within the hour',
      business_type: 'sole_trader',
      paypal_client_id: process.env.PAYPAL_CLIENT_ID || null,
      proRataGrid: [],
      subscriptionOptions: [],
      warning: 'session_verification_failed',
    });
  }
}