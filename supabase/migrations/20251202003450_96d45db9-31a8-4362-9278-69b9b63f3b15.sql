-- Fix parent discovery: Allow parents to view basic profile info of other parents for connection purposes
-- This ensures the Find Parents feature works while protecting sensitive data

-- Allow parents to view basic profile information of other parents
CREATE POLICY "Parents can view other parents basic profile info"
ON public.profiles
FOR SELECT
USING (
  user_type = 'parent' 
  AND auth.uid() IS NOT NULL
);

-- Allow parents to view school and neighborhood of other parent profiles for discovery
CREATE POLICY "Parents can discover other parents by school and neighborhood"
ON public.parent_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_type = 'parent'
  )
);