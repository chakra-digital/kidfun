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
  background_check_verified: boolean | null;
  insurance_verified: boolean | null;
  created_at: string;
  updated_at: string;
  // Sensitive fields only available to the provider themselves
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
        // Parents can only see public, non-sensitive information
        const result = await supabase
          .from("provider_profiles")
          .select(`
            id,
            user_id,
            business_name,
            location,
            description,
            age_groups,
            specialties,
            amenities,
            base_price,
            pricing_model,
            years_experience,
            capacity,
            background_check_verified,
            insurance_verified,
            created_at,
            updated_at
          `);
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
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch only public information for all providers
      const { data, error: fetchError } = await supabase
        .from("provider_profiles")
        .select(`
          id,
          user_id,
          business_name,
          location,
          description,
          age_groups,
          specialties,
          amenities,
          base_price,
          pricing_model,
          years_experience,
          capacity,
          background_check_verified,
          insurance_verified,
          created_at,
          updated_at
        `);

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
  }, [user]);

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