// forge-status.js
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
    if (!fs.existsSync(jobPath)) { console.error(`No job found for: ${targetSlug}`); process.exit(1) }
    jobs = [JSON.parse(fs.readFileSync(jobPath, 'utf8'))]
  } else {
    if (!fs.existsSync(outputDir)) { console.log('No jobs yet.'); return }
    for (const dir of fs.readdirSync(outputDir)) {
      const jobPath = path.join(outputDir, dir, 'job.json')
      if (fs.existsSync(jobPath)) jobs.push(JSON.parse(fs.readFileSync(jobPath, 'utf8')))
    }
  }

  if (!jobs.length) { console.log('No FORGE jobs found.'); return }
  console.log('\nFORGE — Batch Status')
  console.log('='.repeat(50))

  for (const job of jobs) {
    const batch = await client.beta.messages.batches.retrieve(job.batch_id)
    const counts = batch.request_counts
    const done = counts.succeeded + counts.errored
    const total = done + counts.processing + (counts.canceled || 0) + (counts.expired || 0)

    console.log(`\n${job.business_name} (${job.location})`)
    console.log(`  Batch ID: ${job.batch_id}`)
    console.log(`  Status:   ${batch.processing_status}`)
    console.log(`  Progress: ${done}/${total} complete`)
    if (counts.succeeded) console.log(`  Succeeded: ${counts.succeeded}`)
    if (counts.errored)   console.log(`  Errored:   ${counts.errored}`)
    if (counts.processing) console.log(`  Processing: ${counts.processing}`)

    if (batch.processing_status === 'ended') {
      console.log(`\n  Ready! Run: node forge-collect.js ${job.slug}`)
    }

    job.batch_status = batch.processing_status
    fs.writeFileSync(path.join(outputDir, job.slug, 'job.json'), JSON.stringify(job, null, 2))
  }
  console.log('\n' + '='.repeat(50) + '\n')
}

checkStatus(slug).catch(err => { console.error('Status error:', err.message); process.exit(1) })