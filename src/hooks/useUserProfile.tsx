import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  user_type: "parent" | "provider";
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface ParentProfile {
  id: string;
  user_id: string;
  location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_radius: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

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
  license_number: string | null;
  background_check_verified: boolean | null;
  insurance_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

interface UseUserProfileReturn {
  userProfile: UserProfile | null;
  parentProfile: ParentProfile | null;
  providerProfile: ProviderProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => void;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setParentProfile(null);
      setProviderProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch basic user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      setUserProfile(profile);

      // Fetch type-specific profile based on user type
      if (profile.user_type === "parent") {
        const { data: parentData, error: parentError } = await supabase
          .from("parent_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (parentError && parentError.code !== 'PGRST116') {
          // PGRST116 is "not found" - acceptable for new users
          throw parentError;
        }

        setParentProfile(parentData);
        setProviderProfile(null);
      } else if (profile.user_type === "provider") {
        const { data: providerData, error: providerError } = await supabase
          .from("provider_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (providerError && providerError.code !== 'PGRST116') {
          // PGRST116 is "not found" - acceptable for new users
          throw providerError;
        }

        setProviderProfile(providerData);
        setParentProfile(null);
      }
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      setError(err.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const refreshProfile = () => {
    fetchProfile();
  };

  return {
    userProfile,
    parentProfile,
    providerProfile,
    loading,
    error,
    refreshProfile,
  };
};