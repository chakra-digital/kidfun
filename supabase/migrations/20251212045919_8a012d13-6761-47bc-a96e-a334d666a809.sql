-- Create a security definer function to check if users are connected
CREATE OR REPLACE FUNCTION public.are_parents_connected(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_connections
    WHERE status = 'accepted'
    AND (
      (parent_id = user_a AND connected_parent_id = user_b)
      OR (parent_id = user_b AND connected_parent_id = user_a)
    )
  )
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Parents can view other parents basic profile info" ON public.profiles;

-- Create a new restrictive policy - only view connected parents' profiles
CREATE POLICY "Parents can view connected parents profile info" 
ON public.profiles 
FOR SELECT 
USING (
  -- User can always view their own profile
  (auth.uid() = user_id)
  OR 
  -- User can view profiles of parents they're connected with
  (user_type = 'parent'::user_type AND public.are_parents_connected(auth.uid(), user_id))
);