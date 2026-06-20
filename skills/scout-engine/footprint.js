/**
 * FORGE SCOUT Engine — footprint.js
 * Local Business Footprint Extractor
 *
 * Single-request Google Maps data extraction via RapidAPI.
 * Pulls address, phone, hours, coordinates, and raw reviews
 * in one call. Discards all unneeded metadata immediately.
 *
 * Fallback: if RapidAPI fails, returns a structured object
 * built from the client's base config (`custom_id` properties)
 * so the onboarding flow never crashes.
 *
 * Usage:
 *   import { extractFootprint } from './footprint.js'
 *
 *   const footprint = await extractFootprint({
 *     businessName: "Dave's Plumbing",
 *     location: 'Clapham, London',
 *     // fallback fields (from PayPal custom_id decode):
 *     email: 'dave@example.com',
 *     trade: 'plumber'
 *   })
 *
 * ENV VARS REQUIRED:
 *   RAPIDAPI_MASTER_KEY   — from rapidapi.com → Apps → X-RapidAPI-Key
 *
 * Zero extra dependencies — native Node fetch only.
 */

// RapidAPI endpoint — Google Maps Business Data broker
// Provides unified listing details + reviews in a single request
const RAPIDAPI_HOST = 'local-business-data.p.rapidapi.com'
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}/search-in-area`

// Request timeout — fail fast rather than block the onboarding flow
const REQUEST_TIMEOUT_MS = 8000

// Maximum reviews to retain — we only need sentiment signals, not a full archive
const MAX_REVIEWS = 10

/**
 * extractFootprint
 * Fetches local business data from RapidAPI Google Maps broker.
 * Falls back to base config if the API call fails for any reason.
 *
 * @param {object} clientConfig
 * @param {string} clientConfig.businessName
 * @param {string} clientConfig.location       — e.g. "Clapham, London"
 * @param {string} [clientConfig.trade]        — e.g. "plumber" (used in fallback)
 * @param {string} [clientConfig.email]        — from custom_id (used in fallback)
 * @param {string} [clientConfig.phone]        — pre-known phone (used in fallback)
 *
 * @returns {Promise<FootprintResult>}
 */
export async function extractFootprint(clientConfig) {
  const { businessName, location, trade = '', email = '', phone = '' } = clientConfig

  if (!businessName || !location) {
    return buildFallback(clientConfig, 'missing_required_fields')
  }

  try {
    const result = await fetchFromRapidAPI(businessName, location)
    if (!result) return buildFallback(clientConfig, 'empty_result')
    return parseResult(result, clientConfig)
  } catch (err) {
    console.error(`[SCOUT] footprint.js extraction failed for "${businessName}": ${err.message}`)
    return buildFallback(clientConfig, err.message)
  }
}

/**
 * fetchFromRapidAPI
 * Single fetch call — unified listing details + reviews.
 */
async function fetchFromRapidAPI(businessName, location) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const query = encodeURIComponent(`${businessName} ${location}`)
  const url = `${RAPIDAPI_BASE}?query=${query}&limit=1&language=en&region=gb&extract_emails_and_contacts=false`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key':  process.env.RAPIDAPI_MASTER_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Accept':          'application/json'
      },
      signal: controller.signal
    })

    if (!res.ok) {
      throw new Error(`RapidAPI HTTP ${res.status}: ${res.statusText}`)
    }

    const json = await res.json()

    // API returns { data: [...results] }
    const results = json?.data
    if (!Array.isArray(results) || results.length === 0) return null

    return results[0]

  } finally {
    clearTimeout(timeout)
  }
}

/**
 * parseResult
 * Extracts only the fields SCOUT needs. Discards everything else.
 *
 * @param {object} raw      — raw API result object
 * @param {object} config   — original client config (for merge)
 * @returns {FootprintResult}
 */
function parseResult(raw, config) {
  // Extract and trim reviews — raw text only, discard reviewer metadata
  const reviews = (raw.reviews || [])
    .slice(0, MAX_REVIEWS)
    .map(r => ({
      rating: r.rating ?? null,
      text:   (r.review_text || r.text || '').trim()
    }))
    .filter(r => r.text.length > 0)

  // Opening hours — flatten to readable strings
  const hours = raw.opening_hours
    ? Object.entries(raw.opening_hours).map(([day, times]) => `${day}: ${times}`)
    : []

  return {
    source:          'rapidapi',
    business_name:   raw.name            || config.businessName,
    address:         raw.full_address    || raw.address || '',
    phone:           raw.phone_number    || raw.phone   || config.phone || '',
    website:         raw.website         || '',
    rating:          raw.rating          ?? null,
    review_count:    raw.reviews_count   ?? reviews.length,
    hours,
    coordinates: {
      lat: raw.latitude  ?? raw.lat ?? null,
      lng: raw.longitude ?? raw.lng ?? null
    },
    reviews,
    place_id:        raw.place_id        || raw.google_place_id || null,
    google_maps_url: raw.google_maps_url || raw.url || null,
    // Carry forward client config fields for downstream SPARK use
    trade:           config.trade        || '',
    email:           config.email        || '',
    location:        config.location,
    fallback:        false,
    fallback_reason: null
  }
}

/**
 * buildFallback
 * Constructs a minimal FootprintResult from base config when API fails.
 * Downstream agents (SPARK, WIRE) must check `footprint.fallback === true`
 * and reduce their data expectations accordingly.
 *
 * @param {object} config
 * @param {string} reason
 * @returns {FootprintResult}
 */
function buildFallback(config, reason) {
  console.warn(`[SCOUT] Using fallback footprint for "${config.businessName}" — reason: ${reason}`)
  return {
    source:          'fallback',
    business_name:   config.businessName || '',
    address:         config.location     || '',
    phone:           config.phone        || '',
    website:         '',
    rating:          null,
    review_count:    0,
    hours:           [],
    coordinates:     { lat: null, lng: null },
    reviews:         [],
    place_id:        null,
    google_maps_url: null,
    trade:           config.trade        || '',
    email:           config.email        || '',
    location:        config.location     || '',
    fallback:        true,
    fallback_reason: reason
  }
}

/**
 * @typedef {object} FootprintResult
 * @property {'rapidapi'|'fallback'} source
 * @property {string}   business_name
 * @property {string}   address
 * @property {string}   phone
 * @property {string}   website
 * @property {number|null} rating
 * @property {number}   review_count
 * @property {string[]} hours
 * @property {{ lat: number|null, lng: number|null }} coordinates
 * @property {{ rating: number|null, text: string }[]} reviews
 * @property {string|null} place_id
 * @property {string|null} google_maps_url
 * @property {string}   trade
 * @property {string}   email
 * @property {string}   location
 * @property {boolean}  fallback
 * @property {string|null} fallback_reason
 */

// ── CLI test runner ─────────────────────────────────────────────────────────
// node skills/scout-engine/footprint.js

if (process.argv[1] && process.argv[1].endsWith('footprint.js')) {
  import('dotenv/config').then(async () => {
    const result = await extractFootprint({
      businessName: "Dave's Plumbing",
      location:     'Clapham, London',
      trade:        'plumber',
      email:        'dave@example.com'
    })
    console.log('\n[SCOUT] Footprint result:')
    console.log(JSON.stringify(result, null, 2))
  })
}
