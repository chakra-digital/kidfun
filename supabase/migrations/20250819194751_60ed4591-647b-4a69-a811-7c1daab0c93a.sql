-- Fix security vulnerability: Remove direct table access for parents
-- and ensure they can only access public provider info through secure function

-- Drop the overly permissive RLS policy that allows parents to see all columns
DROP POLICY IF EXISTS "Parents can view public provider information only" ON public.provider_profiles;

-- Create a more restrictive policy that prevents direct table access by parents
-- Parents should only access provider data through the get_public_provider_info() function
CREATE POLICY "Providers can view their complete profile" ON public.provider_profiles
FOR SELECT USING ((auth.uid() = user_id) AND (get_current_user_type() = 'provider'::text));

-- Ensure the get_public_provider_info function is the only way parents can access provider data
-- Update function to be more explicit about security
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
SET search_path TO 'public'
AS $$
  -- Only return non-sensitive public information
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
  FROM public.provider_profiles pp
  WHERE get_current_user_type() = 'parent'::text;
$$;