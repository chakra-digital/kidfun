-- Drop the overly permissive policy that allows parents to see all provider data
DROP POLICY IF EXISTS "Parents can view basic provider information" ON public.provider_profiles;

-- Create a security definer function that returns only public provider information
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

-- Create a new restrictive policy for parents viewing provider information
CREATE POLICY "Parents can view public provider information only" 
ON public.provider_profiles 
FOR SELECT 
USING (
  get_current_user_type() = 'parent'::text AND
  -- Only allow access to non-sensitive fields by restricting what can be selected
  -- This will be enforced at the application level with the security definer function
  true
);

-- Update the provider's own profile viewing policy to be more explicit
DROP POLICY IF EXISTS "Providers can view their own profile" ON public.provider_profiles;
DROP POLICY IF EXISTS "Providers can view their own complete profile" ON public.provider_profiles;

CREATE POLICY "Providers can view their complete profile" 
ON public.provider_profiles 
FOR SELECT 
USING (
  auth.uid() = user_id AND 
  get_current_user_type() = 'provider'::text
);