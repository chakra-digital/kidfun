-- Fix the overly permissive SELECT policy on referral_invites
-- The current policy allows anyone to view all invites where inviter_email is not null

DROP POLICY IF EXISTS "Users can view their sent invites" ON public.referral_invites;

-- Create a properly restrictive policy
-- Users can only see invites they sent OR invites where they are the converted user
CREATE POLICY "Users can view their own invites" 
ON public.referral_invites 
FOR SELECT 
USING (
  auth.uid() = inviter_user_id 
  OR auth.uid() = converted_user_id
);