/**
 * FORGE SPARK Engine — listener.js
 * Autonomous Reactive Engagement Handler
 *
 * Receives incoming comment/mention webhooks from social distribution
 * infrastructure and generates hyper-localised trade expert replies
 * via Claude inference, then routes the reply back to the platform.
 *
 * Designed as a Vercel Serverless Function: /api/spark-listener
 * Copy or symlink to api/spark-listener.js for deployment.
 *
 * Flow:
 *   Webhook arrives → validate → spam gate → fetch client context
 *   → Claude inference → platform reply → audit log
 *
 * ENV VARS REQUIRED:
 *   ANTHROPIC_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   TOKEN_ENCRYPTION_KEY
 *   SPARK_LISTENER_SECRET    — shared secret in webhook header for auth
 *   FORGE_MODEL              — optional, defaults to claude-haiku-4-5-20251001
 *                              (Haiku is sufficient for reply generation and keeps costs minimal)
 */

import Anthropic       from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { createDecipheriv } from 'crypto'

// ── Constants ──────────────────────────────────────────────────────────────

// Use Haiku for reply generation — fast, cheap, more than capable for short responses
const REPLY_MODEL = process.env.FORGE_REPLY_MODEL || 'claude-haiku-4-5-20251001'

const SUPPORTED_PLATFORMS = ['meta', 'linkedin', 'tiktok', 'youtube', 'google_business']

// Spam signals — if comment matches any, discard silently
const SPAM_PATTERNS = [
  /\b(dm me|click link in bio|follow for follow|f4f|like4like)\b/i,
  /\b(crypto|forex|investment opportunity|earn \$|make money fast)\b/i,
  /\b(onlyfans|only fans)\b/i,
  /^(😍+|🔥+|❤️+|👏+)$/,           // emoji-only, no text value
  /(.)\1{6,}/,                        // repeated character spam (aaaaaaa)
  /https?:\/\//,                      // any URL in comment — high spam signal
]

// Minimum comment length worth replying to
const MIN_COMMENT_LENGTH = 8

// ── Supabase client (lazy init) ─────────────────────────────────────────────

let _supabase = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return _supabase
}

// ── Token decryption (mirrors SCHEMA.md pattern) ───────────────────────────

function decryptToken(stored) {
  const [ivHex, tagHex, ctHex] = stored.split(':')
  const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return decipher.update(Buffer.from(ctHex, 'hex')) + decipher.final('utf8')
}

// ── Spam gate ──────────────────────────────────────────────────────────────

function isSpam(text) {
  if (!text || text.trim().length < MIN_COMMENT_LENGTH) return true
  return SPAM_PATTERNS.some(pattern => pattern.test(text))
}

// ── Fetch client business context from Supabase ────────────────────────────

async function fetchClientContext(clientId) {
  const supabase = getSupabase()

  // Tenant-isolated query — client_id filter is always the first condition
  const { data: client, error } = await supabase
    .from('clients')
    .select('business_name, trade, location, retainer_tier')
    .eq('id', clientId)        // ISOLATION BARRIER
    .single()

  if (error || !client) return null
  return client
}

// ── Fetch platform access token for client ─────────────────────────────────

async function fetchClientToken(clientId, provider) {
  const supabase = getSupabase()

  const { data: auth, error } = await supabase
    .from('client_authorizations')
    .select('encrypted_access_token, token_status, token_scope')
    .eq('client_id', clientId)      // ISOLATION BARRIER
    .eq('provider_name', provider)
    .eq('token_status', 'active')
    .single()

  if (error || !auth) return null
  return decryptToken(auth.encrypted_access_token)
}

// ── Claude inference — generate trade reply ────────────────────────────────

async function generateReply(commentText, clientContext, platform) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { business_name, trade, location } = clientContext

  const systemPrompt = `You are the social media voice for ${business_name}, a ${trade} business based in ${location}.
Your job is to reply to customer comments on ${platform} posts.

RULES:
- Maximum 3 sentences. Never longer.
- Sound like a real, knowledgeable local tradesperson — not a brand account.
- Reference the specific trade context where relevant (boilers, leaks, electrics, etc.).
- If the comment asks a question, give a direct, expert answer and invite them to get in touch.
- If the comment is a compliment, thank them genuinely and mention the area if appropriate.
- Never use hashtags in replies. Never use emojis excessively (max 1 if natural).
- Never mention competitors. Never make promises about price or timeline.
- If the comment is ambiguous or off-topic, respond warmly but briefly.
- Always end with a soft CTA: "Feel free to drop us a message" or "Give us a call anytime."`

  const userPrompt = `Reply to this comment on one of our ${platform} posts:

"${commentText}"

Write only the reply text. No quotation marks. No preamble.`

  const message = await client.messages.create({
    model: REPLY_MODEL,
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  })

  return message.content[0]?.text?.trim() || null
}

// ── Platform reply router ──────────────────────────────────────────────────

