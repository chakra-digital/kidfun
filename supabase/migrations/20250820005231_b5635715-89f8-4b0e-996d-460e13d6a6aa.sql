-- Fix security vulnerability: Remove direct table access for parents
-- Parents should only access provider data through the secure get_public_provider_info() function

-- Drop the overly permissive policy that allows direct table access
DROP POLICY IF EXISTS "Parents can view basic provider information" ON public.provider_profiles;

-- Ensure the secure function exists with proper field restrictions
DROP FUNCTION IF EXISTS public.get_public_provider_info();

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
  -- SECURITY: Only return non-sensitive provider information for discovery
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

-- Add security comment
COMMENT ON FUNCTION public.get_public_provider_info() IS 
'SECURITY FUNCTION: Returns only non-sensitive provider information for parent discovery. Sensitive fields (license_number, insurance_verified, background_check_verified) are excluded to prevent data theft.';

-- Grant execute permission to authenticated users (parents and providers)
GRANT EXECUTE ON FUNCTION public.get_public_provider_info() TO authenticated;