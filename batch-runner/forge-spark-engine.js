/**
 * FORGE — SPARK Content Engine [SEO + GEO Optimization]
 * Location: batch-runner/forge-spark-engine.js
 *
 * Generates hyper-local, search-optimized social and landing assets
 * for Greater London tradespeople using localized intent matrices.
 *
 * Flow:
 *   generateGeoPrompt(clientData)  → enriched prompt string
 *   runSparkBatch(clientData)      → submits Anthropic batch job, returns batch_id
 *   dispatchSparkPipeline(output, slug, brief) → saves files, prints MCP instructions
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { SYSTEM_PROMPT, p_spark_social } from './forge-prompts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODEL = process.env.FORGE_MODEL || 'claude-sonnet-4-6'
const OUTPUT_DIR = process.env.FORGE_OUTPUT_DIR || './outputs'

// ── London GEO/SEO Hyper-Local Matrix ─────────────────────────────────────
const LONDON_GEO_MATRIX = {
  north: {
    boroughs: ['Islington', 'Camden', 'Hackney', 'Barnet', 'Haringey'],
    landmarks: ['Upper Street', 'Camden Market', 'Hampstead Heath', 'Alexandra Palace'],
    quirks: 'Victorian and Georgian plumbing layouts, older brickwork structural issues, tight residential parking permits.'
  },
  south: {
    boroughs: ['Lambeth', 'Southwark', 'Croydon', 'Wandsworth', 'Lewisham', 'Clapham'],
    landmarks: ['Clapham Common', 'Brixton Market', 'The Shard', 'Crystal Palace Park'],
    quirks: 'Heavy Thames water hardness scaling, split Victorian conversions, high concentration of modern extensions.'
  },
  west: {
    boroughs: ['Hammersmith', 'Fulham', 'Kensington', 'Chelsea', 'Ealing', 'Hounslow'],
    landmarks: ['King\'s Road', 'Fulham Broadway', 'Westfield London', 'Kew Gardens'],
    quirks: 'Premium residential finishes required, strict conservation area rules, historic multi-story drainage networks.'
  },
  east: {
    boroughs: ['Tower Hamlets', 'Newham', 'Waltham Forest', 'Redbridge', 'Barking'],
    landmarks: ['Canary Wharf', 'Stratford Olympic Park', 'Victoria Park', 'Brick Lane'],
    quirks: 'Mix of industrial conversions and high-density new builds, varying water pressures, rapid commercial growth.'
  }
}

/**
 * Builds the hyper-local prompt context for a specific trade client.
 * @param {object} clientData - { name, trade, sector, coreKeywords }
 * @returns {string} enriched geo/SEO prompt
 */
export function generateGeoPrompt(clientData) {
  const { name, trade, sector = 'south', coreKeywords = [] } = clientData
  const region = LONDON_GEO_MATRIX[sector] || LONDON_GEO_MATRIX.south

  const targetKeywords = [
    `local ${trade} London`,
    `emergency ${trade} ${region.boroughs[0]}`,
    `${trade} near me Greater London`,
    ...coreKeywords
  ]

  return `
You are SPARK, the elite local SEO & Social Growth Agent for FORGE.
Your mission is to write hyper-targeted, search-optimized local copy for a London tradesperson.

CLIENT PROFILE:
- Business Name: ${name}
- Trade Type: ${trade}
- Target London Quadrant: ${sector.toUpperCase()} London

LOCAL GEOGRAPHIC ANCHORS (Inject these naturally to signal extreme local relevance):
- Target Boroughs/Neighborhoods: ${region.boroughs.join(', ')}
- High-Traffic Landmarks/Streets: ${region.landmarks.join(', ')}
- Regional Property Quirks: ${region.quirks}

MANDATORY REGIONAL LONDON VARIABLES:
- Transit/Compliance: Mention that quotes are fully ULEZ-compliant and congestion-charge managed where applicable (no hidden costs for the homeowner).
- Speed: Emphasize rapid response across the ${region.boroughs[0]} and ${region.boroughs[1]} corridors.

SEO KEYWORDS (Blend invisibly into captions and web snippet copy):
${targetKeywords.map(kw => `- "${kw}"`).join('\n')}
`.trim()
}

/**
 * Submits a SPARK social content batch job to the Anthropic Batch API.
 * @param {object} clientData - { name, trade, sector, coreKeywords }
 * @param {object} brief - full brief.json from forge-runner.js
 * @returns {object} { batch_id, slug }
 */
