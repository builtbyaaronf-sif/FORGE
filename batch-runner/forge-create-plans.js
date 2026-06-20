#!/usr/bin/env node
/**
 * FORGE — PayPal Billing Plans Creator
 * Creates Product + 3 Billing Plans (T1, T2, T3) in PayPal
 * Writes plan IDs to api/_config/plans.js
 * Idempotent: skips creation if valid plans already exist
 *
 * Usage: node batch-runner/forge-create-plans.js
 * Env vars required: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Load .env file manually ───────────────────────────────────────────────
async function loadEnv() {
  const envPath = path.join(__dirname, '.env')
  try {
    const content = await fs.readFile(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=')
        if (key && value) process.env[key] = value
      }
    })
  } catch (err) {
    console.warn(`⚠️  Could not load .env: ${err.message}`)
  }
}

await loadEnv()

// ──────────────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────────────

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('❌ Missing PayPal credentials: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET')
  process.exit(1)
}

const PAYPAL_BASE = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api-sandbox.paypal.com'

const TIERS = {
  t1: {
    price: 99,
    label: 'Local SEO Maintenance Engine',
    description: 'Monthly SCOUT rescrape, 2 SEO blog posts, 2 Google Business updates'
  },
  t2: {
    price: 249,
    label: 'Hyper-Local Dominator',
    description: 'Everything in T1 + 8 Canva design variations + 4 SPARK reel prompts'
  },
  t3: {
    price: 499,
    label: 'Total Agentic Dominance',
    description: 'Everything in T2 at multi-quadrant London scale + live conversion feedback loop'
  }
}

const PLANS_FILE = path.resolve(__dirname, '../api/_config/plans.js')

// ──────────────────────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────────────────────

async function getOAuthToken() {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OAuth failed: ${response.status} ${text}`)
  }

  const data = await response.json()
  return data.access_token
}

async function createProduct(token) {
  const response = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'FORGE Retainer Services',
      description: 'Monthly agentic marketing services for London tradespeople',
      type: 'SERVICE',
      category: 'SOFTWARE'
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Create product failed: ${response.status} ${text}`)
  }

  const data = await response.json()
  return data.id
}

async function createBillingPlan(token, productId, tier, tierConfig) {
  const response = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: productId,
      name: `FORGE ${tierConfig.label}`,
      description: tierConfig.description,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'TRIAL',
          sequence: 1,
          total_cycles: 1,
          pricing_scheme: {
            fixed_price: { value: '0', currency_code: 'GBP' }
          }
        },
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 2,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: String(tierConfig.price), currency_code: 'GBP' }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Create plan (${tier}) failed: ${response.status} ${text}`)
  }

  const data = await response.json()
  return data.id
}

async function readCurrentPlans() {
  try {
    const content = await fs.readFile(PLANS_FILE, 'utf-8')
    // Very basic extraction — look for { plan_id: 'I-...' in the content
    const modeBlock = content.includes(`sandbox:`) ? 'sandbox' : 'live'
    const hasIds = content.includes(`plan_id: 'I-`) || content.includes(`plan_id: "I-`)
    return { exists: true, hasIds, modeBlock }
  } catch {
    return { exists: false, hasIds: false, modeBlock: null }
  }
}

async function writePlansFile(productId, plans) {
  const timestamp = new Date().toISOString()
  const plansData = {
    sandbox: PAYPAL_MODE === 'sandbox'
      ? { product_id: productId, t1: { ...TIERS.t1, plan_id: plans.t1 }, t2: { ...TIERS.t2, plan_id: plans.t2 }, t3: { ...TIERS.t3, plan_id: plans.t3 } }
      : { product_id: null, t1: { ...TIERS.t1, plan_id: null }, t2: { ...TIERS.t2, plan_id: null }, t3: { ...TIERS.t3, plan_id: null } },
    live: PAYPAL_MODE === 'live'
      ? { product_id: productId, t1: { ...TIERS.t1, plan_id: plans.t1 }, t2: { ...TIERS.t2, plan_id: plans.t2 }, t3: { ...TIERS.t3, plan_id: plans.t3 } }
      : { product_id: null, t1: { ...TIERS.t1, plan_id: null }, t2: { ...TIERS.t2, plan_id: null }, t3: { ...TIERS.t3, plan_id: null } }
  }

  const jsContent = `// api/_config/plans.js
// AUTO-GENERATED by batch-runner/forge-create-plans.js
// DO NOT EDIT MANUALLY — run the script to regenerate
// Last generated: ${timestamp}

const PLANS = {
  sandbox: {
    product_id: ${plansData.sandbox.product_id ? `'${plansData.sandbox.product_id}'` : 'null'},
    t1: { plan_id: ${plansData.sandbox.t1.plan_id ? `'${plansData.sandbox.t1.plan_id}'` : 'null'}, price: ${TIERS.t1.price},  label: '${TIERS.t1.label}',  monthly_label: '£${TIERS.t1.price}/mo'  },
    t2: { plan_id: ${plansData.sandbox.t2.plan_id ? `'${plansData.sandbox.t2.plan_id}'` : 'null'}, price: ${TIERS.t2.price}, label: '${TIERS.t2.label}',         monthly_label: '£${TIERS.t2.price}/mo' },
    t3: { plan_id: ${plansData.sandbox.t3.plan_id ? `'${plansData.sandbox.t3.plan_id}'` : 'null'}, price: ${TIERS.t3.price}, label: '${TIERS.t3.label}',       monthly_label: '£${TIERS.t3.price}/mo' }
  },
  live: {
    product_id: ${plansData.live.product_id ? `'${plansData.live.product_id}'` : 'null'},
    ${PAYPAL_MODE === 'live' ? '' : '// Run forge-create-plans.js with PAYPAL_MODE=live to populate\n    '}t1: { plan_id: ${plansData.live.t1.plan_id ? `'${plansData.live.t1.plan_id}'` : 'null'}, price: ${TIERS.t1.price},  label: '${TIERS.t1.label}',  monthly_label: '£${TIERS.t1.price}/mo'  },
    t2: { plan_id: ${plansData.live.t2.plan_id ? `'${plansData.live.t2.plan_id}'` : 'null'}, price: ${TIERS.t2.price}, label: '${TIERS.t2.label}',         monthly_label: '£${TIERS.t2.price}/mo' },
    t3: { plan_id: ${plansData.live.t3.plan_id ? `'${plansData.live.t3.plan_id}'` : 'null'}, price: ${TIERS.t3.price}, label: '${TIERS.t3.label}',       monthly_label: '£${TIERS.t3.price}/mo' }
  }
}

export function getActivePlans() {
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox'
  return PLANS[mode]
}

export { PLANS }
`

  await fs.writeFile(PLANS_FILE, jsContent, 'utf-8')
  console.log(`✅ Wrote ${PLANS_FILE}`)
}

// ──────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔧 FORGE Plan Creator | Mode: ${PAYPAL_MODE.toUpperCase()}`)
  console.log(`📍 Base URL: ${PAYPAL_BASE}\n`)

  // Check if plans already exist
  const current = await readCurrentPlans()
  if (current.exists && current.hasIds && current.modeBlock === PAYPAL_MODE) {
    console.log(`✅ Plans already exist for ${PAYPAL_MODE}. Run with a different PAYPAL_MODE to create additional environment.`)
    process.exit(0)
  }

  try {
    console.log('🔑 Requesting OAuth token...')
    const token = await getOAuthToken()
    console.log('✅ OAuth token acquired\n')

    console.log('📦 Creating Product...')
    const productId = await createProduct(token)
    console.log(`✅ Product created: ${productId}\n`)

    const plans = {}
    for (const [tier, config] of Object.entries(TIERS)) {
      console.log(`📋 Creating billing plan: ${tier} (${config.label})...`)
      plans[tier] = await createBillingPlan(token, productId, tier, config)
      console.log(`✅ Plan created: ${plans[tier]}\n`)
    }

    console.log('💾 Writing plans.js...')
    await writePlansFile(productId, plans)

    console.log('\n✅ Complete!')
    console.log(`Product ID: ${productId}`)
    console.log(`T1 Plan ID: ${plans.t1}`)
    console.log(`T2 Plan ID: ${plans.t2}`)
    console.log(`T3 Plan ID: ${plans.t3}`)
    console.log(`\nTo create plans for the other environment, run:`)
    console.log(`PAYPAL_MODE=${PAYPAL_MODE === 'live' ? 'sandbox' : 'live'} node batch-runner/forge-create-plans.js`)
  } catch (err) {
    console.error(`❌ ${err.message}`)
    process.exit(1)
  }
}

main()
