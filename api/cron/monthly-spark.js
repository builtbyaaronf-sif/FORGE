/**
 * FORGE — Monthly SPARK Cron Job
 * Vercel Cron: runs at 08:00 UTC on the 1st of every month
 * Iterates all active subscriptions and triggers tier-appropriate agent runs
 *
 * Authentication: Vercel injects Authorization: Bearer {CRON_SECRET} automatically
 * Add CRON_SECRET to Vercel env vars (auto-managed by Vercel on Pro)
 */

import { createClient } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 300 };

const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') return res.status(405).end();

  const runId = `cron-${new Date().toISOString().slice(0, 7)}`;
  console.log(`[CRON] Monthly SPARK run starting: ${runId}`);

  if (!kv) {
    return res.status(500).json({ error: 'KV not configured' });
  }

  const subscriptionIds = await kv.smembers('forge:active_subscriptions');

  if (!subscriptionIds || subscriptionIds.length === 0) {
    console.log('[CRON] No active subscriptions. Exiting.');
    return res.status(200).json({ run_id: runId, processed: 0 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const MODEL = process.env.FORGE_MODEL || 'claude-sonnet-4-6';
  const results = [];

  for (const subId of subscriptionIds) {
    const clientDataRaw = await kv.get(`sub:${subId}`);
    if (!clientDataRaw) {
      console.warn(`[CRON] No KV data for ${subId} — skipping`);
      results.push({ subId, status: 'skipped_no_data' });
      continue;
    }

    const clientData = typeof clientDataRaw === 'string'
      ? JSON.parse(clientDataRaw)
      : clientDataRaw;

    if (clientData.status !== 'active') {
      results.push({ subId, status: 'skipped_inactive' });
      continue;
    }

    const { tier, client_slug, name, location } = clientData;

    const tierPrompts = {
      t1: `You are FORGE SCOUT running a monthly maintenance cycle for ${name} (${location}).
           Tasks: 1) Re-scrape their Google Business Profile for new reviews and update their marketing persona. 2) Write 2 new SEO-optimised blog post outlines targeting their primary borough keywords. 3) Write 2 Google Business Profile update posts with local intent keywords. Output as structured JSON: { scout_update: {}, blog_posts: [], gbp_updates: [] }`,

      t2: `You are FORGE SPARK running a monthly content cycle for ${name} (${location}).
           Tasks: 1) All T1 tasks above. 2) Generate text overlays for 8 Canva design card variations (4 educational + 4 trust-building). 3) Generate 4 short-form video reel prompts for hyper-local London content. Output as structured JSON: { scout_update: {}, blog_posts: [], gbp_updates: [], canva_cards: [], reel_prompts: [] }`,

      t3: `You are FORGE running full T3 multi-quadrant monthly cycle for ${name} (${location}).
           Tasks: 1) All T2 tasks above, scaled across all 4 London quadrants (north/south/east/west). 2) Analyse conversion feedback: which geo zones and content types drove the most enquiries last month (use any data available from previous job.json or brief.json files). 3) Rewrite geo-targeting variables and keyword clusters for next month. Output as structured JSON with quadrant keys: { north: {...}, south: {...}, east: {...}, west: {...}, feedback_analysis: {}, updated_targeting: {} }`
    };

    const prompt = tierPrompts[tier] || tierPrompts.t1;

    try {
      const batchJob = await client.beta.messages.batches.create({
        requests: [{
          custom_id: `${client_slug}__${runId}__${tier}`,
          params: {
            model: MODEL,
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }]
          }
        }]
      });

      await kv.set(
        `forge:cron_job:${client_slug}:${runId}`,
        JSON.stringify({ batch_id: batchJob.id, tier, submitted_at: new Date().toISOString(), status: 'pending' }),
        { ex: 60 * 60 * 24 * 30 }
      );

      clientData.last_run_at = new Date().toISOString();
      await kv.set(`sub:${subId}`, JSON.stringify(clientData), { ex: 60 * 60 * 24 * 400 });

      console.log(`[CRON] Batch submitted for ${client_slug} (${tier}): ${batchJob.id}`);
      results.push({ subId, client_slug, tier, status: 'batch_submitted', batch_id: batchJob.id });

    } catch (err) {
      console.error(`[CRON] Batch submission failed for ${client_slug}:`, err.message);
      results.push({ subId, client_slug, tier, status: 'error', error: err.message });
    }
  }

  console.log(`[CRON] Run complete: ${results.filter(r => r.status === 'batch_submitted').length}/${subscriptionIds.length} submitted`);
  return res.status(200).json({ run_id: runId, processed: results.length, results });
}
