-- Drop the existing UPDATE policy that's too restrictive
DROP POLICY IF EXISTS "Parents can update their connection status" ON public.parent_connections;

-- Create a new UPDATE policy with proper USING and WITH CHECK expressions
-- USING: allows selecting rows where user is the recipient and status is pending
-- WITH CHECK: allows the new row to have status 'accepted' or 'declined'
CREATE POLICY "Parents can update their connection status" 
ON public.parent_connections 
FOR UPDATE 
USING (
  (auth.uid() = connected_parent_id) AND (status = 'pending'::text)
)
WITH CHECK (
  (auth.uid() = connected_parent_id) AND (status IN ('accepted', 'declined'))
);