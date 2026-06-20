/**
 * FORGE Deploy Team — env-provision.js
 * Step 0: Pre-Flight Token Verification
 *
 * Exports launchProvisioningMatrix(businessType) which returns the full
 * production setup target registry, forked by business type.
 *
 * businessType: 'sole_trader' | 'limited_company'
 * Determined at checkout — stored in custom_id and clients table.
 *
 * Usage (CLI):
 *   node skills/deploy-team/env-provision.js [--check] [--list] [--type sole_trader|limited_company]
 *
 *   --check               Verify required env vars are set
 *   --list                Print the full provisioning matrix and exit
 *   --type sole_trader    Show sole trader onboarding paths
 *   --type limited_company Show Ltd company onboarding paths (default)
 *
 * Integration:
 *   Called as Step 0 inside deploy-team skill before any agent activates.
 *   Reads client.business_type from the decoded custom_id payload.
 *   If --check fails, deploy-team halts and prints registration URLs.
 *
 * ────────────────────────────────────────────────────────────────────────
 * BUSINESS TYPE DETECTION
 *
 * business_type is captured at two points in the onboarding flow:
 *
 * 1. Quote Wizard (Package 3+) — radio button added to Step 1:
 *    "Are you a...  ○ Sole Trader  ○ Limited Company"
 *    Stored in the form submission payload as `business_type`.
 *
 * 2. PayPal Checkout — encoded into custom_id:
 *    btoa(JSON.stringify({ name, email, location, pkg, business_type }))
 *    Decoded in /api/paypal-webhook.js and /api/session.js.
 *
 * SCOUT also infers business type from GBP listing name as a secondary
 * signal: "Ltd", "Limited", "PLC" suffix = limited_company; personal
 * name format (e.g. "Dave Smith Plumbing") = sole_trader.
 * ────────────────────────────────────────────────────────────────────────
 * ARCHITECTURAL NOTE — TIKTOK CONTENT POSTING API
 *
 * FORGE routes vertical video assets to TikTok using the PULL_FROM_URL
 * strategy. TikTok's servers pull media directly from Supabase Storage
 * CDN URLs — eliminating local file buffer overhead in serverless functions.
 *
 * POST https://open.tiktokapis.com/v2/post/publish/video/init/
 * {
 *   "source_info": { "source": "PULL_FROM_URL", "video_url": "{supabase_url}" }
 * }
 * Required scope: video.publish
 * ────────────────────────────────────────────────────────────────────────
 */

// ── Provisioning target registry ───────────────────────────────────────────

/**
 * launchProvisioningMatrix
 * Returns the platform setup targets for the given business type.
 *
 * @param {'sole_trader'|'limited_company'} businessType
 * @returns {ProvisionMatrix}
 */
