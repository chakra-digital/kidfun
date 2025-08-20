-- Fix security vulnerability: Remove overly permissive RLS policy that allows parents to view sensitive provider data
-- Parents should only access provider data through the get_public_provider_info() function

-- Drop the problematic policy that allows parents to see all provider data
DROP POLICY IF EXISTS "Parents can view public provider information only" ON public.provider_profiles;

-- The remaining policies are secure:
-- 1. "Providers can view their complete profile" - allows providers to see their own data
-- 2. "Providers can insert their own profile" - allows providers to create their profile  
-- 3. "Providers can update their own profile" - allows providers to update their profile

-- Verify that the get_public_provider_info() function exists and returns only safe fields
-- This function is the ONLY way parents should access provider information
CREATE OR REPLACE FUNCTION public.get_public_provider_info()
RETURNS TABLE(
  id uuid,
  user_id uuid, 
  business_name text,
  description text,
  location text,
  years_experience integer,
  capacity integer,
  base_price numeric,
  age_groups text[],
  specialties text[],
  amenities text[],
  pricing_model text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Only return non-sensitive provider information
  -- Explicitly excludes: license_number, insurance_verified, background_check_verified
  SELECT 
    pp.id,
    pp.user_id,
    pp.business_name,
    pp.description,
    pp.location,
    pp.years_experience,
    pp.capacity,
    pp.base_price,
    pp.age_groups,
    pp.specialties,
    pp.amenities,
    pp.pricing_model,
    pp.created_at,
    pp.updated_at
  FROM public.provider_profiles pp;
$$;