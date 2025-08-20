-- Restore pricing and capacity to public provider info for booking functionality
-- Parents need this information to make booking decisions
-- Keep only truly sensitive fields private: license_number, insurance_verified, background_check_verified

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
  -- Return provider information needed for parent booking decisions
  -- Excludes only truly sensitive fields: license_number, insurance_verified, background_check_verified
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

COMMENT ON FUNCTION public.get_public_provider_info() IS 
'Returns provider information needed for parent booking decisions. Excludes only truly sensitive regulatory fields.';