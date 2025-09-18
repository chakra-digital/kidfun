import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  formatted_phone_number?: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  }
}

const CENTRAL_TEXAS_COORDS = {
  lat: 30.2672,
  lng: -97.7431
};

const SEARCH_RADIUS = 80467; // ~50 miles in meters

const KID_ACTIVITY_TYPES = [
  'amusement_park',
  'gym', 
  'tourist_attraction',
  'art_gallery',
  'bowling_alley',
  'movie_theater',
  'zoo'
];

const KID_ACTIVITY_KEYWORDS = [
  'kids activities',
  'children classes',
  'youth sports',
  'summer camp',
  'dance studio',
  'martial arts',
  'swimming lessons',
  'rock climbing kids'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client first
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check authentication - get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Verify the JWT and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid authentication' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Import started by authenticated user: ${user.email}`);

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Places API key not configured');
    }

    const { searchType = 'nearby', limit = 20 } = await req.json().catch(() => ({}));
    
    console.log(`Starting provider import with searchType: ${searchType}, limit: ${limit}`);
    
    const allResults: GooglePlaceResult[] = [];

    if (searchType === 'nearby' || searchType === 'all') {
      // Search by business types
      for (const type of KID_ACTIVITY_TYPES) {
        console.log(`Searching for type: ${type}`);
        
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${CENTRAL_TEXAS_COORDS.lat},${CENTRAL_TEXAS_COORDS.lng}&radius=${SEARCH_RADIUS}&type=${type}&key=${googleApiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
          allResults.push(...(data.results || []));
          console.log(`Found ${data.results?.length || 0} results for type: ${type}`);
        } else {
          console.error(`Error searching for type ${type}:`, data.status, data.error_message);
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (searchType === 'keyword' || searchType === 'all') {
      // Search by keywords
      for (const keyword of KID_ACTIVITY_KEYWORDS) {
        console.log(`Searching for keyword: ${keyword}`);
        
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword + ' Austin Texas')}&radius=${SEARCH_RADIUS}&key=${googleApiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
          allResults.push(...(data.results || []));
          console.log(`Found ${data.results?.length || 0} results for keyword: ${keyword}`);
        } else {
          console.error(`Error searching for keyword ${keyword}:`, data.status, data.error_message);
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Remove duplicates by place_id
    const uniqueResults = Array.from(
      new Map(allResults.map(result => [result.place_id, result])).values()
    ).slice(0, limit);

    console.log(`Processing ${uniqueResults.length} unique results`);

    const processedProviders = [];
    const errors = [];

    for (const place of uniqueResults) {
      try {
        // Get detailed place information
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,url&key=${googleApiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        if (detailsData.status !== 'OK') {
          console.error(`Error getting details for ${place.name}:`, detailsData.status);
          continue;
        }

        const details = detailsData.result;

        // Check if already exists
        const { data: existingProvider } = await supabaseClient
          .from('provider_profiles')
          .select('id')
          .eq('google_place_id', place.place_id)
          .maybeSingle();

        if (existingProvider) {
          console.log(`Provider already exists: ${place.name} (place_id: ${place.place_id})`);
          continue;
        }

        // Transform Google Places data to our schema
        const providerData = {
          business_name: details.name,
          location: details.formatted_address || place.vicinity || 'Austin, TX',
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          description: `${details.name} offers activities and services for children and families in the Austin area.`,
          google_place_id: place.place_id,
          external_website: details.website || details.url,
          google_rating: details.rating,
          google_reviews_count: details.user_ratings_total,
          phone: details.formatted_phone_number,
          verification_status: 'unverified',
          user_id: null, // NULL for unverified providers - will be set when claimed
          // Set reasonable defaults based on business type
          age_groups: categorizeAgeGroups(place.types),
          specialties: categorizeSpecialties(place.types),
          amenities: categorizeAmenities(place.types),
          base_price: estimateBasePrice(place.types),
          pricing_model: 'per_session',
          capacity: 20,
          years_experience: null
        };

        const { data: insertedProvider, error: insertError } = await supabaseClient
          .from('provider_profiles')
          .insert([providerData])
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting provider ${details.name}:`, insertError);
          errors.push({ name: details.name, error: insertError.message });
        } else {
          processedProviders.push(insertedProvider);
          console.log(`Successfully imported: ${details.name}`);
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`Error processing place ${place.name}:`, error);
        errors.push({ name: place.name, error: error.message });
      }
    }

    const skippedCount = uniqueResults.length - processedProviders.length - errors.length;
    
    const response = {
      success: true,
      imported_count: processedProviders.length,
      skipped_count: skippedCount,
      error_count: errors.length,
      total_found: uniqueResults.length,
      providers: processedProviders.map(p => ({
        id: p.id,
        business_name: p.business_name,
        location: p.location,
        google_rating: p.google_rating
      })),
      errors: errors
    };

    console.log(`Import completed: ${processedProviders.length} imported, ${skippedCount} skipped (already exist), ${errors.length} errors`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-providers function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function categorizeAgeGroups(types: string[]): string[] {
  const ageGroups = [];
  
  if (types.some(t => ['amusement_park', 'zoo', 'tourist_attraction'].includes(t))) {
    ageGroups.push('3-5', '6-12', '13-17');
  } else if (types.some(t => ['gym', 'health'].includes(t))) {
    ageGroups.push('6-12', '13-17');
  } else {
    ageGroups.push('6-12'); // Default
  }
  
  return ageGroups;
}

function categorizeSpecialties(types: string[]): string[] {
  const specialties = [];
  
  if (types.includes('amusement_park')) specialties.push('Adventure Activities');
  if (types.includes('gym')) specialties.push('Sports & Fitness');
  if (types.includes('art_gallery')) specialties.push('Arts & Crafts');
  if (types.includes('tourist_attraction')) specialties.push('Educational Programs');
  if (types.includes('bowling_alley')) specialties.push('Social Activities');
  
  return specialties.length > 0 ? specialties : ['Recreational Activities'];
}

function categorizeAmenities(types: string[]): string[] {
  const amenities = [];
  
  if (types.includes('gym')) amenities.push('Indoor Facilities', 'Equipment Provided');
  if (types.includes('amusement_park')) amenities.push('Outdoor Space', 'Safety Equipment');
  if (types.includes('tourist_attraction')) amenities.push('Educational Materials', 'Guided Tours');
  
  return amenities.length > 0 ? amenities : ['Safe Environment'];
}

function estimateBasePrice(types: string[]): number {
  if (types.includes('amusement_park')) return 25;
  if (types.includes('gym')) return 30;
  if (types.includes('art_gallery')) return 20;
  if (types.includes('tourist_attraction')) return 15;
  
  return 25; // Default
}