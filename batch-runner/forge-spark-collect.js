/**
 * FORGE — SPARK Collector
 *
 * Retrieves SPARK batch results, saves social calendar files,
 * and prints Canva MCP instructions for Claude Desktop.
 *
 * Usage: node forge-spark-collect.js [slug]
 *
 * Run after: node forge-spark-runner.js [slug]
 *
 * Outputs:
 *   outputs/[slug]/social-calendar.json
 *   outputs/[slug]/social-calendar.csv
 *   outputs/[slug]/reel-concepts.json
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'
import { dispatchSparkPipeline } from './forge-spark-engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = process.env.FORGE_OUTPUT_DIR || './outputs'
const [,, slug] = process.argv

if (!slug) {
  console.error('Usage: node forge-spark-collect.js [slug]')
  process.exit(1)
}

async function collect() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const clientDir = path.join(__dirname, OUTPUT_DIR, slug)
  const sparkJobPath = path.join(clientDir, 'spark-job.json')

  if (!fs.existsSync(sparkJobPath)) {
    console.error(`No spark-job.json found for: ${slug}`)
    console.error('Run forge-spark-runner.js first.')
    process.exit(1)
  }

  const sparkJob = JSON.parse(fs.readFileSync(sparkJobPath, 'utf8'))

  // Load brief if available (for Canva MCP instructions)
  let brief = {}
  const briefPath = path.join(clientDir, 'brief.json')
  if (fs.existsSync(briefPath)) {
    brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'))
  }

  console.log('\nFORGE — SPARK Collect')
  console.log('='.repeat(50))
  console.log(`  Client:   ${sparkJob.business_name}`)
  console.log(`  Batch ID: ${sparkJob.batch_id}`)

  // ── Check batch status ────────────────────────────────────────────────
  const batch = await client.beta.messages.batches.retrieve(sparkJob.batch_id)

  if (batch.processing_status !== 'ended') {
    const c = batch.request_counts
    console.log(`\nNot ready yet (${batch.processing_status})`)
    console.log(`  ${c.succeeded} done, ${c.processing} still processing`)
    console.log(`\nTry again: node forge-spark-collect.js ${slug}`)
    process.exit(0)
  }

  // ── Collect results ───────────────────────────────────────────────────
  console.log('\nCollecting SPARK results...')
  let sparkOutput = null
  let failed = false

  for await (const result of await client.beta.messages.batches.results(sparkJob.batch_id)) {
    if (result.result.type === 'succeeded') {
      const text = result.result.message.content[0].text
      const u = result.result.message.usage
      const cacheRead = u.cache_read_input_tokens || 0
      const cost = ((u.input_tokens * 1.5) + (u.output_tokens * 7.5) + (cacheRead * 0.15)) / 1_000_000

      console.log(`  ${result.custom_id}: ${u.output_tokens} tokens | $${cost.toFixed(4)}`)

      // Parse JSON — strip markdown fences if present
      try {
        const raw = text.replace(/^```json\n?|\n?```$/g, '').trim()
        sparkOutput = JSON.parse(raw)
      } catch (e) {
        console.error(`  JSON parse failed: ${e.message}`)
        console.error(`  Raw (first 500 chars): ${text.substring(0, 500)}`)
        failed = true
      }
    } else {
      console.error(`  FAILED — ${result.result.error?.message}`)
      failed = true
    }
  }

  if (failed || !sparkOutput) {
    console.error('\nSPARK batch failed or returned unparseable output. Check logs above.')
    process.exit(1)
  }

  // ── Validate output structure ─────────────────────────────────────────
  const posts = sparkOutput.posts || []
  if (posts.length < 10) {
    console.warn(`  Warning: only ${posts.length} posts returned (expected ~20). Output may be truncated.`)
  }

  console.log(`\n  Posts: ${posts.length}`)
  console.log(`  Reels: ${(sparkOutput.reel_concepts || []).length}`)
  console.log(`  SEO copy: ${sparkOutput.seo_landing_copy?.meta_description ? '✅' : '⚠️ missing'}`)

  // ── Dispatch: save files + print MCP instructions ─────────────────────
  const summary = dispatchSparkPipeline(sparkOutput, slug, brief)

  // ── Update spark-job.json ─────────────────────────────────────────────
  sparkJob.status = 'complete'
  sparkJob.completed_at = new Date().toISOString()
  sparkJob.outputs = summary
  fs.writeFileSync(sparkJobPath, JSON.stringify(sparkJob, null, 2))

  console.log(`\nSPARK complete for ${sparkJob.business_name}`)
  console.log(`Posts: ${summary.posts_count} | Reels: ${summary.reels_count}`)
  console.log(`CSV:  ${summary.csv_path}`)
  console.log(`JSON: ${summary.json_path}\n`)
}

collect().catch(err => {
  console.error('\n[SPARK Collect] Error:', err.message)
  process.exit(1)
})
