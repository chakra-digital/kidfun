-- Fix: activity_shares SELECT policy was referencing group_memberships, which currently triggers
-- "infinite recursion detected in policy for relation group_memberships" and breaks
-- dashboard shared calendar + RSVP tracking.

ALTER TABLE public.activity_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view shares directed to them" ON public.activity_shares;

CREATE POLICY "Parents can view shares directed to them"
ON public.activity_shares
FOR SELECT
TO public
USING (
  auth.uid() = shared_by
  OR auth.uid() = shared_with
);
