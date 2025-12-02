import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, specialties = [], description, location } = await req.json();
    
    if (!businessName) {
      return new Response(
        JSON.stringify({ error: 'Business name is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create a unique, whimsical prompt based on provider info
    // Using "nano banana style" - colorful, playful, geometric illustrations
    const activityType = specialties[0] || 'activities';
    const prompt = `Create a vibrant, playful illustration in a modern flat design style with bold colors and geometric shapes. 
The image should represent a children's ${activityType} program or facility named "${businessName}".
Style: Colorful, cheerful, abstract geometric shapes, minimal detail, kid-friendly aesthetic.
Include playful elements related to ${activityType} for children.
Use a bright, inviting color palette with gradients.
No text or words in the image.
Background should be a solid vibrant color or simple gradient.`;

    console.log('Generating AI image with prompt:', prompt);

    // Call Lovable AI with nano banana model (gemini-2.5-flash-image-preview)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI image generation failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      throw new Error('No image URL returned from AI');
    }

    console.log('Successfully generated unique AI image');

    return new Response(
      JSON.stringify({ imageUrl: generatedImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating provider image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
