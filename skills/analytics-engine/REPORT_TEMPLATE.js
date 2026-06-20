/**
 * FORGE Analytics Engine — REPORT_TEMPLATE.js
 *
 * Generates a framework-less, high-impact HTML reporting email
 * for monthly client retention reports.
 *
 * Design system: Creative Dark
 *   Canvas:  #0a0a0a
 *   Accent:  #0099FF
 *   Green:   #4ade80
 *   Amber:   #F59E0B
 *   Red:     #ef4444
 *   Text:    #f5f5f5 (primary), #a3a3a3 (secondary)
 *   Font:    Space Grotesk (headings), Inter (body) — both Google Fonts
 *
 * Usage:
 *   import { generateReport } from './REPORT_TEMPLATE.js'
 *   const html = generateReport(reportData)
 *   // html is a complete, self-contained HTML string safe to send via Resend
 *
 * reportData schema:
 * {
 *   client: {
 *     name: string,
 *     trade: string,
 *     location: string,
 *     tier: 't1' | 't2' | 't3',
 *     tier_label: string,
 *   },
 *   cycle: string,          // e.g. "July 2026"
 *   metrics: {
 *     gbp_views: number,
 *     gbp_clicks: number,
 *     search_impressions: number,
 *     enquiries: number,
 *     keyword_position_delta: number, // positive = improved
 *     top_keyword: string,
 *     // T2+ only:
 *     instagram_reach?: number,
 *     reel_views?: number,
 *     // T3 only:
 *     quadrant_performance?: {
 *       north?: { enquiries, gbp_clicks, top_keyword },
 *       south?: { enquiries, gbp_clicks, top_keyword },
 *       east?:  { enquiries, gbp_clicks, top_keyword },
 *       west?:  { enquiries, gbp_clicks, top_keyword },
 *     }
 *   },
 *   deliverables: string[],  // list of what was done this month
 *   next_month: string[],    // what's queued for next cycle
 *   upgrade_flag?: {         // present if upgrade conditions triggered
 *     recommended_tier: 't2' | 't3',
 *     reason: string,
 *   },
 *   scout_directives?: {     // T3 only — next-month targeting changes
 *     increase_weight: string[],
 *     hold_weight: string[],
 *     reduce_weight: string[],
 *     new_keyword_targets: string[],
 *     drop_underperforming_keywords: string[],
 *   }
 * }
 */

const TIER_CONFIG = {
  t1: { label: 'Local SEO Maintenance Engine', price: '£99/mo',  colour: '#0099FF' },
  t2: { label: 'Hyper-Local Dominator',        price: '£249/mo', colour: '#0099FF' },
  t3: { label: 'Total Agentic Dominance',      price: '£499/mo', colour: '#0099FF' }
}

// ── Helper: metric card HTML ───────────────────────────────────────────────

function metricCard(label, value, unit = '', delta = null, highlight = false) {
  const deltaHtml = delta !== null
    ? `<div style="font-size:11px;margin-top:4px;color:${delta >= 0 ? '#4ade80' : '#ef4444'}">
         ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}${unit} vs last month
       </div>`
    : ''

  return `
    <td style="width:25%;padding:8px;">
      <div style="background:#141414;border:1px solid #262626;border-radius:12px;padding:16px 20px;${highlight ? 'border-color:#0099FF;' : ''}">
        <div style="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;letter-spacing:-0.04em;color:${highlight ? '#0099FF' : '#f5f5f5'}">
          ${value}<span style="font-size:14px;font-weight:500;color:#a3a3a3"> ${unit}</span>
        </div>
        <div style="font-size:12px;color:#a3a3a3;margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">${label}</div>
        ${deltaHtml}
      </div>
    </td>
  `
}

// ── Helper: deliverable row HTML ───────────────────────────────────────────

function deliverableRow(text, colour = '#4ade80') {
  return `
    <tr>
      <td style="padding:6px 0;border-bottom:1px solid #1a1a1a">
        <span style="color:${colour};font-size:13px;margin-right:10px">✓</span>
        <span style="font-size:14px;color:#f5f5f5">${text}</span>
      </td>
    </tr>
  `
}

// ── Helper: quadrant row (T3 only) ─────────────────────────────────────────

function quadrantRow(name, data) {
  if (!data) return ''
  return `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;font-size:13px;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.06em;width:20%">${name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;font-size:14px;color:#f5f5f5;font-weight:600">${data.enquiries}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;font-size:14px;color:#f5f5f5">${data.gbp_clicks.toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;font-size:12px;color:#a3a3a3">${data.top_keyword}</td>
    </tr>
  `
}

