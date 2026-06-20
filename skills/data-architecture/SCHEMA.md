# FORGE — Data Architecture & Schema Reference
**Multi-Tenant OAuth Token Vault | Client Authorization Layer**
**Last updated: 19 June 2026**

---

## OVERVIEW

Every FORGE client is a discrete tenant. Their social media publishing tokens, SEO credentials, and profile data must never touch FORGE's own agency accounts — and must never be accessible by another client's pipeline. This document defines the schema, isolation rules, and query patterns that enforce that guarantee.

**Stack:** Vercel KV (Upstash Redis) for hot-path token reads. Supabase Postgres for durable record storage and audit trail. AES-256-GCM for token encryption at rest.

---

## SCHEMA 1 — `client_authorizations`

Stores OAuth access tokens for every social/SEO platform, per client. One row per `(client_id, provider_name)` pair.

### Table definition (Postgres / Supabase)

```sql
CREATE TABLE client_authorizations (
  id                    UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id             UUID          NOT NULL,
  provider_name         TEXT          NOT NULL
                        CHECK (provider_name IN (
                          'meta',
                          'linkedin',
                          'tiktok',
                          'youtube',
                          'google_business',
                          'google_search_console',
                          'rapidapi'
                        )),
  encrypted_access_token  TEXT        NOT NULL,
  encrypted_refresh_token TEXT,
  token_status          TEXT          NOT NULL DEFAULT 'active'
                        CHECK (token_status IN ('active', 'expired', 'revoked', 'pending')),
  token_scope           TEXT[],
  token_expires_at      TIMESTAMPTZ,
  last_sync_timestamp   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_client_provider UNIQUE (client_id, provider_name),
  CONSTRAINT fk_client FOREIGN KEY (client_id)
    REFERENCES clients(id) ON DELETE CASCADE
);

-- Index for the isolation query pattern (see ROUTING RULES below)
CREATE INDEX idx_client_auth_lookup
  ON client_authorizations (client_id, provider_name, token_status);
```

### Field reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Row PK. Never exposed externally. |
| `client_id` | UUID | FK → `clients.id`. The billing-tier-matched tenant identifier. All SCOUT/SPARK queries filter on this first. |
| `provider_name` | TEXT (enum) | Platform identifier. Enforced by CHECK constraint — no freeform strings. |
| `encrypted_access_token` | TEXT | AES-256-GCM encrypted OAuth access token. Encryption key stored in Vercel env var `TOKEN_ENCRYPTION_KEY`, never in DB. |
| `encrypted_refresh_token` | TEXT | AES-256-GCM encrypted refresh token (where provider supports it). LinkedIn and Meta require refresh token rotation. |
| `token_status` | TEXT (enum) | `active` = usable now. `expired` = needs refresh cycle. `revoked` = client disconnected, do not use. `pending` = OAuth flow initiated, not yet completed. |
| `token_scope` | TEXT[] | Array of granted scopes (e.g., `['video.publish', 'user.info.basic']`). SPARK validates required scope is present before posting. |
| `token_expires_at` | TIMESTAMPTZ | NULL for non-expiring tokens (Meta System User). SPARK checks this before every publish action. |
| `last_sync_timestamp` | TIMESTAMPTZ | Updated every time the token is successfully used or refreshed. Stale sync = potential drift indicator. |

---

## SCHEMA 2 — `clients`

Parent table. One row per billing client. This is the tenant anchor.

```sql
CREATE TABLE clients (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  client_slug       TEXT          NOT NULL UNIQUE,
  business_name     TEXT          NOT NULL,
  email             TEXT          NOT NULL UNIQUE,
  location          TEXT,
  trade             TEXT,
  retainer_tier     TEXT          CHECK (retainer_tier IN ('t1', 't2', 't3', NULL)),
  paypal_sub_id     TEXT          UNIQUE,
  subscription_status TEXT        DEFAULT 'inactive'
                    CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'trial')),
  kv_key            TEXT,         -- e.g. 'sub:I-XXXXXXXXXXX' — mirrors Vercel KV record
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_slug   ON clients (client_slug);
CREATE INDEX idx_clients_sub_id ON clients (paypal_sub_id);
```

---

## SCHEMA 3 — `token_audit_log`

Immutable event log. Every token read, refresh attempt, or publish action is recorded here. Used for debugging, fraud detection, and billing disputes.

```sql
CREATE TABLE token_audit_log (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     UUID          NOT NULL REFERENCES clients(id),
  provider_name TEXT          NOT NULL,
  action        TEXT          NOT NULL
                CHECK (action IN (
                  'token_read',
                  'token_refresh',
                  'token_revoke',
                  'publish_attempt',
                  'publish_success',
                  'publish_failure',
                  'scope_check',
                  'expiry_check'
                )),
  success       BOOLEAN       NOT NULL,
  error_code    TEXT,
  metadata      JSONB,
  executed_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_client_time
  ON token_audit_log (client_id, executed_at DESC);
```

---

## TENANT ISOLATION — ROUTING VALIDATION BARRIERS

### The cardinal rule

**Every database query issued by SPARK or SCOUT must include a `WHERE client_id = $target_client_id` clause as the first filter condition.** No exceptions. No wildcard reads. No joins that traverse client boundaries.

This is enforced at three layers:

### Layer 1 — Query pattern (mandatory template)

Every token retrieval must follow this exact pattern:

```javascript
// ✅ CORRECT — isolated to target client
const { data: auth, error } = await supabase
  .from('client_authorizations')
  .select('encrypted_access_token, token_status, token_expires_at, token_scope')
  .eq('client_id', targetClientId)          // ← ISOLATION BARRIER — always first
  .eq('provider_name', providerName)
  .eq('token_status', 'active')
  .single()

// ❌ FORBIDDEN — no client_id filter
const { data } = await supabase
  .from('client_authorizations')
  .select('*')
  .eq('provider_name', 'meta')              // ← returns ALL clients' Meta tokens
```

