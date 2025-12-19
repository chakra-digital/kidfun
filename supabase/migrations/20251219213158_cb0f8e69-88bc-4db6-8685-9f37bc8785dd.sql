-- Create a security definer function to check for pending connection requests
CREATE OR REPLACE FUNCTION public.has_pending_connection_request(viewer_id uuid, profile_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_connections
    WHERE status = 'pending'
    AND (
      -- Viewer received a request from profile owner
      (connected_parent_id = viewer_id AND parent_id = profile_owner_id)
      -- OR viewer sent a request to profile owner
      OR (parent_id = viewer_id AND connected_parent_id = profile_owner_id)
    )
  )
$$;

-- Drop the existing policy that only allows connected parents
DROP POLICY IF EXISTS "Parents can view connected parents profile info" ON public.profiles;

-- Create updated policy that allows viewing connected OR pending connection profiles
CREATE POLICY "Parents can view connected or pending connection profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR (
    user_type = 'parent'::user_type 
    AND (
      are_parents_connected(auth.uid(), user_id)
      OR has_pending_connection_request(auth.uid(), user_id)
    )
  )
);