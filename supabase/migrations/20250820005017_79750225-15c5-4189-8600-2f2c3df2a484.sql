-- Add SELECT policy for parents to view basic provider information
-- This allows parents to see provider listings while protecting sensitive data

CREATE POLICY "Parents can view basic provider information" 
ON public.provider_profiles 
FOR SELECT 
USING (get_current_user_type() = 'parent');

-- Add comment explaining the policy
COMMENT ON POLICY "Parents can view basic provider information" ON public.provider_profiles IS 
'Allows parents to view provider profiles for childcare discovery. Sensitive fields like license_number should be handled at application level.';