export async function runSparkBatch(clientData, brief) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { name, trade, sector = 'south' } = clientData

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const geoPrompt = generateGeoPrompt(clientData)
  const sparkPrompt = p_spark_social(geoPrompt, brief)

  console.log(`[SPARK] Submitting batch for: ${name} (${trade}, ${sector} London)`)

  const batchJob = await client.beta.messages.batches.create({
    requests: [
      {
        custom_id: `${slug}__spark_social`,
        params: {
          model: MODEL,
          max_tokens: 8000,
          system: [{ type: 'text', text: SYSTEM_PROMPT }],
          messages: [{
            role: 'user',
            content: [{ type: 'text', text: sparkPrompt }]
          }]
        }
      }
    ]
  })

  console.log(`[SPARK] Batch submitted: ${batchJob.id}`)
  return { batch_id: batchJob.id, slug }
}

/**
 * Saves SPARK output as JSON + CSV and prints Canva MCP instructions.
 * @param {object} processedOutput - parsed JSON from the batch result
 * @param {string} clientSlug - used for file path resolution
 * @param {object} brief - full brief.json for business context
 */
export function dispatchSparkPipeline(processedOutput, clientSlug, brief) {
  const clientDir = path.join(__dirname, OUTPUT_DIR, clientSlug)
  fs.mkdirSync(clientDir, { recursive: true })

  const { posts = [], reel_concepts = [], seo_landing_copy = {}, google_business_update = '', carousel_slide_text = {} } = processedOutput

  // ── Save social-calendar.json ──────────────────────────────────────────
  const calendarPath = path.join(clientDir, 'social-calendar.json')
  fs.writeFileSync(calendarPath, JSON.stringify(processedOutput, null, 2))
  console.log(`[SPARK] Social calendar JSON saved: outputs/${clientSlug}/social-calendar.json`)

  // ── Save social-calendar.csv ───────────────────────────────────────────
  const csvHeader = 'Week,Day,Platform,Content Type,Pillar,Topic,Caption,Hashtags,Visual Direction,Status'
  const csvRows = posts.map(p => {
    const caption = `"${(p.caption || '').replace(/"/g, '""')}"`
    const hashtags = `"${(p.hashtags || []).join(' ')}"`
    const visual = `"${(p.visual_direction || '').replace(/"/g, '""')}"`
    return `${p.week},${p.day},${p.platform},"${p.content_type}","${p.content_pillar}","${p.topic}",${caption},${hashtags},${visual},Draft`
  })
  const csvContent = [csvHeader, ...csvRows].join('\n')
  const csvPath = path.join(clientDir, 'social-calendar.csv')
  fs.writeFileSync(csvPath, csvContent)
  console.log(`[SPARK] Social calendar CSV saved: outputs/${clientSlug}/social-calendar.csv`)

  // ── Save reel-concepts.json ────────────────────────────────────────────
  if (reel_concepts.length) {
    fs.writeFileSync(path.join(clientDir, 'reel-concepts.json'), JSON.stringify(reel_concepts, null, 2))
    console.log(`[SPARK] Reel concepts saved: outputs/${clientSlug}/reel-concepts.json`)
  }

  // ── Print MCP instructions for Claude Desktop ──────────────────────────
  const accent = brief?.accent_colour || '#F59E0B'
  const canvas = brief?.canvas_colour || '#0A0A0A'
  const designSystem = brief?.design_system || 'Dark Bold'

  console.log('\n' + '='.repeat(60))
  console.log('SPARK COMPLETE — Run these in Claude Desktop (Cowork):')
  console.log('='.repeat(60))
  console.log(`\n1. CREATE CANVA CAROUSEL`)
  console.log(`   "Create a 5-slide Canva educational carousel for ${brief?.business_name || clientSlug}.`)
  console.log(`   Design system: ${designSystem} (canvas: ${canvas}, accent: ${accent}).`)
  console.log(`   Slide text: ${JSON.stringify(carousel_slide_text)}"`)
  console.log(`\n2. CREATE CANVA SOCIAL POST TEMPLATE`)
  console.log(`   "Create a Canva Instagram post template for ${brief?.business_name || clientSlug}.`)
  console.log(`   Hook text: '${posts[0]?.hook || 'Post hook here'}'. Dark theme, accent ${accent}."`)
  console.log(`\n3. ADD SEO COPY TO WEBSITE`)
  console.log(`   Meta description: "${seo_landing_copy.meta_description}"`)
  console.log(`   Hero intro: "${seo_landing_copy.hero_intro}"`)
  console.log(`\n4. GOOGLE BUSINESS UPDATE`)
  console.log(`   Post: "${google_business_update.substring(0, 150)}..."`)
  console.log('\n' + '='.repeat(60))
  console.log(`Next: node forge-spark-collect.js ${clientSlug}\n`)

  return {
    posts_count: posts.length,
    reels_count: reel_concepts.length,
    csv_path: `outputs/${clientSlug}/social-calendar.csv`,
    json_path: `outputs/${clientSlug}/social-calendar.json`
  }
}
