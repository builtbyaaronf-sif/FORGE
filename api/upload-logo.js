export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://forgeisagentic.tech');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { logo, trade, filename } = req.body || {};
  if (!logo || !filename) return res.status(400).json({ error: 'Missing logo or filename' });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Storage not configured' });
  try {
    const m = logo.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: 'Invalid format' });
    const buf  = Buffer.from(m[2], 'base64');
    const ext  = filename.split('.').pop().toLowerCase().slice(0,4) || 'png';
    const slug = (trade||'x').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,20);
    const path = 'logos/' + Date.now() + '-' + slug + '.' + ext;
    const up = await fetch(supabaseUrl+'/storage/v1/object/forge-lead-assets/'+path, {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+serviceKey, 'Content-Type':m[1], 'x-upsert':'true' },
      body: buf
    });
    if (!up.ok) { const e = await up.json().catch(()=>({})); return res.status(500).json({ error:'Upload failed', detail:e }); }
    return res.status(200).json({ url: supabaseUrl+'/storage/v1/object/public/forge-lead-assets/'+path });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