export function launchProvisioningMatrix(businessType = 'limited_company') {
  const isSoleTrader = businessType === 'sole_trader'

  const provisionTargets = {

    // ── SEO / GEO ────────────────────────────────────────────────────────
    seo_geo: [
      {
        platform:     'Google Search Console',
        url:          'https://search.google.com/search-console/welcome',
        action:       'Verify Vercel production domain ownership via DNS TXT record for indexing.',
        env_var:      null,
        required:     false,
        business_type: 'both',
        notes:        'Add DNS TXT record at your domain registrar. Submit /sitemap.xml after verification.'
      },
      {
        platform:     'Google Business Profile',
        url:          'https://business.google.com/create',
        action:       isSoleTrader
          ? 'Create a personal GBP listing under your own name as a self-employed tradesperson.'
          : 'Create a business GBP listing under your registered company name.',
        env_var:      null,
        required:     false,
        business_type: 'both',
        notes:        isSoleTrader
          ? 'Use your personal Google account. List under your trading name (e.g. "Dave Smith Plumbing"). Select the correct trade category. Add your mobile number and website. Request postcard verification.'
          : 'Use Google Workspace or a dedicated business Google account. List under your registered company name. Add the Vercel production URL. GBP Places ID needed later for SCOUT.'
      }
    ],

    // ── Social platforms ─────────────────────────────────────────────────
    socials: [
      {
        platform:     'Meta (Instagram + Facebook)',
        url:          isSoleTrader
          ? 'https://www.facebook.com/pages/create'
          : 'https://developers.facebook.com/apps/',
        action:       isSoleTrader
          ? 'Create a Facebook Business Page linked to your personal account. Convert Instagram to a Professional (Creator) account and connect it to the Page.'
          : 'Generate a non-expiring System User Access Token via Meta Business Manager for IG/FB automated cross-posting.',
        env_var:      'META_SYSTEM_USER_ACCESS_TOKEN',
        required:     true,
        business_type: 'both',
        notes:        isSoleTrader
          ? 'Facebook: personal account → Pages → Create Page → Business or Brand. Instagram: Settings → Account → Switch to Professional → Creator. Connect IG to the Facebook Page via Instagram Settings → Linked Accounts. Then go to Meta Developer Dashboard to create an app and generate the access token with pages_manage_posts + instagram_content_publish scopes.'
          : 'Business Manager → System Users → Add System User → Generate Token → select pages_manage_posts, instagram_content_publish. Non-expiring tokens require a verified Business Manager account.'
      },
      {
        platform:     'LinkedIn',
        url:          isSoleTrader
          ? 'https://www.linkedin.com/in/'
          : 'https://developer.linkedin.com/',
        action:       isSoleTrader
          ? 'Enable LinkedIn Creator Mode on your personal profile to unlock scheduling and analytics for self-employed posting.'
          : 'Create a LinkedIn Company Page and register a Developer App to acquire OAuth credentials for automated posting.',
        env_var_1:    'LINKEDIN_CLIENT_ID',
        env_var_2:    'LINKEDIN_CLIENT_SECRET',
        required:     true,
        business_type: 'both',
        notes:        isSoleTrader
          ? 'Profile → Resources → Creator Mode → Turn on. Then go to developer.linkedin.com → Create App → associate with your personal profile. Request w_member_social scope. Run OAuth flow once to get access token (60-day expiry).'
          : 'Create a Company Page first. Then developer.linkedin.com → Create App → associate with Company Page. Request w_member_social + r_organization_social scopes. Run OAuth flow to get token.'
      },
      {
        platform:     'TikTok',
        url:          isSoleTrader
          ? 'https://www.tiktok.com/signup'
          : 'https://developers.tiktok.com/apps/',
        action:       isSoleTrader
          ? 'Create a standard TikTok Creator account. Switch to a Business Account in settings to unlock Content Posting API access.'
          : 'Register a TikTok Developer App, activate the Content Posting API, and request video.publish scope approval.',
        env_var_1:    'TIKTOK_CLIENT_KEY',
        env_var_2:    'TIKTOK_CLIENT_SECRET',
        required:     false,
        business_type: 'both',
        notes:        isSoleTrader
          ? 'Sign up → Profile → Settings → Manage Account → Switch to Business Account → select your trade category. Then register at developers.tiktok.com to get API access. video.publish scope requires approval (3–7 business days). FORGE uses PULL_FROM_URL strategy.'
          : 'App must be in non-sandbox environment for video.publish. Submit scope approval — 3–7 business days. FORGE uses PULL_FROM_URL posting strategy.'
      },
      {
        platform:     'YouTube',
        url:          'https://www.youtube.com/create_channel',
        action:       isSoleTrader
          ? 'Create a YouTube channel linked to your personal Google account for short-form vertical video (Shorts).'
          : 'Create a YouTube Brand Account under Google Workspace for short-form vertical video hosting.',
        env_var:      'YOUTUBE_API_KEY',
        required:     false,
        business_type: 'both',
        notes:        isSoleTrader
          ? 'Sign in with personal Google account → YouTube → Create channel → use your trading name. Enable YouTube Data API v3 in Google Cloud Console → Credentials → API Key.'
          : 'Use Google Workspace account. Create a Brand Account so multiple people can manage it. Enable YouTube Data API v3 in Cloud Console → Credentials → API Key. Restrict to YouTube Data API only.'
      }
    ],

    // ── Infrastructure ───────────────────────────────────────────────────
    infrastructure: [
      {
        platform:     'RapidAPI Dashboard',
        url:          'https://rapidapi.com',
        action:       'Secure master developer key to provision the low-cost SCOUT location crawler APIs.',
        env_var:      'RAPIDAPI_MASTER_KEY',
        required:     true,
        business_type: 'both',
        notes:        'Apps → Add New App → name it FORGE → copy X-RapidAPI-Key. Subscribe to "Local Business Data" API. Same key works across all RapidAPI endpoints.'
      }
    ]

  }

  return provisionTargets
}

