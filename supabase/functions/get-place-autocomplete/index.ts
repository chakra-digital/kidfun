import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, type } = await req.json();
    
    if (!input || input.length < 2) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    // Call Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.append('input', input);
    
    // Support different place types
    if (type === 'school') {
      url.searchParams.append('types', 'school');
    } else if (type === 'establishment') {
      url.searchParams.append('types', 'establishment');
    } else {
      url.searchParams.append('types', '(cities)');
    }
    
    url.searchParams.append('components', 'country:us');
    url.searchParams.append('key', GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data);
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-place-autocomplete:', error);
    return new Response(
      JSON.stringify({ error: error.message, predictions: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
