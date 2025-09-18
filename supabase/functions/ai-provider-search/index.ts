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

    return new Response(JSON.stringify({
      results: rankedResults,
      searchAnalysis,
      newProvidersFound: googlePlacesResults.length
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
        
        Respond with JSON containing:
        - activities: array of activity types (e.g., ["soccer", "swimming", "art"])
        - ageGroups: array of age ranges (e.g., ["5-8", "9-12"])
        - keywords: array of relevant search terms
        - location: specific location if mentioned
        - googlePlacesQuery: a Google Places search query to find relevant businesses
        
        Example activities: soccer, swimming, art, music, dance, coding, science, martial arts, gymnastics, tennis, basketball`
      }, {
        role: 'user',
        content: query
      }],
      max_tokens: 300,
      temperature: 0.3
    }),
  });

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
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
  const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!googleMapsApiKey) {
    console.log("No Google Maps API key found, skipping Places search");
    return [];
  }

  const searchQueries = [
    `${searchAnalysis.googlePlacesQuery} children activities ${location}`,
    ...searchAnalysis.activities.map((activity: string) => 
      `${activity} classes children ${location}`
    )
  ];

  const allResults: any[] = [];

  for (const searchQuery of searchQueries.slice(0, 3)) { // Limit to 3 queries
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleMapsApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
        const relevantResults = data.results
          .filter((place: any) => 
            place.business_status === 'OPERATIONAL' &&
            place.rating && place.rating >= 3.5
          )
          .slice(0, 5) // Limit results per query
          .map((place: any) => ({
            google_place_id: place.place_id,
            business_name: place.name,
            location: place.formatted_address,
            latitude: place.geometry?.location?.lat,
            longitude: place.geometry?.location?.lng,
            google_rating: place.rating,
            google_reviews_count: place.user_ratings_total,
            description: null,
            specialties: searchAnalysis.activities,
            source: 'google_places'
          }));

        allResults.push(...relevantResults);
      }
    } catch (error) {
      console.error(`Error searching Google Places for "${searchQuery}":`, error);
    }
  }

  // Remove duplicates based on place_id
  const uniqueResults = allResults.filter((result, index, self) => 
    index === self.findIndex(r => r.google_place_id === result.google_place_id)
  );

  return uniqueResults.slice(0, 10); // Limit total results
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
        
        Respond with JSON array of provider IDs in ranked order, each with a "relevanceScore" (0-100) and "explanation" of why it matches.`
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
  
  try {
    let content = data.choices[0].message.content;
    // Remove markdown formatting if present
    content = content.replace(/```json\n?/g, '').replace(/\n?```/g, '');
    const rankings = JSON.parse(content);
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