async function postReply(platform, postId, commentId, replyText, accessToken) {
  const routers = {

    meta: async () => {
      // Instagram Graph API — reply to a comment
      const url = `https://graph.facebook.com/v19.0/${commentId}/replies`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, access_token: accessToken })
      })
      return res.ok
    },

    linkedin: async () => {
      // LinkedIn Community Management API — reply to a comment on an ugcPost
      const url = 'https://api.linkedin.com/v2/socialActions/' +
                  encodeURIComponent(postId) + '/comments/' +
                  encodeURIComponent(commentId) + '/comments'
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          actor: 'urn:li:organization:{ORG_ID}', // TODO: store org URN in clients table
          message: { text: replyText }
        })
      })
      return res.ok
    },

    tiktok: async () => {
      // TikTok Comment Reply API
      const url = 'https://open.tiktokapis.com/v2/comment/reply/create/'
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_id: postId,
          parent_comment_id: commentId,
          text: replyText
        })
      })
      return res.ok
    },

    google_business: async () => {
      // Google Business Profile — reply to a review
      // postId is the review name (accounts/{accountId}/locations/{locationId}/reviews/{reviewId})
      const url = `https://mybusiness.googleapis.com/v4/${postId}/reply`
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: replyText })
      })
      return res.ok
    },

    youtube: async () => {
      // YouTube Data API v3 — insert comment reply
      const url = 'https://www.googleapis.com/youtube/v3/comments?part=snippet'
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            parentId: commentId,
            textOriginal: replyText
          }
        })
      })
      return res.ok
    }

  }

  const router = routers[platform]
  if (!router) return false
  return router()
}

// ── Audit log ──────────────────────────────────────────────────────────────

async function writeAuditLog(clientId, provider, action, success, metadata = {}) {
  try {
    const supabase = getSupabase()
    await supabase.from('token_audit_log').insert({
      client_id:     clientId,
      provider_name: provider,
      action,
      success,
      metadata,
      executed_at:   new Date().toISOString()
    })
  } catch {
    // Audit log failure must never affect the main execution path
  }
}

// ── Main handler (Vercel Serverless Function) ──────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Shared secret verification
  const incomingSecret = req.headers['x-forge-listener-secret']
  if (incomingSecret !== process.env.SPARK_LISTENER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { client_id, platform_source, user_comment_text, post_id, comment_id } = req.body || {}

  // Structural validation
  if (!client_id || !platform_source || !user_comment_text || !post_id) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (!SUPPORTED_PLATFORMS.includes(platform_source)) {
    return res.status(400).json({ error: `Unsupported platform: ${platform_source}` })
  }

  // Spam gate — silent discard, 200 response (prevents webhook retries)
  if (isSpam(user_comment_text)) {
    console.log(`[LISTENER] Spam discarded | client: ${client_id} | platform: ${platform_source}`)
    return res.status(200).json({ action: 'discarded', reason: 'spam' })
  }

  try {
    // Fetch client context (tenant-isolated)
    const clientContext = await fetchClientContext(client_id)
    if (!clientContext) {
      console.error(`[LISTENER] No client context for: ${client_id}`)
      return res.status(200).json({ action: 'discarded', reason: 'unknown_client' })
    }

    // Fetch platform token (tenant-isolated)
    const accessToken = await fetchClientToken(client_id, platform_source)
    if (!accessToken) {
      console.error(`[LISTENER] No active token | client: ${client_id} | platform: ${platform_source}`)
      await writeAuditLog(client_id, platform_source, 'publish_failure', false, {
        reason: 'no_active_token',
        post_id,
        comment_id
      })
      return res.status(200).json({ action: 'discarded', reason: 'no_token' })
    }

    // Generate reply via Claude
    const replyText = await generateReply(user_comment_text, clientContext, platform_source)
    if (!replyText) {
      console.error(`[LISTENER] Claude returned empty reply | client: ${client_id}`)
      return res.status(200).json({ action: 'discarded', reason: 'empty_reply' })
    }

    // Post reply to platform
    const posted = await postReply(
      platform_source,
      post_id,
      comment_id,
      replyText,
      accessToken
    )

    // Audit log
    await writeAuditLog(client_id, platform_source,
      posted ? 'publish_success' : 'publish_failure',
      posted,
      { post_id, comment_id, reply_length: replyText.length }
    )

    if (posted) {
      console.log(`[LISTENER] Reply posted | client: ${client_id} | platform: ${platform_source} | post: ${post_id}`)
      return res.status(200).json({ action: 'replied', platform: platform_source })
    } else {
      console.error(`[LISTENER] Platform rejected reply | client: ${client_id} | platform: ${platform_source}`)
      return res.status(200).json({ action: 'failed', reason: 'platform_rejection' })
    }

  } catch (err) {
    console.error(`[LISTENER] Unhandled error | client: ${client_id}:`, err.message)
    // Silent 200 — prevents webhook infrastructure from retrying on our errors
    return res.status(200).json({ action: 'discarded', reason: 'internal_error' })
  }
}
