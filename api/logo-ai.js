/**
 * FORGE Logo AI — Generate icon variants via fal.ai Ideogram V3
 * GET /api/logo-ai?color=0099FF&trade=plumber
 *
 * Returns 3 AI-generated icon options at 1024×1024 (square_hd).
 * Cost: ~$0.12 per call (3 × $0.04) — only triggered when client reaches step 2.
 *
 * Requires env var:
 *   FAL_API_KEY — fal.ai API key (pay-as-you-go, no subscription)
 */

// Extend function timeout to 60s — Ideogram generation takes 10-25s.
// Vercel Pro supports up to 300s; hobby supports up to 60s.
export const config = { maxDuration: 60 };

const FAL_ENDPOINT = 'https://fal.run/fal-ai/ideogram/v3';

// Parse hex string to RGB object for Ideogram's color_palette param.
function hexToRgb(hex) {
  const h = String(hex).replace('#', '').toLowerCase().padEnd(6, '0');
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

// Derive a lighter (highlight) and darker (shadow) variant of a brand colour.
// Used to give Ideogram a full tonal range so it can produce gradient effects.
function deriveHues(rgb) {
  const clamp = v => Math.min(255, Math.max(0, Math.round(v)));
  const light = { // ~60% lighter — near-white tint for bright core glow
    r: clamp(rgb.r + (255 - rgb.r) * 0.60),
    g: clamp(rgb.g + (255 - rgb.g) * 0.60),
    b: clamp(rgb.b + (255 - rgb.b) * 0.60),
  };
  const dark = { // ~55% darker — deep saturated shadow for outer edges
    r: clamp(rgb.r * 0.45),
    g: clamp(rgb.g * 0.45),
    b: clamp(rgb.b * 0.45),
  };
  return { light, dark };
}

// Three distinct icon concepts. Fixed seeds = reproducible results per brand colour.
// Each prompt describes the gradient treatment differently so the three icons
// each have their own distinctive visual character.
function buildVariants(trade) {
  return [
    {
      id:    'spark-burst',
      label: 'Spark Burst',
      desc:  'Twelve lines radiating from a glowing centre. Gradient from bright core to deep tips.',
      seed:  42,
      // Radial gradient: white-hot centre fading through brand colour to deep at the tips
      prompt: 'Minimalist geometric logo icon mark on pure black background. Twelve sharp lines radiating equally from a central point. Gradient effect along each line: bright near-white glowing centre fading through vivid colour to deep saturated dark tips. Small square nodes at each tip. Symmetric starburst. Neon glow at the centre. No text, no letters, no words. Professional technology brand mark. Dark background.',
    },
    {
      id:    'spark-cross',
      label: 'Signal Cross',
      desc:  'Cross dominant burst with angular gradient and subtle inner glow.',
      seed:  137,
      // Angular gradient: bright on the long cardinal spikes, deeper on the diagonals
      prompt: `Minimalist geometric logo icon mark on pure black background. Four long sharp cardinal lines with eight shorter diagonal lines forming a starburst cross. The four main spikes are brighter with vivid colour gradient, the eight shorter lines slightly deeper in tone. Gradient from glowing bright centre outward to darker saturated edges. Sharp angular tips with square nodes. No text, no letters. Dark background, glowing coloured icon. Professional brand icon for ${trade} business.`,
    },
    {
      id:    'spark-minimal',
      label: 'Diamond Node',
      desc:  'Eight lines in a diamond pattern. Deep hue gradient with a luminous centre.',
      seed:  256,
      // Prismatic: the lines shift slightly in hue from warm to cool across the diamond
      prompt: 'Minimalist geometric logo icon mark on pure black background. Eight sharp lines at 45 degree intervals forming a symmetric diamond star. Prismatic gradient across the lines: subtle hue shift from warm to cool tones, creating depth and dimension. Bright luminous centre point fading to rich saturated colour at the tips. Square nodes at each tip. No text, no letters, no words. Dark background, glowing coloured geometric mark. Bold and premium professional logo.',
    },
  ];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    console.error('FAL_API_KEY not set');
    return res.status(500).json({ error: 'Icon generation not configured. FAL_API_KEY missing.' });
  }

  const color        = req.query.color || '0099FF';
  const trade        = req.query.trade || 'professional services';
  const rgb          = hexToRgb(color);
  const { light, dark } = deriveHues(rgb);

  // Full tonal palette: black canvas + 3 tones of the brand colour.
  // This gives Ideogram the range it needs to render genuine gradient effects
  // across the icon lines (bright highlight core → brand mid → deep shadow tips).
  const colorPalette = {
    members: [
      { rgb: { r: 5, g: 5, b: 5 }, color_weight: 0.55 }, // black background (dominant)
      { rgb: light,                 color_weight: 0.15 }, // bright highlight / glow
      { rgb,                        color_weight: 0.20 }, // brand colour mid-tone
      { rgb: dark,                  color_weight: 0.10 }, // deep shadow at tips
    ],
  };

  const variants = buildVariants(trade);

  try {
    const results = await Promise.all(
      variants.map(async (v) => {
        const body = {
          prompt:           v.prompt,
          image_size:       'square_hd',          // 1024×1024
          style:            'DESIGN',             // correct V3 field name
          rendering_speed:  'TURBO',              // fastest (~8-12s)
          expand_prompt:    false,                // don't let MagicPrompt override our prompt
          color_palette:    colorPalette,
          negative_prompt:  'text, letters, words, numbers, watermark, blurry, low quality, asymmetric, noisy, complex background, photorealistic, 3d render',
          seed:             v.seed,
        };

        const falRes = await fetch(FAL_ENDPOINT, {
          method:  'POST',
          headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!falRes.ok) {
          const errText = await falRes.text().catch(() => '(no body)');
          console.error(`fal.ai ${falRes.status} for variant ${v.id}:`, errText);
          throw new Error(`fal.ai ${falRes.status}: ${errText.slice(0, 300)}`);
        }

        const data     = await falRes.json();
        const imageUrl = data?.images?.[0]?.url;
        if (!imageUrl) {
          console.error('Unexpected fal.ai response:', JSON.stringify(data).slice(0, 300));
          throw new Error('No image URL in fal.ai response');
        }

        // fal.ai CDN blocks cross-origin image requests from external domains.
        // Fetch the image server-side and return as a base64 data URI so the
        // browser can render it without hitting the CDN directly.
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
        const buffer  = await imgRes.arrayBuffer();
        const base64  = Buffer.from(buffer).toString('base64');
        const mime    = imgRes.headers.get('content-type') || 'image/png';
        const dataUri = `data:${mime};base64,${base64}`;

        // cdn_url = original fal.ai https URL, used by the wizard for KV storage.
        // url = base64 data URI, used only for in-browser card display.
        return { id: v.id, label: v.label, desc: v.desc, url: dataUri, cdn_url: imageUrl };
      })
    );

    return res.status(200).json({ icons: results, color, trade });

  } catch (err) {
    console.error('Logo AI generation error:', err.message);
    return res.status(500).json({ error: 'Icon generation failed', detail: err.message });
  }
}
