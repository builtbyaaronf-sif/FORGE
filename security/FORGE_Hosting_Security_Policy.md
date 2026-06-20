# FORGE Hosting Security Policy
**Version:** 1.0 | **Effective:** June 2026 | **Owner:** Aaron F.

---

## 1. Purpose

This policy defines how FORGE manages, secures, and monitors all client websites hosted under FORGE infrastructure. Every team member and AI agent operating within FORGE must follow these rules without exception.

---

## 2. Infrastructure Standards

### 2.1 Vercel Project Isolation
- **One Vercel project per client. No exceptions.**
- Client sites must never share a project, monorepo deployment, or build pipeline with another client.
- Each project must be named `forge-[client-slug]` (e.g., `forge-acme-plumbing`).
- Projects must be deployed under the FORGE Vercel team account, not a personal account.

### 2.2 Domain Ownership
- All domains must be registered in the **client's name** and on the **client's registrar account**.
- FORGE never registers domains on behalf of clients under FORGE's own account.
- DNS is pointed to Vercel via CNAME/A records supplied to the client.
- If FORGE assists with domain purchase, the client must provide their own registrar credentials or create their own account. FORGE documents the registrar and domain in the Client Record.

### 2.3 Environment Variables
- All API keys, tokens, and secrets must be stored in **Vercel's encrypted Environment Variables** — never hardcoded in source files.
- Environment variables must be set to **Production only** unless a Preview or Development value is explicitly required.
- No secret should appear in a Git repository, HTML comment, or client-facing file.
- A log of what environment variables exist for each client must be kept in the Client Record (names only — never values).

---

## 3. Security Headers (Mandatory on All Deployments)

Every client site must include the following response headers, enforced via `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.hsforms.com https://forms.hubspot.com;" }
      ]
    }
  ]
}
```

> **Note:** The CSP policy above is the FORGE baseline. Adjust `connect-src` and `script-src` per client integrations (HubSpot, Calendly, Formspree, etc.) and document any additions.

---

## 4. Form Data & Personal Data Handling

### 4.1 Data Routing
- Form submissions must route to one of: **Formspree**, **HubSpot**, or **WhatsApp Business API**.
- FORGE infrastructure must not store form submissions at rest. We are a conduit, not a database.
- If a client requests data storage, they must be directed to HubSpot CRM (which becomes the data store) and the DPA must be signed before deployment.

### 4.2 GDPR Compliance
- Every client site must include a **Privacy Policy** (auto-generated during deployment), a **Cookie Banner**, and a link to **Terms & Conditions** in the footer.
- Sites collecting personal data (name, email, phone) must display a clear consent checkbox on all forms.
- FORGE acts as a **Data Processor**. The client is the **Data Controller**. This must be reflected in the signed DPA before the site goes live.

---

## 5. Client Vetting

Before deploying any client website, the following must be confirmed:

| Check | Required |
|---|---|
| Business is legitimate (Companies House / LinkedIn verified) | ✅ |
| No adult content, gambling, weapons, or regulated financial services | ✅ |
| Client has agreed to Hosting Terms | ✅ |
| Client has signed DPA (if collecting personal data) | ✅ |
| ICO registration confirmed (FORGE's own) | ✅ |

See **Client_Vetting_Criteria.md** for full red-flag list.

---

## 6. Access Control

- FORGE Vercel account must be protected by a strong password + **MFA (authenticator app)**.
- Aaron's Vercel account is the sole owner. No client is ever added as a team member unless explicitly requested and approved.
- If a client needs access to their Vercel project (e.g., to add their own env vars), create them as a **Viewer** role only.
- When a client relationship ends, their Vercel project must be transferred to their own Vercel account within 30 days. See Section 8.

---

## 7. Incident Response

If a client site is compromised, defaced, or reported for abuse:

1. **Immediately** disable the Vercel deployment (set to "Pause Deployment" in Vercel dashboard).
2. Notify the client within 2 hours.
3. Identify the vector (compromised env var, third-party script injection, DNS hijack).
4. Do not re-deploy until the vector is patched.
5. If personal data was exposed, notify the client that they (as Data Controller) must report to the ICO within **72 hours** under UK GDPR.
6. Document the incident in the Client Record.

---

## 8. Client Offboarding

When a client leaves FORGE:

1. Export all Vercel project settings and env var names (not values) for the handover pack.
2. Transfer the Vercel project to the client's own Vercel account OR package the source code for self-hosting.
3. Remove all FORGE-added DNS records from their domain (or provide instructions to do so).
4. Revoke any FORGE API keys used in their integrations (HubSpot token, Formspree endpoint, etc.) and notify client to create their own.
5. Delete the project from FORGE's Vercel team within 7 days of confirmed transfer.
6. Retain client records for 6 years (UK contract law requirement).

---

## 9. Self-Hosted Clients

Clients who choose to self-host their site operate under the **Self-Host Agreement** and assume full responsibility for:

- SSL certificate management
- Server security and patching
- Environment variable security
- GDPR compliance on their infrastructure

FORGE provides a **Self-Host Security Handover Pack** (see `Self_Host_Security_Pack.md`) and a personalised Tavus walkthrough video. After handover, FORGE bears no liability for the client's infrastructure.

---

## 10. Policy Review

This policy is reviewed every 6 months or after any security incident, whichever comes first.

---

*FORGE Agency | builtbyaaronf@gmail.com*
