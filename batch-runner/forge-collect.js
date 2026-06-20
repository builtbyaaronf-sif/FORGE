// forge-collect.js
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

  console.log('\nFORGE — Collecting Results')
  console.log('='.repeat(50))
  console.log(`  Client:   ${job.business_name}`)
  console.log(`  Batch ID: ${job.batch_id}`)

  const batch = await client.beta.messages.batches.retrieve(job.batch_id)
  if (batch.processing_status !== 'ended') {
    const c = batch.request_counts
    console.log(`\nNot ready yet (${batch.processing_status})`)
    console.log(`${c.succeeded} done, ${c.processing} still processing`)
    console.log(`\nTry again: node forge-collect.js ${slug}`)
    process.exit(0)
  }

  console.log('\nCollecting results...')
  const results = {}

  for await (const result of await client.beta.messages.batches.results(job.batch_id)) {
    const phase = result.custom_id.split('__')[1]
    if (result.result.type === 'succeeded') {
      results[phase] = result.result.message.content[0].text
      const u = result.result.message.usage
      const cacheRead = u.cache_read_input_tokens || 0
      const cacheWrite = u.cache_creation_input_tokens || 0
      const cost = ((u.input_tokens * 1.5) + (u.output_tokens * 7.5) + (cacheRead * 0.15) + (cacheWrite * 1.875)) / 1_000_000
      const cacheTag = cacheRead > 0 ? ` | cache hit: ${cacheRead} tokens saved` : ` | cache write: ${cacheWrite} tokens`
      console.log(`  ${phase}: ${u.output_tokens} output tokens | $${cost.toFixed(4)}${cacheTag}`)
    } else {
      console.log(`  ${phase}: FAILED — ${result.result.error?.message}`)
    }
  }

  if (results['p2_website']) {
    const html = results['p2_website'].replace(/^```html\n?|\n?```$/g, '').trim()
    fs.writeFileSync(path.join(clientDir, 'index.html'), html)
    console.log(`\n  Website saved: outputs/${slug}/index.html`)
  }

  if (results['p5_strategy']) {
    const html = results['p5_strategy'].replace(/^```html\n?|\n?```$/g, '').trim()
    fs.writeFileSync(path.join(clientDir, 'strategy-pack.html'), html)
    console.log(`  Strategy pack saved: outputs/${slug}/strategy-pack.html`)
  }

  console.log('\nReal-time MCP phases — run these in Claude Desktop:')
  console.log('='.repeat(50))
  console.log(`  1. "Deploy outputs/${slug}/index.html to Vercel as project ${slug}"`)
  console.log(`  2. "Create 3 Canva brand assets for ${brief.business_name}: Instagram post, Facebook cover, business card. Design system: ${brief.design_system}, accent: ${brief.accent_colour}"`)
  console.log(`  3. "Create HubSpot company for ${brief.business_name}, ${brief.location}, closed deal £750 Digital Presence Package"`)
  console.log('='.repeat(50))

  job.status = 'complete'
  job.completed_at = new Date().toISOString()
  fs.writeFileSync(path.join(clientDir, 'job.json'), JSON.stringify(job, null, 2))
  console.log(`\nFORGE delivery complete for ${job.business_name}\n`)
}

collect().catch(err => { console.error('\nCollect error:', err.message); process.exit(1) })