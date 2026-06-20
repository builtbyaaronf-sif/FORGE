# FORGE Client Hosting Agreement & Data Processing Addendum
**Version:** 1.0 | **Effective:** June 2026

---

## PART A — HOSTING AGREEMENT

**Between:**
- **FORGE Agency** ("Agency") — operated by Aaron F., builtbyaaronf@gmail.com
- **[CLIENT NAME]** ("Client") — [Client business name, registered address]

**Date of Agreement:** [DATE]

---

### 1. Services Provided

The Agency agrees to host the Client's website ("the Site") on the Agency's cloud infrastructure (Vercel Inc., USA), accessible via the Client's custom domain. Hosting covers:

- Site deployment and uptime monitoring
- SSL certificate provision (via Vercel/Let's Encrypt)
- CDN delivery via Vercel's global edge network
- Integration maintenance (HubSpot, Calendly, Formspree) as agreed at build time

### 2. What Is NOT Included

The following are the Client's sole responsibility:

- Domain registration, renewal, and DNS management
- Content accuracy, legality, and compliance
- ICO registration if Client independently collects personal data
- Any third-party service accounts (HubSpot, Calendly, etc.)

### 3. Uptime & Availability

The Agency will use reasonable commercial efforts to maintain site availability. However:

- The Agency makes **no guarantee of 100% uptime**.
- Scheduled maintenance, Vercel platform outages, or force majeure events are excluded from any uptime commitment.
- The Agency is not liable for losses incurred during downtime.

### 4. Domain Ownership

The Client **retains full ownership** of their domain name at all times. The domain is registered in the Client's name. The Agency's role is limited to DNS configuration for hosting purposes.

### 5. Acceptable Use

The Client must not use the hosted site for:

- Unlawful activity of any kind
- Distribution of malware, spam, or phishing content
- Adult content, illegal gambling, weapons, or controlled substances
- Impersonation of any person or organisation
- Content that violates intellectual property rights

The Agency reserves the right to **immediately suspend** any site that violates this clause, without notice or refund.

### 6. Fees & Payment

Hosting fees, if applicable, are agreed separately in the Client's service proposal. Non-payment for 30+ days may result in site suspension.

### 7. Termination

Either party may terminate this agreement with **30 days written notice**.

On termination:
- The Agency will provide the Client with their full site source code within 14 days.
- The Agency will remove all FORGE DNS/hosting configuration.
- The Client is responsible for migrating to new hosting.
- Pre-paid hosting fees are non-refundable.

### 8. Liability Limitation

To the maximum extent permitted by UK law, the Agency's total liability under this agreement shall not exceed the fees paid by the Client in the 3 months preceding the claim. The Agency is not liable for indirect, consequential, or loss-of-business damages.

### 9. Governing Law

This agreement is governed by the laws of England and Wales. Any disputes shall be resolved in the courts of England and Wales.

---

## PART B — DATA PROCESSING ADDENDUM (DPA)

*This addendum applies where the Site collects personal data (names, emails, phone numbers, or any other data as defined under UK GDPR).*

### 10. Roles

| Party | Role |
|---|---|
| Client | **Data Controller** — determines why and how data is collected |
| FORGE Agency | **Data Processor** — processes data on behalf of the Controller |

### 11. Data Processed

The Agency may process the following categories of personal data on behalf of the Client:

- Name
- Email address
- Phone number
- Service enquiry details (submitted via forms on the Site)

The Agency does **not** process special category data (health, financial, biometric, etc.) and the Client must not configure the Site to collect such data without explicit written consent from the Agency.

### 12. Purpose of Processing

The Agency processes personal data solely for the purpose of transmitting form submissions to the Client's designated system (HubSpot CRM, Formspree, WhatsApp) and for no other purpose.

### 13. Data Retention

The Agency does not store form submission data at rest. Data passes through FORGE infrastructure in transit only. The Client's CRM or email system (Formspree, HubSpot) governs retention from that point.

### 14. Sub-Processors

The Agency uses the following sub-processors:

| Sub-Processor | Purpose | Location | Safeguard |
|---|---|---|---|
| Vercel Inc. | Site hosting and deployment | USA | Standard Contractual Clauses |
| Formspree Inc. | Form submission relay | USA | Privacy Shield successor / SCCs |
| HubSpot Inc. | CRM lead capture | USA | SCCs |
| Calendly Inc. | Booking management | USA | SCCs |

The Agency will notify the Client of any material change to sub-processors with 30 days notice.

### 15. Security Measures

The Agency implements the following technical and organisational measures:

- Encrypted environment variables (no secrets in source code)
- HTTPS enforced on all deployments via HSTS
- Security headers on all responses (CSP, X-Frame-Options, etc.)
- Access to hosting infrastructure restricted to Agency personnel only
- MFA enforced on all Agency infrastructure accounts

### 16. Data Subject Rights

If the Client receives a data subject access request, erasure request, or other UK GDPR rights request relating to data transmitted via the Site, the Agency will cooperate reasonably to assist, provided the request is received in writing with 5 business days for the Agency to respond.

### 17. Breach Notification

In the event of a personal data breach affecting Client data, the Agency will notify the Client within **48 hours** of becoming aware. The Client (as Data Controller) is responsible for notifying the ICO within 72 hours if required under UK GDPR Article 33.

### 18. Audit Rights

The Client may request written confirmation of the Agency's compliance with this DPA once per calendar year, with 30 days notice.

---

## Signatures

**FORGE Agency**

Name: Aaron F.
Signature: _________________________ Date: _____________

**Client**

Name: _________________________
Business: _________________________
Signature: _________________________ Date: _____________

---

*This document should be countersigned before any client website that collects personal data goes live.*
