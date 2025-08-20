-- Fix security vulnerability: Remove policy that exposes sensitive business data to competitors
-- Competitors posing as parents could steal pricing, capacity, and other confidential business information

-- Drop the overly permissive policy that allows parents to see all provider data
DROP POLICY IF EXISTS "Parents can view public provider information" ON public.provider_profiles;

-- Update the get_public_provider_info() function to exclude sensitive business data
-- Remove: base_price, pricing_model, capacity (sensitive business information)
-- Keep: business_name, description, location, years_experience, age_groups, specialties, amenities
CREATE OR REPLACE FUNCTION public.get_public_provider_info()
RETURNS TABLE(
  id uuid,
  user_id uuid, 
  business_name text,
  description text,
  location text,
  years_experience integer,
  age_groups text[],
  specialties text[],
  amenities text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Only return basic provider information for public browsing
  -- Excludes sensitive business data: license_number, insurance_verified, background_check_verified,
  -- base_price, pricing_model, capacity (to prevent competitor data theft)
  SELECT 
    pp.id,
    pp.user_id,
    pp.business_name,
    pp.description,
    pp.location,
    pp.years_experience,
    pp.age_groups,
    pp.specialties,
    pp.amenities,
    pp.created_at,
    pp.updated_at
  FROM public.provider_profiles pp;
$$;

-- Add comment explaining the security approach
COMMENT ON FUNCTION public.get_public_provider_info() IS 
'Returns only non-sensitive provider information for public browsing. Excludes pricing, capacity, and other confidential business data to prevent competitor theft.';