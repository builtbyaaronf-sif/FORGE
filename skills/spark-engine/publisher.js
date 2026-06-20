/**
 * FORGE SPARK Engine — publisher.js
 * Social Distribution Handler via Mixpost (self-hosted)
 *
 * Routes multi-tenant client content to social platforms
 * through a self-hosted Mixpost instance at zero variable cost.
 *
 * Mixpost API docs: https://docs.mixpost.app/api
 *
 * Each platform in the `networks` array is dispatched independently.
 * One platform failing never blocks the others.
 *
 * Usage:
 *   import { publishContent } from './publisher.js'
 *
 *   const results = await publishContent({
 *     client_id:  'uuid',
 *     video_url:  'https://supabase.co/storage/.../reel.mp4',
 *     title:      'Boiler service Clapham',
 *     caption:    'Caption text here...',
 *     networks:   ['tiktok', 'instagram', 'youtube', 'linkedin']
 *   })
 *
 * ENV VARS REQUIRED:
 *   MIXPOST_HOST_URL   — e.g. https://mixpost.yourdomain.com
 *   MIXPOST_API_KEY    — from Mixpost dashboard → API Keys
 *
 * Zero extra dependencies — native Node fetch only.
 */

const MIXPOST_API_VERSION = '/api/v1'
const REQUEST_TIMEOUT_MS  = 12000

const SUPPORTED_NETWORKS = ['tiktok', 'instagram', 'youtube', 'linkedin', 'facebook']

// ── Core publish function ───────────────────────────────────────────────────

/**
 * publishContent
 * Dispatches content to each requested network independently.
 * Returns a result map — one entry per network.
 *
 * @param {object}   payload
 * @param {string}   payload.client_id   — tenant UUID (for audit trail)
 * @param {string}   payload.video_url   — public Supabase Storage CDN URL
 * @param {string}   payload.title       — post title (used by YouTube, LinkedIn)
 * @param {string}   payload.caption     — post body text / caption
 * @param {string[]} payload.networks    — target platforms
 *
 * @returns {Promise<PublishResultMap>}
 */
export async function publishContent(payload) {
  const { client_id, video_url, title, caption, networks = [] } = payload

  if (!client_id || !caption) {
    return buildErrorMap(networks, 'missing_required_fields')
  }

  if (!process.env.MIXPOST_HOST_URL || !process.env.MIXPOST_API_KEY) {
    return buildErrorMap(networks, 'mixpost_not_configured')
  }

  const validNetworks = networks.filter(n => SUPPORTED_NETWORKS.includes(n))
  if (validNetworks.length === 0) {
    return buildErrorMap(networks, 'no_valid_networks')
  }

  // Dispatch all networks in parallel — failures are isolated per network
  const results = await Promise.allSettled(
    validNetworks.map(network =>
      publishToNetwork({ client_id, video_url, title, caption, network })
    )
  )

  // Collate into a keyed result map
  const resultMap = {}
  validNetworks.forEach((network, idx) => {
    const settled = results[idx]
    if (settled.status === 'fulfilled') {
      resultMap[network] = settled.value
    } else {
      resultMap[network] = {
        success: false,
        network,
        error:   settled.reason?.message || 'unknown_error',
        post_id: null
      }
    }
  })

  const succeeded = Object.values(resultMap).filter(r => r.success).length
  console.log(`[PUBLISHER] ${succeeded}/${validNetworks.length} platforms succeeded | client: ${client_id}`)

  return resultMap
}

// ── Per-network dispatch ────────────────────────────────────────────────────

/**
 * publishToNetwork
 * Single network dispatch — isolated try/catch so one failure
 * never propagates to sibling networks.
 */
async function publishToNetwork({ client_id, video_url, title, caption, network }) {
  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const endpoint = `${process.env.MIXPOST_HOST_URL.replace(/\/$/, '')}${MIXPOST_API_VERSION}/posts`

  // Build Mixpost post payload
  // Mixpost normalises per-platform content through its own adapters
  const body = {
    accounts: [network],     // Mixpost matches this to the connected account by provider slug
    content: [
      {
        body:  caption,
        media: video_url
          ? [{ url: video_url, type: 'video' }]
          : []
      }
    ],
    // Platform-specific overrides where Mixpost supports them
    ...(title && ['youtube', 'linkedin'].includes(network) && {
      options: { title }
    }),
    // Schedule immediately
    scheduled_at: null,
    publish_now:  true,
    // Tag with client_id for Mixpost-side filtering
    tags: [`client:${client_id}`, network]
  }

  try {
    const res = await fetch(endpoint, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MIXPOST_API_KEY}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'X-Client-ID':   client_id    // passed through for server-side audit
      },
      body:   JSON.stringify(body),
      signal: controller.signal
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const reason = data?.message || data?.error || `HTTP ${res.status}`
      throw new Error(reason)
    }

    return {
      success: true,
      network,
      post_id: data?.data?.id || data?.id || null,
      status:  data?.data?.status || 'published',
      error:   null
    }

  } catch (err) {
    const isTimeout = err.name === 'AbortError'
    const reason    = isTimeout ? 'request_timeout' : err.message

    console.error(`[PUBLISHER] ${network} failed | client: ${client_id} | ${reason}`)

    return {
      success: false,
      network,
      post_id: null,
      error:   reason
    }

  } finally {
    clearTimeout(timeout)
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildErrorMap(networks, reason) {
  return Object.fromEntries(
    (networks.length ? networks : ['unknown']).map(n => [
      n,
      { success: false, network: n, post_id: null, error: reason }
    ])
  )
}

/**
 * @typedef {Object.<string, PublishResult>} PublishResultMap
 *
 * @typedef {object} PublishResult
 * @property {boolean}     success
 * @property {string}      network
 * @property {string|null} post_id   — Mixpost post ID if published
 * @property {string}      [status]  — 'published' | 'scheduled' | etc.
 * @property {string|null} error     — null on success
 */

// ── CLI test runner ─────────────────────────────────────────────────────────
// node skills/spark-engine/publisher.js

if (process.argv[1] && process.argv[1].endsWith('publisher.js')) {
  import('dotenv/config').then(async () => {
    const results = await publishContent({
      client_id: 'test-client-001',
      video_url:  null,
      title:      'Test post from FORGE',
      caption:    'This is a test publish from the FORGE SPARK engine.',
      networks:   ['linkedin']
    })
    console.log('\n[PUBLISHER] Result:')
    console.log(JSON.stringify(results, null, 2))
  })
}