// ── Main export ─────────────────────────────────────────────────────────────

export function generateReport(data) {
  const { client, cycle, metrics, deliverables = [], next_month = [], upgrade_flag, scout_directives } = data
  const tier = TIER_CONFIG[client.tier] || TIER_CONFIG.t1
  const hasInstagram = metrics.instagram_reach !== undefined
  const hasQuadrants = metrics.quadrant_performance !== undefined

  // Build metric row
  const metricCards = [
    metricCard('GBP Views',         metrics.gbp_views?.toLocaleString() ?? '—',  '',    null,  false),
    metricCard('GBP Clicks',        metrics.gbp_clicks?.toLocaleString() ?? '—', '',    null,  false),
    metricCard('Search Impressions',metrics.search_impressions?.toLocaleString() ?? '—', '', null, false),
    metricCard('Enquiries',         metrics.enquiries ?? '—', '', null, true),
  ].join('')

  const socialCards = hasInstagram ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:8px">
      <tr>
        ${metricCard('Instagram Reach',  metrics.instagram_reach?.toLocaleString() ?? '—', '', null, false)}
        ${metricCard('Reel Views',       metrics.reel_views?.toLocaleString()       ?? '—', '', null, false)}
        <td style="width:50%;padding:8px"></td>
        <td style="width:25%;padding:8px"></td>
      </tr>
    </table>
  ` : ''

  // Quadrant table (T3)
  const quadrantTable = hasQuadrants ? `
    <div style="margin-top:32px">
      <div style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Quadrant Performance</div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid #262626;border-radius:10px;overflow:hidden">
        <thead>
          <tr style="background:#141414">
            <th style="padding:10px 12px;font-size:11px;color:#a3a3a3;text-align:left;text-transform:uppercase;letter-spacing:0.06em">Zone</th>
            <th style="padding:10px 12px;font-size:11px;color:#a3a3a3;text-align:left;text-transform:uppercase;letter-spacing:0.06em">Enquiries</th>
            <th style="padding:10px 12px;font-size:11px;color:#a3a3a3;text-align:left;text-transform:uppercase;letter-spacing:0.06em">GBP Clicks</th>
            <th style="padding:10px 12px;font-size:11px;color:#a3a3a3;text-align:left;text-transform:uppercase;letter-spacing:0.06em">Top Keyword</th>
          </tr>
        </thead>
        <tbody>
          ${quadrantRow('North', metrics.quadrant_performance?.north)}
          ${quadrantRow('South', metrics.quadrant_performance?.south)}
          ${quadrantRow('East',  metrics.quadrant_performance?.east)}
          ${quadrantRow('West',  metrics.quadrant_performance?.west)}
        </tbody>
      </table>
    </div>
  ` : ''

  // Scout directives (T3)
  const directivesBlock = scout_directives ? `
    <div style="margin-top:32px;background:#0d1117;border:1px solid #1a2744;border-radius:12px;padding:24px">
      <div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:#0099FF;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">SCOUT Directives — Next Cycle</div>
      ${scout_directives.increase_weight?.length ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.06em">Increase weight: </span><span style="font-size:13px;color:#4ade80">${scout_directives.increase_weight.join(', ')}</span></div>` : ''}
      ${scout_directives.reduce_weight?.length  ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.06em">Reduce weight: </span><span style="font-size:13px;color:#a3a3a3">${scout_directives.reduce_weight.join(', ')}</span></div>` : ''}
      ${scout_directives.new_keyword_targets?.length ? `<div style="margin-bottom:8px"><span style="font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.06em">New targets: </span><span style="font-size:13px;color:#f5f5f5">${scout_directives.new_keyword_targets.join(' · ')}</span></div>` : ''}
      ${scout_directives.drop_underperforming_keywords?.length ? `<div><span style="font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.06em">Dropping: </span><span style="font-size:13px;color:#a3a3a3;text-decoration:line-through">${scout_directives.drop_underperforming_keywords.join(', ')}</span></div>` : ''}
    </div>
  ` : ''

  // Upgrade flag
  const upgradeBlock = upgrade_flag ? `
    <div style="margin-top:32px;background:#0d1a00;border:1px solid #4ade80;border-radius:12px;padding:24px">
      <div style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:800;color:#4ade80;margin-bottom:8px">🚀 You're Ready to Scale</div>
      <div style="font-size:14px;color:#f5f5f5;line-height:1.6;margin-bottom:16px">${upgrade_flag.reason}</div>
      <div style="display:inline-block">
        <a href="https://forgeisagentic.tech" style="display:inline-block;background:#0099FF;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;letter-spacing:0.02em">
          Upgrade to ${TIER_CONFIG[upgrade_flag.recommended_tier]?.label}
        </a>
      </div>
    </div>
  ` : ''

  // Next month list
  const nextMonthItems = next_month.map(item =>
    `<li style="padding:4px 0;font-size:14px;color:#a3a3a3;list-style:none">
       <span style="color:#0099FF;margin-right:8px">→</span>${item}
     </li>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>FORGE Monthly Report — ${client.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#000;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased">

  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#000;min-height:100vh">
    <tr>
      <td align="center" style="padding:40px 16px">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="max-width:640px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:20px;overflow:hidden">

          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#001a33 0%,#0a0a0a 100%);padding:32px 40px 24px;border-bottom:1px solid #1a1a1a">
              <div style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;color:#0099FF;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:12px">FORGE — Monthly Intelligence Report</div>
              <div style="font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:800;color:#f5f5f5;letter-spacing:-0.04em;line-height:1.1">${client.name}</div>
              <div style="font-size:14px;color:#a3a3a3;margin-top:6px">${client.trade} · ${client.location} · ${cycle}</div>
              <div style="display:inline-block;margin-top:14px;background:#0d1a2d;border:1px solid #0099FF33;border-radius:100px;padding:4px 14px">
                <span style="font-size:11px;font-weight:700;color:#0099FF;letter-spacing:0.06em;text-transform:uppercase">${tier.label}</span>
                <span style="font-size:11px;color:#a3a3a3;margin-left:6px">${tier.price}</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px">

              <!-- Metrics -->
              <div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">This Month's Numbers</div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-left:-8px;width:calc(100% + 16px)">
                <tr>${metricCards}</tr>
              </table>
              ${socialCards}

              ${quadrantTable}

              <!-- Deliverables -->
              <div style="margin-top:36px">
                <div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Delivered This Cycle</div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tbody>
                    ${deliverables.map(d => deliverableRow(d)).join('')}
                  </tbody>
                </table>
              </div>

              ${directivesBlock}
              ${upgradeBlock}

              <!-- Next month -->
              ${next_month.length ? `
              <div style="margin-top:32px;background:#141414;border:1px solid #262626;border-radius:12px;padding:24px">
                <div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Next Cycle — Queued</div>
                <ul style="margin:0;padding:0">${nextMonthItems}</ul>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#080808;border-top:1px solid #1a1a1a;padding:24px 40px">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:#0099FF">FORGE</div>
                    <div style="font-size:12px;color:#525252;margin-top:2px">The World's First Fully Agentic Marketing Department</div>
                  </td>
                  <td align="right" style="vertical-align:middle">
                    <a href="https://forgeisagentic.tech" style="font-size:12px;color:#a3a3a3;text-decoration:none">forgeisagentic.tech</a>
                  </td>
                </tr>
              </table>
              <div style="margin-top:16px;font-size:11px;color:#383838;line-height:1.6">
                This report was generated automatically by the FORGE Analytics Engine as part of your ${tier.label} retainer.
                To manage your subscription, visit forgeisagentic.tech or reply to this email.
              </div>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`
}

// ── CLI usage: node REPORT_TEMPLATE.js ────────────────────────────────────
// Outputs a sample report to stdout for visual testing

if (process.argv[1] && process.argv[1].endsWith('REPORT_TEMPLATE.js')) {
  const sample = {
    client: { name: "Dave's Plumbing", trade: 'Plumber', location: 'South London', tier: 't2', tier_label: 'Hyper-Local Dominator' },
    cycle: 'July 2026',
    metrics: {
      gbp_views: 1240,
      gbp_clicks: 87,
      search_impressions: 4300,
      enquiries: 14,
      keyword_position_delta: 3,
      top_keyword: 'emergency plumber Clapham',
      instagram_reach: 3200,
      reel_views: 980
    },
    deliverables: [
      '2 SEO blog post outlines published',
      '2 Google Business Profile posts',
      '8 Canva social design variations',
      '4 SPARK short-form reel prompt briefs',
      'Monthly SCOUT keyword rescrape completed'
    ],
    next_month: [
      'Expand keyword targeting to Wandsworth',
      'New before/after reel on boiler replacement',
      'GBP post for ULEZ-compliant fleet callout'
    ],
    upgrade_flag: null
  }

  process.stdout.write(generateReport(sample))
}