// ── business_type field spec (for quote wizard + checkout integration) ──────

export const BUSINESS_TYPE_FIELD = {
  field_name:   'business_type',
  field_type:   'radio',
  label:        'Are you a...',
  options: [
    {
      value:       'sole_trader',
      label:       'Sole Trader / Self-Employed',
      description: 'You trade under your own name or a trading name. No Ltd suffix.'
    },
    {
      value:       'limited_company',
      label:       'Limited Company',
      description: 'You have a registered company (Ltd, PLC, or LLP).'
    }
  ],
  default:      'sole_trader',  // most FORGE clients are sole traders
  required:     true,
  placement:    'Step 1 of quote wizard — immediately after business name field',
  custom_id_key: 'business_type'  // encoded into PayPal custom_id
}

// ── SCOUT inference helper ──────────────────────────────────────────────────

/**
 * inferBusinessType
 * Secondary signal — infers business type from GBP listing name.
 * Used when business_type is not present in custom_id (legacy orders).
 *
 * @param {string} businessName
 * @returns {'limited_company'|'sole_trader'}
 */
export function inferBusinessType(businessName = '') {
  const ltdPatterns = /\b(ltd|limited|plc|llp|llc|inc|corp|group)\b/i
  return ltdPatterns.test(businessName) ? 'limited_company' : 'sole_trader'
}

// ── Env var check ──────────────────────────────────────────────────────────

const REQUIRED_ENV_VARS = [
  { var: 'META_SYSTEM_USER_ACCESS_TOKEN', platform: 'Meta'         },
  { var: 'LINKEDIN_CLIENT_ID',            platform: 'LinkedIn'     },
  { var: 'LINKEDIN_CLIENT_SECRET',        platform: 'LinkedIn'     },
  { var: 'RAPIDAPI_MASTER_KEY',           platform: 'RapidAPI'     }
]

export function checkProvisioningEnv() {
  const missing = []
  const present = []

  for (const { var: envVar, platform } of REQUIRED_ENV_VARS) {
    if (!process.env[envVar] || process.env[envVar].trim() === '') {
      missing.push({ var: envVar, platform })
    } else {
      present.push(envVar)
    }
  }

  return { missing, present, allClear: missing.length === 0 }
}

// ── CLI runner ─────────────────────────────────────────────────────────────

if (process.argv[1] && process.argv[1].endsWith('env-provision.js')) {
  const args      = process.argv.slice(2)
  const typeArg   = args.includes('--type') ? args[args.indexOf('--type') + 1] : 'limited_company'
  const validType = ['sole_trader', 'limited_company'].includes(typeArg) ? typeArg : 'limited_company'

  if (args.includes('--list') || args.length === 0) {
    const matrix = launchProvisioningMatrix(validType)
    const label  = validType === 'sole_trader' ? 'SOLE TRADER' : 'LIMITED COMPANY'
    const all    = [...matrix.seo_geo, ...matrix.socials, ...matrix.infrastructure]

    console.log(`\nFORGE — Step 0: Pre-Flight Provisioning Matrix [${label}]`)
    console.log('='.repeat(64))
    for (const t of all) {
      const vars = [t.env_var, t.env_var_1, t.env_var_2].filter(Boolean)
      console.log(`\n  ${t.platform}`)
      console.log(`  URL:    ${t.url}`)
      console.log(`  Action: ${t.action}`)
      if (vars.length) console.log(`  Env:    ${vars.join(', ')}`)
      console.log(`  Notes:  ${t.notes}`)
    }
    console.log('\n' + '='.repeat(64))
    console.log(`\nTo see sole trader paths:    node env-provision.js --list --type sole_trader`)
    console.log(`To see Ltd company paths:    node env-provision.js --list --type limited_company\n`)
  }

  if (args.includes('--check')) {
    const { missing, present, allClear } = checkProvisioningEnv()
    console.log('\nFORGE — Step 0: Env Var Check')
    console.log('='.repeat(40))
    for (const v of present)              console.log(`  ✅  ${v}`)
    for (const { var: v } of missing)     console.log(`  ❌  ${v}`)
    console.log('='.repeat(40))
    if (allClear) {
      console.log('  All required env vars present. Deploy-team may proceed.\n')
      process.exit(0)
    } else {
      console.log(`  ${missing.length} missing. Register above, then add to Vercel env vars.\n`)
      process.exit(1)
    }
  }
}
