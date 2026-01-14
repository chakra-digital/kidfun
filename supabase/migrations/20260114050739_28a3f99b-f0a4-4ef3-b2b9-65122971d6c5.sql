-- Create helper function to escape ILIKE wildcards
CREATE OR REPLACE FUNCTION public.escape_ilike_pattern(pattern text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT replace(replace(replace(pattern, '\', '\\'), '%', '\%'), '_', '\_');
$$;

-- Update parent discovery function to escape wildcards
CREATE OR REPLACE FUNCTION public.get_parent_discovery_info(search_school text DEFAULT NULL::text, search_neighborhood text DEFAULT NULL::text)
 RETURNS TABLE(user_id uuid, school_name text, neighborhood text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
      (search_school IS NOT NULL AND pp.school_name ILIKE '%' || escape_ilike_pattern(search_school) || '%')
      OR (search_neighborhood IS NOT NULL AND pp.neighborhood ILIKE '%' || escape_ilike_pattern(search_neighborhood) || '%')
    );
$$;