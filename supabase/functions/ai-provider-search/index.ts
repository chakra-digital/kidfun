import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location = "Austin, TX" } = await req.json();
    
    console.log("AI Provider Search request:", { query, location });

    // Create a hash for caching (simple hash: query + location)
    const cacheKey = `${query.toLowerCase().trim()}_${location.toLowerCase().trim()}`;
    const queryHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(cacheKey)
    ).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Check cache first
    const { data: cachedResult } = await supabase
      .from('search_cache')
      .select('*')
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedResult) {
      console.log('Returning cached results');
      return new Response(JSON.stringify({
        results: cachedResult.results,
        searchAnalysis: cachedResult.search_analysis,
        newProvidersFound: 0,
        fromCache: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Use OpenAI to analyze the search query and extract structured information
    const searchAnalysis = await analyzeSearchQuery(query);
    console.log("Search analysis:", searchAnalysis);

    // Step 2: Search Google Places for new providers based on the analysis
    const googlePlacesResults = await searchGooglePlaces(searchAnalysis, location);
    console.log(`Found ${googlePlacesResults.length} Google Places results`);

    // Step 3: Get existing providers from our database
    const { data: existingProviders } = await supabase.rpc('get_public_provider_info');

    // Step 4: Combine and rank results using AI
    const rankedResults = await rankAndCombineResults(
      existingProviders || [],
      googlePlacesResults,
      searchAnalysis,
      query
    );

    // Step 5: Cache the results
    const { error: cacheError } = await supabase.from('search_cache').insert({
      query_hash: queryHash,
      original_query: query,
      location: location,
      results: rankedResults,
      search_analysis: searchAnalysis
    });
    
    if (cacheError) {
      console.error('Failed to cache results:', cacheError);
    }

    return new Response(JSON.stringify({
      results: rankedResults,
      searchAnalysis,
      newProvidersFound: googlePlacesResults.length,
      fromCache: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-provider-search:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      results: [],
      searchAnalysis: null,
      newProvidersFound: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeSearchQuery(query: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `You are a search query analyzer for children's activity providers. Extract structured information from user queries.
        
        Respond ONLY with valid JSON (no markdown, no code blocks) containing:
        - activities: array of activity types (e.g., ["soccer", "swimming", "art"])
        - ageGroups: array of age ranges (e.g., ["5-8", "9-12"])
        - keywords: array of relevant search terms
        - location: specific location if mentioned
        - googlePlacesQuery: a Google Places search query to find relevant businesses
        
        Example activities: soccer, swimming, art, music, dance, coding, science, martial arts, gymnastics, tennis, basketball, camps, daycare, tutoring`
      }, {
        role: 'user',
        content: query
      }],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.3
    }),
  });

  const data = await response.json();
  console.log('Query analysis raw response:', data.choices[0].message.content);
  
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    console.log('Parsed query analysis:', parsed);
    return parsed;
  } catch (error) {
    console.error('Failed to parse query analysis:', error);
    // Fallback if JSON parsing fails
    return {
      activities: [],
      ageGroups: [],
      keywords: [query],
      location: null,
      googlePlacesQuery: query
    };
  }
}

