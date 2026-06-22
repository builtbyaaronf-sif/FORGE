// api/submit.js — FORGE lead capture endpoint
// Env vars required: HUBSPOT_ACCESS_TOKEN (HubSpot Private App token)

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const firstName = body['First Name'] || '';
  const lastName  = body['Last Name']  || '';
  const email     = body['Email']      || '';
  const trade     = body['Trade']      || '';
  const area      = body['Area']       || '';
  const message   = body['Message']    || '';
  const logoUrl   = body['Logo']       || '';
  if (!email || !trade || !area) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!token) {
    console.warn('[FORGE] HUBSPOT_ACCESS_TOKEN not set');
    console.log('[FORGE] Lead:', { firstName, lastName, email, trade, area });
    return res.status(200).json({ success: true });
  }

  try {
    const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        properties: {
          firstname:      firstName,
          lastname:       lastName,
          email:          email,
          jobtitle:       trade,
          city:           area,
          lifecyclestage: 'lead',
          hs_lead_status: 'NEW'
        }
      })
    });

    if (!hsRes.ok) {
      const err = await hsRes.json().catch(() => ({}));
      if (hsRes.status === 409) return res.status(200).json({ success: true });
      console.error('[FORGE] HubSpot error:', JSON.stringify(err));
      return res.status(500).json({ error: 'CRM error' });
    }

    const contact = await hsRes.json();
    console.log('[FORGE] Contact created:', contact.id);

    // Attach logo URL and message as a HubSpot Note
    const noteLines = [];
    if (message && message !== 'None') noteLines.push('Message: ' + message);
    if (logoUrl && logoUrl !== 'None') noteLines.push('Logo: ' + logoUrl);

    if (noteLines.length > 0 && contact.id) {
      await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          properties: {
            hs_note_body: noteLines.join('\n'),
            hs_timestamp: Date.now().toString()
          },
          associations: [{
            to: { id: contact.id },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }]
          }]
        })
      }).catch(e => console.warn('[FORGE] Note failed:', e.message));
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[FORGE] Submit error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
