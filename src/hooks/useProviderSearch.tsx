import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  radius?: number;
}

interface ProviderProfile {
  id: string;
  user_id: string | null;
  business_name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  description: string | null;
  age_groups: string[] | null;
  specialties: string[] | null;
  amenities: string[] | null;
  base_price: number | null;
  pricing_model: string | null;
  years_experience: number | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
  google_rating: number | null;
  google_reviews_count: number | null;
  external_website: string | null;
  phone: string | null;
  verification_status: string | null;
}

interface UseProviderSearchReturn {
  providers: ProviderProfile[];
  loading: boolean;
  error: string | null;
  searchProviders: (filters: SearchFilters) => Promise<void>;
  totalResults: number;
}

export const useProviderSearch = (): UseProviderSearchReturn => {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const searchProviders = async (filters: SearchFilters) => {
    try {
      setLoading(true);
      setError(null);

      // Start with base query
      let query = supabase.rpc('get_public_provider_info');

      // If we have search filters, we could enhance this with full-text search
      // For now, we'll filter on the frontend after getting all results
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredData = data || [];

      // Apply client-side filtering
      if (filters.query) {
        const searchTerm = filters.query.toLowerCase();
        filteredData = filteredData.filter(provider =>
          provider.business_name.toLowerCase().includes(searchTerm) ||
          provider.description?.toLowerCase().includes(searchTerm) ||
          provider.location.toLowerCase().includes(searchTerm) ||
          provider.specialties?.some(specialty => 
            specialty.toLowerCase().includes(searchTerm)
          ) ||
          provider.age_groups?.some(age => 
            age.toLowerCase().includes(searchTerm)
          )
        );
      }

      // Apply category filter
      if (filters.category && filters.category !== "all") {
        filteredData = filteredData.filter(provider =>
          provider.specialties?.includes(filters.category)
        );
      }

      // TODO: Implement location-based filtering when we have user location
      // For now, we show all Austin-area results

      setProviders(filteredData);
      setTotalResults(filteredData.length);
    } catch (err: any) {
      console.error("Error searching providers:", err);
      setError(err.message || "Failed to search providers");
      setProviders([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Load all providers on initial mount
  useEffect(() => {
    searchProviders({});
  }, []);

  return {
    providers,
    loading,
    error,
    searchProviders,
    totalResults,
  };
};