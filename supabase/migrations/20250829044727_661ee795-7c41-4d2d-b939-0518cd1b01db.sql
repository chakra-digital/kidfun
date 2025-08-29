-- Update the public provider info function to include unverified providers
CREATE OR REPLACE FUNCTION public.get_public_provider_info()
 RETURNS TABLE(id uuid, user_id uuid, business_name text, description text, location text, years_experience integer, capacity integer, base_price numeric, age_groups text[], specialties text[], amenities text[], pricing_model text, created_at timestamp with time zone, updated_at timestamp with time zone, google_rating numeric, google_reviews_count integer, external_website text, phone text, verification_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- SECURITY: Return all provider information that's safe for public viewing
  -- Includes both verified and unverified providers
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
    pp.updated_at,
    pp.google_rating,
    pp.google_reviews_count,
    pp.external_website,
    pp.phone,
    pp.verification_status
  FROM public.provider_profiles pp
  WHERE pp.verification_status IS NOT NULL;
$function$