async function searchGooglePlaces(searchAnalysis: any, location: string) {
  const googlePlacesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!googlePlacesApiKey) {
    console.log("No Google Places API key found, skipping Places search");
    return [];
  }

  // First, geocode the location to get lat/lng for better location bias
  let locationBias = '';
  let resolvedLocation = location;
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googlePlacesApiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
      const coords = geocodeData.results[0].geometry.location;
      locationBias = `&location=${coords.lat},${coords.lng}&radius=40000`; // 40km radius
      // Use the resolved location from geocoding for search context
      resolvedLocation = geocodeData.results[0].formatted_address;
      console.log(`Geocoded location: ${location} -> ${resolvedLocation} (${coords.lat},${coords.lng})`);
    } else {
      console.log(`Geocoding failed for "${location}": ${geocodeData.status}`);
    }
  } catch (error) {
    console.error('Error geocoding location:', error);
  }

  // Create more specific search queries for Google Places with better keywords
  // Use resolvedLocation for more precise results
  const baseQueries = [
    `${searchAnalysis.googlePlacesQuery} ${resolvedLocation}`,
    // Add specific program-type keywords to filter out irrelevant results
    ...searchAnalysis.activities.map((activity: string) => `${activity} camp for kids ${resolvedLocation}`),
    ...searchAnalysis.activities.map((activity: string) => `${activity} classes children ${resolvedLocation}`),
    ...searchAnalysis.activities.map((activity: string) => `${activity} program youth ${resolvedLocation}`),
  ];

  const searchQueries = baseQueries
    .filter(q => q && q.trim())
    .slice(0, 6); // Limit to 6 queries

  console.log('Google Places search queries:', searchQueries);

  const allResults: any[] = [];

  for (const searchQuery of searchQueries) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googlePlacesApiKey}&type=establishment${locationBias}`;
      
      console.log(`Searching Google Places: "${searchQuery}"`);
      const response = await fetch(url);
      const data = await response.json();

      console.log(`Google Places API response status: ${data.status}, results count: ${data.results?.length || 0}`);

      if (data.status === 'OK' && data.results) {
        const relevantPlaces = data.results
          .filter((place: any) => {
            const isOperational = !place.business_status || place.business_status === 'OPERATIONAL';
            const hasMinRating = !place.rating || place.rating >= 3.0;
            return isOperational && hasMinRating;
          })
          .slice(0, 8);

        // Fetch detailed info including phone and website for each place
        const detailedResults = await Promise.all(
          relevantPlaces.map(async (place: any) => {
            try {
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,rating,user_ratings_total,formatted_phone_number,international_phone_number,website,business_status&key=${googlePlacesApiKey}`;
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();
              
              if (detailsData.status === 'OK' && detailsData.result) {
                const details = detailsData.result;
                return {
                  google_place_id: place.place_id,
                  business_name: place.name,
                  location: place.formatted_address,
                  latitude: place.geometry?.location?.lat,
                  longitude: place.geometry?.location?.lng,
                  google_rating: place.rating,
                  google_reviews_count: place.user_ratings_total,
                  description: `${place.name} offers activities and services for children and families in the ${resolvedLocation} area.`,
                  specialties: searchAnalysis.activities.length > 0 ? searchAnalysis.activities : [place.types?.[0] || 'Activities'],
                  amenities: ['Outdoor Space', 'Safety Equipment'],
                  pricing_model: 'per_session',
                  base_price: 25.00,
                  capacity: 20,
                  age_groups: ['3-5', '6-12', '13-17'],
                  phone: details.formatted_phone_number || details.international_phone_number,
                  external_website: details.website,
                  source: 'google_places'
                };
              }
            } catch (error) {
              console.error(`Error fetching details for ${place.name}:`, error);
            }
            
            // Fallback if details fetch fails
            return {
              google_place_id: place.place_id,
              business_name: place.name,
              location: place.formatted_address,
              latitude: place.geometry?.location?.lat,
              longitude: place.geometry?.location?.lng,
              google_rating: place.rating,
              google_reviews_count: place.user_ratings_total,
              description: `${place.name} offers activities and services for children and families in the ${resolvedLocation} area.`,
              specialties: searchAnalysis.activities.length > 0 ? searchAnalysis.activities : [place.types?.[0] || 'Activities'],
              amenities: ['Outdoor Space', 'Safety Equipment'],
              pricing_model: 'per_session',
              base_price: 25.00,
              capacity: 20,
              age_groups: ['3-5', '6-12', '13-17'],
              source: 'google_places'
            };
          })
        );

        allResults.push(...detailedResults);
        console.log(`Added ${detailedResults.length} results from query: "${searchQuery}"`);
      } else if (data.status !== 'ZERO_RESULTS') {
        console.log(`Google Places API error for query "${searchQuery}":`, data.status, data.error_message);
      }
    } catch (error) {
      console.error(`Error searching Google Places for "${searchQuery}":`, error);
    }
  }

  // Remove duplicates based on place_id
  const uniqueResults = allResults.filter((result, index, self) => 
    index === self.findIndex(r => r.google_place_id === result.google_place_id)
  );

  console.log(`Total unique Google Places results: ${uniqueResults.length}`);
  return uniqueResults.slice(0, 15); // More total results
}

async function rankAndCombineResults(existingProviders: any[], googlePlacesResults: any[], searchAnalysis: any, originalQuery: string) {
  // Combine existing and new providers
  const allProviders = [
    ...existingProviders.map((p: any) => ({ ...p, source: 'database' })),
    ...googlePlacesResults
  ];

  if (allProviders.length === 0) {
    return [];
  }

  // Use OpenAI to rank and explain relevance
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `You are helping parents find the best activity providers for their children. 
        
        Rank the providers based on relevance to the search query. Consider:
        - Activity match (specialties, business name, description)
        - Age appropriateness 
        - Location convenience
        - Rating and reviews
        - Source reliability (database providers are pre-verified)
        
        Respond ONLY with a JSON array (no markdown, no code blocks). Each item should have:
        - id: provider ID or google_place_id
        - relevanceScore: number 0-100
        - explanation: brief reason for match`
      }, {
        role: 'user',
        content: `Search query: "${originalQuery}"
        Search analysis: ${JSON.stringify(searchAnalysis)}
        
        Providers to rank: ${JSON.stringify(allProviders.map(p => ({
          id: p.id || p.google_place_id,
          business_name: p.business_name,
          specialties: p.specialties,
          description: p.description,
          location: p.location,
          rating: p.google_rating,
          source: p.source
        })))}`
      }],
      max_tokens: 1500,
      temperature: 0.3
    }),
  });

  const data = await response.json();
  console.log('Ranking raw response:', data.choices[0].message.content);
  
  try {
    let content = data.choices[0].message.content;
    // Remove markdown formatting if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const rankings = JSON.parse(content);
    console.log('Parsed rankings:', rankings);
    // Apply rankings to providers
    const rankedProviders = rankings
      .filter((ranking: any) => ranking.relevanceScore >= 30) // Filter low relevance
      .map((ranking: any) => {
        const provider = allProviders.find(p => 
          (p.id && p.id === ranking.id) || 
          (p.google_place_id && p.google_place_id === ranking.id)
        );
        
        if (provider) {
          return {
            ...provider,
            relevanceScore: ranking.relevanceScore,
            explanation: ranking.explanation,
            isNewDiscovery: provider.source === 'google_places'
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    return rankedProviders.slice(0, 20); // Limit to top 20 results
    
  } catch (error) {
    console.error('Error parsing AI rankings:', error);
    // Fallback: return providers sorted by rating
    return allProviders
      .sort((a: any, b: any) => (b.google_rating || 0) - (a.google_rating || 0))
      .slice(0, 20)
      .map((provider: any) => ({
        ...provider,
        relevanceScore: 50,
        explanation: "Sorted by rating (AI ranking failed)",
        isNewDiscovery: provider.source === 'google_places'
      }));
  }
}