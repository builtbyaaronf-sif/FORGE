# FORGE Security Framework

All security policies, legal templates, and deployment standards live here.

## Files

| File | Purpose | When to Use |
|---|---|---|
| `FORGE_Hosting_Security_Policy.md` | Internal rules for infrastructure management | Read before onboarding any client |
| `Client_Hosting_Agreement_DPA.md` | Legal contract + GDPR data processing addendum | Sign with every client before site goes live |
| `Vercel_Deployment_Security_Checklist.md` | Technical checklist per deployment | Run on every site before launch |
| `Client_Vetting_Criteria.md` | Sales-stage screening | Run before discovery call |
| `Self_Host_Security_Pack.md` | Handover doc for clients who self-host | Send alongside source code zip |
| `vercel_security_headers_snippet.json` | Ready-to-paste `vercel.json` headers block | Paste into every client's `vercel.json` |

## Process Order

```
1. Client enquires
      ↓
2. Client_Vetting_Criteria.md — screen before any work starts
      ↓
3. Client_Hosting_Agreement_DPA.md — sign before build starts
      ↓
4. Build site (include vercel_security_headers_snippet.json)
      ↓
5. Vercel_Deployment_Security_Checklist.md — run before go-live
      ↓
6a. FORGE-hosted: site live, log in Client Record
6b. Self-hosted: Self_Host_Security_Pack.md + Tavus video
```
