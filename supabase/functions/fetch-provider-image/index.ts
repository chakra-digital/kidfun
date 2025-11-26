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
    const { websiteUrl } = await req.json();

    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: 'websiteUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching image from website:', websiteUrl);

    // Fetch the website HTML with timeout and SSL error handling
    let html: string;
    try {
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KidFunBot/1.0)'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        console.log(`HTTP error ${response.status}, falling back to no image`);
        return new Response(
          JSON.stringify({ imageUrl: null, source: 'none' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      html = await response.text();
    } catch (fetchError: any) {
      // Handle SSL cert errors, timeouts, and other fetch failures gracefully
      console.log(`Fetch failed (${fetchError.message}), falling back to no image`);
      return new Response(
        JSON.stringify({ imageUrl: null, source: 'none' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract Open Graph image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      const imageUrl = ogImageMatch[1];
      console.log('Found Open Graph image:', imageUrl);
      
      return new Response(
        JSON.stringify({ imageUrl, source: 'og_image' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try Twitter card image as fallback
    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (twitterImageMatch) {
      const imageUrl = twitterImageMatch[1];
      console.log('Found Twitter card image:', imageUrl);
      
      return new Response(
        JSON.stringify({ imageUrl, source: 'twitter_image' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No image found
    console.log('No social media image found on website');
    return new Response(
      JSON.stringify({ imageUrl: null, source: 'none' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching provider image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch image', imageUrl: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
