import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  location: string;
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
  // Truly sensitive fields only available to the provider themselves
  license_number?: string | null;
}

interface UseProviderProfilesReturn {
  profiles: ProviderProfile[];
  loading: boolean;
  error: string | null;
  refreshProfiles: () => void;
}

export const useProviderProfiles = (): UseProviderProfilesReturn => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current user's profile to determine their type
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      let data, fetchError;

      if (userProfile.user_type === "parent") {
        // Parents can only see public, non-sensitive information using secure function
        const result = await supabase.rpc('get_public_provider_info');
        data = result.data;
        fetchError = result.error;
      } else if (userProfile.user_type === "provider") {
        // Providers can see their own complete profile including sensitive data
        const result = await supabase
          .from("provider_profiles")
          .select("*")
          .eq("user_id", user.id);
        data = result.data;
        fetchError = result.error;
      } else {
        throw new Error("Invalid user type");
      }

      if (fetchError) throw fetchError;

      setProfiles(data || []);
    } catch (err: any) {
      console.error("Error fetching provider profiles:", err);
      setError(err.message || "Failed to fetch provider profiles");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const refreshProfiles = () => {
    fetchProfiles();
  };

  return {
    profiles,
    loading,
    error,
    refreshProfiles,
  };
};

// Hook specifically for getting public provider profiles (for parents)
export const usePublicProviderProfiles = (): UseProviderProfilesReturn => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch only public information for all providers using secure function
      const { data, error: fetchError } = await supabase.rpc('get_public_provider_info');

      if (fetchError) throw fetchError;

      setProfiles(data || []);
    } catch (err: any) {
      console.error("Error fetching public provider profiles:", err);
      setError(err.message || "Failed to fetch provider profiles");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicProfiles();
  }, []); // Remove user dependency for public data

  const refreshProfiles = () => {
    fetchPublicProfiles();
  };

  return {
    profiles,
    loading,
    error,
    refreshProfiles,
  };
};