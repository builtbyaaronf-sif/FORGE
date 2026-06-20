/**
 * FORGE — SPARK Runner [CLI Entry Point]
 *
 * Usage (from an existing brief.json):
 *   node forge-spark-runner.js [slug]
 *
 * Usage (fresh client, no prior brief):
 *   node forge-spark-runner.js "Business Name" "trade" "north|south|east|west" ["keyword1,keyword2"]
 *
 * Examples:
 *   node forge-spark-runner.js dave-plumbing-london
 *   node forge-spark-runner.js "Dave's Plumbing" "plumber" "south" "boiler repair,emergency plumber"
 *
 * Output:
 *   outputs/[slug]/spark-job.json  → batch job state
 *   Then: node forge-spark-collect.js [slug]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'
import { runSparkBatch } from './forge-spark-engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = process.env.FORGE_OUTPUT_DIR || './outputs'

const args = process.argv.slice(2)

if (!args.length) {
  console.error('Usage: node forge-spark-runner.js [slug]')
  console.error('    OR node forge-spark-runner.js "Business Name" "trade" "north|south|east|west"')
  process.exit(1)
}

async function run() {
  let clientData, brief, slug

  // ── Mode 1: slug provided — read existing brief.json ──────────────────
  if (args.length === 1) {
    slug = args[0]
    const clientDir = path.join(__dirname, OUTPUT_DIR, slug)
    const briefPath = path.join(clientDir, 'brief.json')

    if (!fs.existsSync(briefPath)) {
      console.error(`No brief.json found at: ${briefPath}`)
      console.error('Run forge-runner.js first to generate a brief, or pass full client args.')
      process.exit(1)
    }

    brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'))
    clientData = {
      name: brief.business_name,
      trade: brief.industry || 'trades',
      sector: brief.london_sector || 'south',  // set in brief.json if available
      coreKeywords: brief.seo_keywords || []
    }

    console.log(`\nFORGE — SPARK Content Engine`)
    console.log('='.repeat(50))
    console.log(`  Client: ${brief.business_name}`)
    console.log(`  Trade:  ${clientData.trade}`)
    console.log(`  Sector: ${clientData.sector} London`)
    console.log(`  Brief:  outputs/${slug}/brief.json`)
    console.log('='.repeat(50))
  }

  // ── Mode 2: full args — build clientData inline ─────────────────────
  else {
    const [businessName, trade, sector = 'south', keywordsRaw = ''] = args
    slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const coreKeywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()) : []

    clientData = { name: businessName, trade, sector, coreKeywords }

    // Try to load an existing brief — fall back to minimal stub
    const clientDir = path.join(__dirname, OUTPUT_DIR, slug)
    const briefPath = path.join(clientDir, 'brief.json')

    if (fs.existsSync(briefPath)) {
      brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'))
      console.log(`  Brief found: outputs/${slug}/brief.json`)
    } else {
      // Minimal brief stub — SPARK will infer the rest from geo context
      brief = {
        business_name: businessName,
        industry: trade,
        tagline: `Professional ${trade} across ${sector} London`,
        positioning_statement: `${businessName} — the trusted local ${trade} in ${sector} London.`,
        primary_messaging_angle: 'speed and local expertise',
        services: [{ name: trade, description: `Professional ${trade} services` }],
        usps: ['Fast response', 'ULEZ compliant', 'Upfront pricing'],
        design_system: 'Dark Bold',
        accent_colour: '#F59E0B',
        canvas_colour: '#0A0A0A'
      }
      fs.mkdirSync(clientDir, { recursive: true })
      console.log(`  No brief.json found — using minimal stub (SPARK will enrich)`)
    }

    console.log(`\nFORGE — SPARK Content Engine`)
    console.log('='.repeat(50))
    console.log(`  Client:  ${businessName}`)
    console.log(`  Trade:   ${trade}`)
    console.log(`  Sector:  ${sector} London`)
    console.log(`  Keywords: ${coreKeywords.join(', ') || 'auto-generated'}`)
    console.log('='.repeat(50))
  }

  // ── Submit SPARK batch ────────────────────────────────────────────────
  const { batch_id } = await runSparkBatch(clientData, brief)
  const clientDir = path.join(__dirname, OUTPUT_DIR, slug)

  const sparkJob = {
    batch_id,
    slug,
    business_name: clientData.name,
    trade: clientData.trade,
    sector: clientData.sector,
    submitted_at: new Date().toISOString(),
    status: 'pending'
  }

  fs.mkdirSync(clientDir, { recursive: true })
  fs.writeFileSync(path.join(clientDir, 'spark-job.json'), JSON.stringify(sparkJob, null, 2))

  console.log('\nSPARK batch submitted!')
  console.log('='.repeat(50))
  console.log(`  Batch ID: ${batch_id}`)
  console.log(`  Resolves: within 24 hours (usually <1 hour)`)
  console.log(`  Saved to: outputs/${slug}/spark-job.json`)
  console.log('='.repeat(50))
  console.log(`\nNext: node forge-spark-collect.js ${slug}\n`)
}

run().catch(err => {
  console.error('\n[SPARK] Error:', err.message)
  process.exit(1)
})
