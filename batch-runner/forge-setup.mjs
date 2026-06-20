// forge-setup.js
// Run this once: node forge-setup.js
// It creates every file FORGE needs in the current directory.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const files = {
  'package.json': `{
  "name": "forge-agent",
  "version": "1.0.0",
  "description": "FORGE — AI-powered marketing agency batch runner",
  "type": "module",
  "scripts": {
    "run": "node forge-runner.js",
    "status": "node forge-status.js",
    "collect": "node forge-collect.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "dotenv": "^16.4.5"
  }
}`,

  '.env.example': `# FORGE Environment Config
# Copy this to .env and fill in your values

ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: override model (default is claude-sonnet-4-6)
FORGE_MODEL=claude-sonnet-4-6

# Output directory for generated files
FORGE_OUTPUT_DIR=./outputs`,

  '.gitignore': `# Environment — never commit your API key
.env

# Generated outputs
outputs/

# Node
node_modules/

# OS
.DS_Store
Thumbs.db`,

  'forge-prompts.js': `// forge-prompts.js
export const SYSTEM_PROMPT = \`You are FORGE — an autonomous AI marketing agent.
You build complete digital presences for small businesses with speed and precision.
You respond only with the requested output — no preamble, no explanation, no markdown fences.
All output must be valid for its declared format (JSON, HTML, etc).\`

export function p0_designSystem(businessName, industry, location) {
  return \`Select the correct design system for this business.

Business: \${businessName}
Industry: \${industry}
Location: \${location}

Design systems:
- Dark Bold: trades, construction, auto. Canvas #0A0A0A, accent #F59E0B amber
- Light Luxury: health, beauty, wellness, spa. Canvas #FDFCFB, accent #9B7EBD purple
- Warm Artisan: food, coffee, bakery, florist. Canvas #FEFBF6, accent #C8773A amber
- Dark Precision: tech, repair, digital, IT. Canvas #08090A, accent #5E6AD2 indigo
- Clean Pro: professional, legal, finance. Canvas #FFFFFF, accent #0071E3 blue
- Creative Dark: agency, media, photography. Canvas #090909, accent #FF3BFF pink

Respond with ONLY valid JSON, no other text:
{
  "system": "Dark Bold",
  "canvas": "#0A0A0A",
  "accent": "#F59E0B",
  "ink": "#FFFFFF",
  "surface": "#141414",
  "tagline_style": "bold, direct, local trades",
  "cta_style": "white pill buttons"
}\`
}

export function p1_researchBrief(businessName, location, industry, competitorData) {
  return \`You are FORGE's intelligence module. Synthesise a strategic brief for this business.

Business: \${businessName}
Location: \${location}
Industry: \${industry}

Competitor intelligence gathered:
\${competitorData}

Produce a complete strategic brief. Respond with ONLY valid JSON:
{
  "business_name": "\${businessName}",
  "slug": "business-location",
  "location": "\${location}",
  "industry": "\${industry}",
  "tagline": "One punchy line for the hero",
  "positioning_statement": "Full positioning sentence",
  "primary_messaging_angle": "The angle that wins vs competitors",
  "services": [
    { "name": "Service name", "description": "One line description" }
  ],
  "usps": ["USP 1", "USP 2", "USP 3"],
  "about": "2-3 sentence about the business, warm and credible",
  "competitors": [
    {
      "name": "Competitor name",
      "strength": "What they do well",
      "gap": "Their weakness to exploit"
    }
  ],
  "swot": {
    "strengths": ["S1", "S2", "S3"],
    "weaknesses": ["W1", "W2"],
    "opportunities": ["O1", "O2", "O3"],
    "threats": ["T1", "T2"]
  },
  "design_system": "Dark Bold",
  "accent_colour": "#F59E0B",
  "canvas_colour": "#0A0A0A",
  "phone": "020 1234 5678",
  "email": "hello@business.co.uk",
  "data_quality": "inferred"
}\`
}

export function p2_websiteHtml(brief) {
  return \`You are FORGE's website builder. Generate a complete, premium single-page website.

Use the BRIEF provided above.

REQUIREMENTS:
- Single HTML file, everything inline (HTML + CSS + JS)
- Design system: \${brief.design_system} (canvas: \${brief.canvas_colour}, accent: \${brief.accent_colour})
- Inter Variable font from Google Fonts
- Letter-spacing: -0.04em on all headings
- Glass nav: backdrop-filter blur(16px)
- Chromatic hover shadows using accent colour
- IntersectionObserver reveal animations
- Mobile hamburger menu
- Sections: nav, hero, trust strip, services grid, about + stats, contact + form, footer
- Contact form with fake submit handler (no backend)
- All content from brief — no placeholder text

Output ONLY the complete HTML document starting with <!DOCTYPE html>.\`
}

export function p5_strategyPack(brief) {
  return \`You are FORGE's strategy writer. Generate a complete client strategy pack as a single HTML file.

Use the BRIEF provided above.

REQUIREMENTS:
- Dark bold theme matching the website (canvas: \${brief.canvas_colour}, accent: \${brief.accent_colour})
- Inter font
- Sections: cover, what we built, competitive landscape table, positioning statement + 3 angles, SWOT grid, 4 goals with timelines, 90-day roadmap (3 phases), top 5 recommendations, success metrics
- Every section must reference real data from the brief — no generic filler
- Fully self-contained HTML + CSS

Output ONLY the complete HTML document starting with <!DOCTYPE html>.\`
}`,

  'forge-runner.js': `// forge-runner.js
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

const slug = \`\${businessName}-\${location}\`
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
  return \`Infer typical competitors for a \${industry} business in \${location}. Focus on local competitors with strong online presence.\`
}

async function run() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  console.log('\\n FORGE — Digital Presence Builder')
  console.log('='.repeat(50))
  console.log(\`  Client:   \${businessName}\`)
  console.log(\`  Location: \${location}\`)
  console.log(\`  Industry: \${industry}\`)
  console.log(\`  Slug:     \${slug}\`)
  console.log('='.repeat(50))

  const competitorData = getCompetitorData()

  console.log('\\nPhase 0: Design system lookup...')
  const p0Response = await client.messages.create({
    model: MODEL, max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: p0_designSystem(businessName, industry, location) }]
  })

  let designSystem
  try {
    designSystem = JSON.parse(p0Response.content[0].text)
    console.log(\`  Design system: \${designSystem.system} (accent: \${designSystem.accent})\`)
  } catch {
    console.log('  Design system parse failed, using Dark Bold fallback')
    designSystem = { system: 'Dark Bold', canvas: '#0A0A0A', accent: '#F59E0B', ink: '#FFFFFF', surface: '#141414' }
  }

  console.log('\\nPhase 1: Research brief...')
  const p1Response = await client.messages.create({
    model: MODEL, max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: p1_researchBrief(businessName, location, industry, competitorData) }]
  })

  let brief
  try {
    const raw = p1Response.content[0].text.replace(/\`\`\`json\\n?|\\n?\`\`\`/g, '').trim()
    brief = JSON.parse(raw)
    console.log(\`  Tagline: "\${brief.tagline}"\`)
    console.log(\`  Positioning: "\${brief.positioning_statement}"\`)
    fs.writeFileSync(path.join(clientDir, 'brief.json'), JSON.stringify(brief, null, 2))
    console.log(\`  Brief saved to outputs/\${slug}/brief.json\`)
  } catch (e) {
    console.error('  Brief parse failed:', e.message)
    console.error('  Raw:', p1Response.content[0].text.substring(0, 500))
    process.exit(1)
  }

  console.log('\\nSubmitting batch job (P2: website + P5: strategy pack)...')
  const briefText = JSON.stringify(brief, null, 2)

  const batchJob = await client.beta.messages.batches.create({
    requests: [
      {
        custom_id: \`\${slug}__p2_website\`,
        params: {
          model: MODEL, max_tokens: 8000,
          system: [{ type: 'text', text: SYSTEM_PROMPT }],
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: \`BRIEF:\\n\${briefText}\`, cache_control: { type: 'ephemeral' } },
              { type: 'text', text: p2_websiteHtml(brief) }
            ]
          }]
        }
      },
      {
        custom_id: \`\${slug}__p5_strategy\`,
        params: {
          model: MODEL, max_tokens: 8000,
          system: [{ type: 'text', text: SYSTEM_PROMPT }],
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: \`BRIEF:\\n\${briefText}\`, cache_control: { type: 'ephemeral' } },
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
    brief_path: \`outputs/\${slug}/brief.json\`,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    phases_remaining: ['P3_canva', 'P4_hubspot', 'P2b_vercel']
  }

  fs.writeFileSync(path.join(clientDir, 'job.json'), JSON.stringify(jobState, null, 2))

  console.log('\\nBatch job submitted!')
  console.log('='.repeat(50))
  console.log(\`  Batch ID: \${batchJob.id}\`)
  console.log(\`  Resolves: within 24 hours (usually <1 hour)\`)
  console.log(\`  Saved to: outputs/\${slug}/job.json\`)
  console.log('='.repeat(50))
  console.log(\`\\nNext: node forge-status.js \${slug}\`)
  console.log(\`Then: node forge-collect.js \${slug}\\n\`)
}

run().catch(err => { console.error('\\nFORGE error:', err.message); process.exit(1) })`,

  'forge-status.js': `// forge-status.js
// Usage: node forge-status.js [slug]

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = process.env.FORGE_OUTPUT_DIR || './outputs'
const [,, slug] = process.argv

async function checkStatus(targetSlug) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const outputDir = path.join(__dirname, OUTPUT_DIR)
  let jobs = []

  if (targetSlug) {
    const jobPath = path.join(outputDir, targetSlug, 'job.json')
    if (!fs.existsSync(jobPath)) { console.error(\`No job found for: \${targetSlug}\`); process.exit(1) }
    jobs = [JSON.parse(fs.readFileSync(jobPath, 'utf8'))]
  } else {
    if (!fs.existsSync(outputDir)) { console.log('No jobs yet.'); return }
    for (const dir of fs.readdirSync(outputDir)) {
      const jobPath = path.join(outputDir, dir, 'job.json')
      if (fs.existsSync(jobPath)) jobs.push(JSON.parse(fs.readFileSync(jobPath, 'utf8')))
    }
  }

  if (!jobs.length) { console.log('No FORGE jobs found.'); return }
  console.log('\\nFORGE — Batch Status')
  console.log('='.repeat(50))

  for (const job of jobs) {
    const batch = await client.beta.messages.batches.retrieve(job.batch_id)
    const counts = batch.request_counts
    const done = counts.succeeded + counts.errored
    const total = done + counts.processing + (counts.canceled || 0) + (counts.expired || 0)

    console.log(\`\\n\${job.business_name} (\${job.location})\`)
    console.log(\`  Batch ID: \${job.batch_id}\`)
    console.log(\`  Status:   \${batch.processing_status}\`)
    console.log(\`  Progress: \${done}/\${total} complete\`)
    if (counts.succeeded) console.log(\`  Succeeded: \${counts.succeeded}\`)
    if (counts.errored)   console.log(\`  Errored:   \${counts.errored}\`)
    if (counts.processing) console.log(\`  Processing: \${counts.processing}\`)

    if (batch.processing_status === 'ended') {
      console.log(\`\\n  Ready! Run: node forge-collect.js \${job.slug}\`)
    }

    job.batch_status = batch.processing_status
    fs.writeFileSync(path.join(outputDir, job.slug, 'job.json'), JSON.stringify(job, null, 2))
  }
  console.log('\\n' + '='.repeat(50) + '\\n')
}

checkStatus(slug).catch(err => { console.error('Status error:', err.message); process.exit(1) })`,

  'forge-collect.js': `// forge-collect.js
// Usage: node forge-collect.js [slug]

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = process.env.FORGE_OUTPUT_DIR || './outputs'
const [,, slug] = process.argv

if (!slug) { console.error('Usage: node forge-collect.js [slug]'); process.exit(1) }

async function collect() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const clientDir = path.join(__dirname, OUTPUT_DIR, slug)
  const job = JSON.parse(fs.readFileSync(path.join(clientDir, 'job.json'), 'utf8'))
  const brief = JSON.parse(fs.readFileSync(path.join(__dirname, job.brief_path), 'utf8'))

  console.log('\\nFORGE — Collecting Results')
  console.log('='.repeat(50))
  console.log(\`  Client:   \${job.business_name}\`)
  console.log(\`  Batch ID: \${job.batch_id}\`)

  const batch = await client.beta.messages.batches.retrieve(job.batch_id)
  if (batch.processing_status !== 'ended') {
    const c = batch.request_counts
    console.log(\`\\nNot ready yet (\${batch.processing_status})\`)
    console.log(\`\${c.succeeded} done, \${c.processing} still processing\`)
    console.log(\`\\nTry again: node forge-collect.js \${slug}\`)
    process.exit(0)
  }

  console.log('\\nCollecting results...')
  const results = {}

  for await (const result of await client.beta.messages.batches.results(job.batch_id)) {
    const phase = result.custom_id.split('__')[1]
    if (result.result.type === 'succeeded') {
      results[phase] = result.result.message.content[0].text
      const u = result.result.message.usage
      const cacheRead = u.cache_read_input_tokens || 0
      const cacheWrite = u.cache_creation_input_tokens || 0
      const cost = ((u.input_tokens * 1.5) + (u.output_tokens * 7.5) + (cacheRead * 0.15) + (cacheWrite * 1.875)) / 1_000_000
      const cacheTag = cacheRead > 0 ? \` | cache hit: \${cacheRead} tokens saved\` : \` | cache write: \${cacheWrite} tokens\`
      console.log(\`  \${phase}: \${u.output_tokens} output tokens | $\${cost.toFixed(4)}\${cacheTag}\`)
    } else {
      console.log(\`  \${phase}: FAILED — \${result.result.error?.message}\`)
    }
  }

  if (results['p2_website']) {
    const html = results['p2_website'].replace(/^\`\`\`html\\n?|\\n?\`\`\`$/g, '').trim()
    fs.writeFileSync(path.join(clientDir, 'index.html'), html)
    console.log(\`\\n  Website saved: outputs/\${slug}/index.html\`)
  }

  if (results['p5_strategy']) {
    const html = results['p5_strategy'].replace(/^\`\`\`html\\n?|\\n?\`\`\`$/g, '').trim()
    fs.writeFileSync(path.join(clientDir, 'strategy-pack.html'), html)
    console.log(\`  Strategy pack saved: outputs/\${slug}/strategy-pack.html\`)
  }

  console.log('\\nReal-time MCP phases — run these in Claude Desktop:')
  console.log('='.repeat(50))
  console.log(\`  1. "Deploy outputs/\${slug}/index.html to Vercel as project \${slug}"\`)
  console.log(\`  2. "Create 3 Canva brand assets for \${brief.business_name}: Instagram post, Facebook cover, business card. Design system: \${brief.design_system}, accent: \${brief.accent_colour}"\`)
  console.log(\`  3. "Create HubSpot company for \${brief.business_name}, \${brief.location}, closed deal £750 Digital Presence Package"\`)
  console.log('='.repeat(50))

  job.status = 'complete'
  job.completed_at = new Date().toISOString()
  fs.writeFileSync(path.join(clientDir, 'job.json'), JSON.stringify(job, null, 2))
  console.log(\`\\nFORGE delivery complete for \${job.business_name}\\n\`)
}

collect().catch(err => { console.error('\\nCollect error:', err.message); process.exit(1) })`
}

console.log('\n FORGE Setup')
console.log('='.repeat(40))

let created = 0
for (const [filename, content] of Object.entries(files)) {
  const filepath = path.join(__dirname, filename)
  if (fs.existsSync(filepath)) {
    console.log(`  Skipped (exists): ${filename}`)
  } else {
    fs.writeFileSync(filepath, content)
    console.log(`  Created: ${filename}`)
    created++
  }
}

// Create outputs directory
const outputsDir = path.join(__dirname, 'outputs')
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir)
  console.log('  Created: outputs/')
}

console.log('='.repeat(40))
console.log(`\n ${created} files created. Now:\n`)
console.log('  1. Copy .env.example to .env:')
console.log('     copy .env.example .env')
console.log('\n  2. Open .env and paste your Anthropic API key')
console.log('\n  3. Install dependencies:')
console.log('     npm install')
console.log('\n  4. Run FORGE:')
console.log('     node forge-runner.js "Joe\'s Plumbing" "Peckham, London" "plumbing"')
console.log('')
