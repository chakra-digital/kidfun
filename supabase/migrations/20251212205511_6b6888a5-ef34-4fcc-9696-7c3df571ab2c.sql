-- Drop the overly permissive discovery policy
DROP POLICY IF EXISTS "Parents can discover other parents by school and neighborhood" ON public.parent_profiles;

-- Create a security definer function that returns ONLY safe discovery fields
-- This excludes: emergency_contact_name, emergency_contact_phone, location, budget_min, budget_max
CREATE OR REPLACE FUNCTION public.get_parent_discovery_info(search_school text DEFAULT NULL, search_neighborhood text DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  school_name text,
  neighborhood text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pp.user_id,
    pp.school_name,
    pp.neighborhood
  FROM public.parent_profiles pp
  INNER JOIN public.profiles p ON p.user_id = pp.user_id
  WHERE p.user_type = 'parent'
    AND pp.user_id != auth.uid()  -- Exclude self from discovery
    AND (
      (search_school IS NOT NULL AND pp.school_name ILIKE '%' || search_school || '%')
      OR (search_neighborhood IS NOT NULL AND pp.neighborhood ILIKE '%' || search_neighborhood || '%')
    );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_parent_discovery_info(text, text) TO authenticated;