import htmlPdf from 'html-pdf-node';
import { put } from '@vercel/blob';

// LEDGER — receivables tracker. Simplified scope per FORGE_PRODUCT_ARCHITECTURE_v2.md:
// records what's owed and what's been paid. Not bookkeeping, not VAT-ready.
//
// Trigger: a Zapier zap watching "HubSpot deal stage = Closed Won" POSTs here.
// Same zap also fires PULSE's review-request flow — one HubSpot trigger,
// two downstream actions, rather than two separate Zapier watchers on the
// same event.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BLOB_READ_WRITE_TOKEN,
// RESEND_API_KEY, RESEND_FROM_EMAIL

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function insertInvoice(record) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/forge_invoices`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(record),
  });
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

function buildInvoiceHtml(invoice) {
  const amount = (invoice.amount_pence / 100).toFixed(2);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#111;margin:0;padding:0}
    .wrap{max-width:640px;margin:0 auto;padding:48px 40px}
    .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px}
    .brand{font-size:22px;font-weight:800;letter-spacing:-0.5px}
    .brand span{color:#0099FF}
    .meta{text-align:right;font-size:13px;color:#666;line-height:1.6}
    h1{font-size:20px;font-weight:700;margin:0 0 24px}
    table{width:100%;border-collapse:collapse;margin-bottom:32px}
    th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#888;padding:8px 0;border-bottom:2px solid #111}
    td{padding:16px 0;border-bottom:1px solid #eee;font-size:14px}
    .amount{text-align:right;font-weight:700}
    .total-row td{border-bottom:none;font-size:18px;font-weight:800;padding-top:20px}
    .footer{margin-top:48px;padding-top:24px;border-top:1px solid #eee;font-size:12px;color:#888;line-height:1.6}
  </style></head><body><div class="wrap">
    <div class="head">
      <div class="brand">FORGE<span>.</span></div>
      <div class="meta">
        Invoice date: ${new Date(invoice.created_at || Date.now()).toLocaleDateString('en-GB')}<br>
        Due: ${new Date(invoice.due_date).toLocaleDateString('en-GB')}
      </div>
    </div>
    <h1>Invoice for ${invoice.customer_name}</h1>
    <table>
      <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
      <tr><td>${invoice.description || 'Services rendered'}</td><td class="amount">£${amount}</td></tr>
      <tr class="total-row"><td>Total due</td><td class="amount">£${amount}</td></tr>
    </table>
    <div class="footer">
      This records what's owed for work completed. It is not a VAT invoice
      unless stated separately. Questions: sales@forgeisagentic.tech
    </div>
  </div></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[LEDGER] Supabase not configured');
      return res.status(500).json({ error: 'Storage not configured' });
    }

    const body = req.body || {};
    const clientSlug      = String(body.client_slug || '').trim();
    const hubspotDealId   = String(body.hubspot_deal_id || '').trim();
    const customerName    = String(body.customer_name || '').trim();
    const customerEmail   = String(body.customer_email || '').trim();
    const amountPence     = Number(body.amount_pence);
    const description     = String(body.description || '').trim();

    if (!clientSlug || !hubspotDealId || !customerName || !customerEmail || !Number.isFinite(amountPence) || amountPence <= 0) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // net 14 by default

    const record = {
      client_slug: clientSlug,
      hubspot_deal_id: hubspotDealId,
      customer_name: customerName,
      customer_email: customerEmail,
      amount_pence: Math.round(amountPence),
      due_date: dueDate.toISOString().slice(0, 10),
    };

    // Idempotency: the unique index on hubspot_deal_id does the real
    // enforcement at the DB level. HubSpot/Zapier can and will redeliver
    // events — a 23505 (unique_violation) here means "already invoiced",
    // not an error worth alerting on.
    const inserted = await insertInvoice(record);
    if (!inserted.ok) {
      if (inserted.status === 409 || (inserted.body && inserted.body.code === '23505')) {
        console.log(`[LEDGER] Deal ${hubspotDealId} already invoiced, skipping duplicate`);
        return res.status(200).json({ received: true, status: 'duplicate_ignored' });
      }
      console.error('[LEDGER] Insert failed:', inserted.body);
      return res.status(500).json({ error: 'Could not create invoice record' });
    }

    const invoice = Array.isArray(inserted.body) ? inserted.body[0] : inserted.body;
    invoice.description = description;

    // ── PDF generation ────────────────────────────────────────────────────
    let pdfUrl = null;
    try {
      const html = buildInvoiceHtml(invoice);
      const pdfBuffer = await htmlPdf.generatePdf({ content: html }, { format: 'A4' });
      const blob = await put(
        `invoices/${clientSlug}/${invoice.id}.pdf`,
        pdfBuffer,
        { access: 'public', contentType: 'application/pdf', token: process.env.BLOB_READ_WRITE_TOKEN }
      );
      pdfUrl = blob.url;

      await fetch(`${SUPABASE_URL}/rest/v1/forge_invoices?id=eq.${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_pdf_url: pdfUrl, updated_at: new Date().toISOString() }),
      });
    } catch (pdfErr) {
      // Don't fail the whole request over a PDF render hiccup — the
      // receivable is already recorded, which is the part that matters most.
      console.error('[LEDGER] PDF generation failed, invoice record still created:', pdfErr.message);
    }

    // ── Email the customer ──────────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      const amount = (invoice.amount_pence / 100).toFixed(2);
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: [customerEmail],
          subject: `Invoice from ${clientSlug} — £${amount} due`,
          html: `<p>Hi ${customerName},</p><p>Here's your invoice for £${amount}, due ${new Date(record.due_date).toLocaleDateString('en-GB')}.</p>${pdfUrl ? `<p><a href="${pdfUrl}">Download invoice (PDF)</a></p>` : '<p>Your PDF invoice is being finalised and will follow shortly.</p>'}`,
        }),
      }).catch(err => console.error('[LEDGER] Customer email failed:', err.message));
    }

    console.log(`[LEDGER] Invoice created for deal ${hubspotDealId}, client ${clientSlug}, £${(invoice.amount_pence / 100).toFixed(2)}`);
    return res.status(200).json({ received: true, invoice_id: invoice.id, pdf_url: pdfUrl });
  } catch (err) {
    console.error('[LEDGER] Unhandled error:', err);
    return res.status(500).json({ error: 'Invoice creation failed' });
  }
}
