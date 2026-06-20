// forge-runner.js
// Usage: node forge-runner.js "Business Name" "City, Country" "industry"

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'
import { SYSTEM_PROMPT, p0_designSystem, p1_researchBrief, p2_websiteHtml, p5_strategyPack } from './forge-prompts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODEL = process.env.FORGE_MODEL || 'claude-sonnet-4-6'
const OUTPUT_DIR = process.env.FORGE_OUTPUT_DIR || './outputs'

const [,, businessName, location, industry = 'general'] = process.argv

if (!businessName || !location) {
  console.error('Usage: node forge-runner.js "Business Name" "City, Country" "industry"')
  process.exit(1)
}

const slug = `${businessName}-${location}`
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const clientDir = path.join(__dirname, OUTPUT_DIR, slug)
fs.mkdirSync(clientDir, { recursive: true })

function getCompetitorData() {
  const inputFile = path.join(clientDir, 'competitors.txt')
  if (fs.existsSync(inputFile)) {
    console.log('  Using competitor data from competitors.txt')
    return fs.readFileSync(inputFile, 'utf8')
  }
  console.log('  No competitors.txt found — Claude will infer competitors')
  return `Infer typical competitors for a ${industry} business in ${location}. Focus on local competitors with strong online presence.`
}

async function run() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  console.log('\n FORGE — Digital Presence Builder')
  console.log('='.repeat(50))
  console.log(`  Client:   ${businessName}`)
  console.log(`  Location: ${location}`)
  console.log(`  Industry: ${industry}`)
  console.log(`  Slug:     ${slug}`)
  console.log('='.repeat(50))

  const competitorData = getCompetitorData()

  console.log('\nPhase 0: Design system lookup...')
  const p0Response = await client.messages.create({
    model: MODEL, max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: p0_designSystem(businessName, industry, location) }]
  })

  let designSystem
  try {
    designSystem = JSON.parse(p0Response.content[0].text)
    console.log(`  Design system: ${designSystem.system} (accent: ${designSystem.accent})`)
  } catch {
    console.log('  Design system parse failed, using Dark Bold fallback')
    designSystem = { system: 'Dark Bold', canvas: '#0A0A0A', accent: '#F59E0B', ink: '#FFFFFF', surface: '#141414' }
  }

  console.log('\nPhase 1: Research brief...')
  const p1Response = await client.messages.create({
    model: MODEL, max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: p1_researchBrief(businessName, location, industry, competitorData) }]
  })

  let brief
  try {
    const raw = p1Response.content[0].text.replace(/```json\n?|\n?```/g, '').trim()
    brief = JSON.parse(raw)
    console.log(`  Tagline: "${brief.tagline}"`)
    console.log(`  Positioning: "${brief.positioning_statement}"`)
    fs.writeFileSync(path.join(clientDir, 'brief.json'), JSON.stringify(brief, null, 2))
    console.log(`  Brief saved to outputs/${slug}/brief.json`)
  } catch (e) {
    console.error('  Brief parse failed:', e.message)
    console.error('  Raw:', p1Response.content[0].text.substring(0, 500))
    process.exit(1)
  }

  console.log('\nSubmitting batch job (P2: website + P5: strategy pack)...')
  const briefText = JSON.stringify(brief, null, 2)

  const batchJob = await client.beta.messages.batches.create({
    requests: [
      {
        custom_id: `${slug}__p2_website`,
        params: {
          model: MODEL, max_tokens: 8000,
          system: [{ type: 'text', text: SYSTEM_PROMPT }],
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `BRIEF:\n${briefText}`, cache_control: { type: 'ephemeral' } },
              { type: 'text', text: p2_websiteHtml(brief) }
            ]
          }]
        }
      },
      {
        custom_id: `${slug}__p5_strategy`,
        params: {
          model: MODEL, max_tokens: 8000,
          system: [{ type: 'text', text: SYSTEM_PROMPT }],
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `BRIEF:\n${briefText}`, cache_control: { type: 'ephemeral' } },
              { type: 'text', text: p5_strategyPack(brief) }
            ]
          }]
        }
      }
    ]
  })

  const jobState = {
    batch_id: batchJob.id, slug, business_name: businessName,
    location, industry, design_system: designSystem,
    brief_path: `outputs/${slug}/brief.json`,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    phases_remaining: ['P3_canva', 'P4_hubspot', 'P2b_vercel']
  }

  fs.writeFileSync(path.join(clientDir, 'job.json'), JSON.stringify(jobState, null, 2))

  console.log('\nBatch job submitted!')
  console.log('='.repeat(50))
  console.log(`  Batch ID: ${batchJob.id}`)
  console.log(`  Resolves: within 24 hours (usually <1 hour)`)
  console.log(`  Saved to: outputs/${slug}/job.json`)
  console.log('='.repeat(50))
  console.log(`\nNext: node forge-status.js ${slug}`)
  console.log(`Then: node forge-collect.js ${slug}\n`)
}

run().catch(err => { console.error('\nFORGE error:', err.message); process.exit(1) })