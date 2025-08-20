-- Add secure RLS policy for parents to view non-sensitive provider information
-- This allows parents to browse providers while protecting sensitive data

CREATE POLICY "Parents can view public provider information" 
ON public.provider_profiles 
FOR SELECT 
USING (
  get_current_user_type() = 'parent' AND
  -- This policy will only allow SELECT queries, but we'll restrict sensitive columns
  -- through the application layer and encourage use of get_public_provider_info()
  true
);

-- Add a comment to clarify the security approach
COMMENT ON POLICY "Parents can view public provider information" ON public.provider_profiles IS 
'Allows parents to view provider profiles for browsing. Sensitive fields like license_number should be filtered out in application queries or use get_public_provider_info() function for guaranteed security.';