### Layer 2 — Row-level security (Supabase RLS)

Enable RLS and add a policy that enforces `client_id` matching at the database level, independently of application code:

```sql
ALTER TABLE client_authorizations ENABLE ROW LEVEL SECURITY;

-- Policy: service role only (FORGE backend), scoped to client_id
CREATE POLICY "tenant_isolation"
  ON client_authorizations
  FOR ALL
  TO service_role
  USING (client_id = current_setting('app.current_client_id')::UUID);
```

Set the config parameter before each query session:

```javascript
await supabase.rpc('set_config', {
  setting: 'app.current_client_id',
  value: targetClientId,
  is_local: true
})
```

### Layer 3 — SPARK/SCOUT runtime assertion

Every function that handles token retrieval must assert isolation before execution:

```javascript
/**
 * getClientToken — safe, isolated token fetch
 * @param {string} clientId  — UUID from clients table
 * @param {string} provider  — must match client_authorizations.provider_name enum
 * @returns {string}          — decrypted access token
 * @throws                    — if client_id missing, token expired, or scope invalid
 */
export async function getClientToken(clientId, provider, requiredScope = null) {
  if (!clientId || typeof clientId !== 'string') {
    throw new Error('[TOKEN VAULT] getClientToken called without valid clientId — aborting')
  }

  const { data: auth, error } = await supabase
    .from('client_authorizations')
    .select('encrypted_access_token, token_status, token_expires_at, token_scope')
    .eq('client_id', clientId)      // ISOLATION BARRIER
    .eq('provider_name', provider)
    .single()

  if (error || !auth) {
    throw new Error(`[TOKEN VAULT] No ${provider} token found for client ${clientId}`)
  }

  if (auth.token_status !== 'active') {
    throw new Error(`[TOKEN VAULT] Token status is '${auth.token_status}' for ${provider} — client ${clientId}`)
  }

  if (auth.token_expires_at && new Date(auth.token_expires_at) < new Date()) {
    throw new Error(`[TOKEN VAULT] Token expired at ${auth.token_expires_at} — client ${clientId}`)
  }

  if (requiredScope && !auth.token_scope?.includes(requiredScope)) {
    throw new Error(`[TOKEN VAULT] Required scope '${requiredScope}' not granted for ${provider} — client ${clientId}`)
  }

  // Decrypt — never returns raw ciphertext
  return decryptToken(auth.encrypted_access_token)
}
```

---

## TOKEN ENCRYPTION — AES-256-GCM

Tokens are encrypted before writing to DB. The encryption key lives in Vercel env vars only.

```javascript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex') // 32 bytes / 64 hex chars

export function encryptToken(plaintext) {
  const iv  = randomBytes(12)       // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Store as: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptToken(stored) {
  const [ivHex, tagHex, ctHex] = stored.split(':')
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return decipher.update(Buffer.from(ctHex, 'hex')) + decipher.final('utf8')
}
```

**Required Vercel env var:**
```
TOKEN_ENCRYPTION_KEY=<64 hex chars — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

---

## FORGE AGENCY SEPARATION

FORGE's own agency accounts (Meta Business Manager, LinkedIn company page, etc.) use credentials stored in Vercel env vars under the `FORGE_*` prefix — not in the `client_authorizations` table.

| Context | Where credentials live |
|---------|----------------------|
| FORGE agency accounts | Vercel env vars (`FORGE_META_TOKEN`, `FORGE_LINKEDIN_TOKEN`, etc.) |
| Client accounts | `client_authorizations` table — keyed by `client_id` UUID |
| Cron jobs | Always resolve `client_id` from KV/Supabase before calling `getClientToken()` |

**Hard rule:** SPARK and SCOUT must never read a `FORGE_*` env var when operating on a client pipeline. Any function that can be called in either context must receive `clientId` as an explicit parameter — no globals, no ambient context.

---

## REQUIRED ENV VARS (add to Vercel)

```
TOKEN_ENCRYPTION_KEY=          # 64 hex chars — generate once, rotate annually
SUPABASE_URL=                  # from Supabase project settings
SUPABASE_SERVICE_ROLE_KEY=     # service role key (not anon key) — never expose to client
```

---

## OBJECT MAP

```
clients
  └── id (UUID) ─────────────────────────────────┐
                                                  │
client_authorizations                             │
  └── client_id (FK) ──────────────────────── references clients.id
  └── provider_name ('meta' | 'linkedin' | 'tiktok' | 'youtube' | 'google_business' | ...)
  └── encrypted_access_token (AES-256-GCM ciphertext)
  └── token_status ('active' | 'expired' | 'revoked' | 'pending')
  └── token_scope (TEXT[])
  └── last_sync_timestamp

token_audit_log
  └── client_id (FK) ──────────────────────── references clients.id
  └── provider_name
  └── action ('token_read' | 'publish_success' | 'publish_failure' | ...)
  └── success (BOOLEAN)
  └── executed_at

KV (Vercel / Upstash)
  └── 'sub:{paypal_subscription_id}'  → { email, name, tier, client_slug, status }
  └── 'forge:active_subscriptions'    → SET of subscription IDs
  └── 'forge:sale:{sale_id}'          → dedup flag (7-day TTL)
  └── 'forge:cron_job:{slug}:{cycle}' → { batch_id, tier, status }
```

---

*FORGE Data Architecture | SCHEMA.md | Part of skills/data-architecture*
