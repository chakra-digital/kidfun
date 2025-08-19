-- Fix the search path security warning by setting it explicitly
CREATE OR REPLACE FUNCTION public.get_public_provider_info()
RETURNS TABLE (
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
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
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