// Supabase Edge Function: process-ai-image
// Deploy: supabase functions deploy process-ai-image
//
// In production, replace the body of analyzeImage() with a real call to your
// Python/FastAPI computer-vision service at AI_SERVICE_URL.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) throw new Error('imageUrl is required')

    const result = await analyzeImage(imageUrl)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function analyzeImage(_imageUrl: string) {
  const aiServiceUrl = Deno.env.get('AI_SERVICE_URL')
  const aiServiceKey = Deno.env.get('AI_SERVICE_API_KEY')

  if (aiServiceUrl && aiServiceKey) {
    // ── Production: call your real ML microservice ──────────
    const res = await fetch(`${aiServiceUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiServiceKey}`,
      },
      body: JSON.stringify({ image_url: _imageUrl }),
    })
    if (!res.ok) throw new Error(`AI service error: ${res.statusText}`)
    return res.json()
  }

  // ── Fallback: deterministic simulation ─────────────────
  // Seed from URL so the same image always returns the same scores.
  const seed = [..._imageUrl].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rand = (min: number, max: number, s: number) =>
    min + ((seed * s * 9301 + 49297) % 233280) / 233280 * (max - min)

  const conditionScore  = Math.round(rand(0.72, 0.96, 1) * 100) / 100
  const moistureLevel   = Math.round(rand(8, 22, 2) * 10) / 10
  const estimatedWeight = Math.round(rand(400, 2500, 3) / 50) * 50
  const moisturePenalty = moistureLevel > 18 ? 0.85 : moistureLevel > 14 ? 0.95 : 1.0
  const suggestedPrice  = Math.round(estimatedWeight * 15 * conditionScore * moisturePenalty / 100) * 100

  return {
    condition_score:      conditionScore,
    moisture_level:       moistureLevel,
    estimated_weight_kg:  estimatedWeight,
    suggested_price:      suggestedPrice,
  }
}
