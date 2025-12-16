-- Create referral invites table to track sent invites
CREATE TABLE public.referral_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id uuid, -- NULL if not logged in
  inviter_email text, -- For non-logged-in inviters
  invitee_email text NOT NULL,
  referral_code text, -- The code used (links to parent_profiles.referral_code)
  status text NOT NULL DEFAULT 'sent',
  invite_type text NOT NULL DEFAULT 'app_invite', -- 'app_invite', 'notify_me', 'activity_share'
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz, -- When invitee signed up
  converted_user_id uuid, -- The new user's ID
  points_awarded boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.referral_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for non-logged-in users sending notify requests)
CREATE POLICY "Anyone can create invites"
ON public.referral_invites FOR INSERT
WITH CHECK (true);

-- Users can view invites they sent
CREATE POLICY "Users can view their sent invites"
ON public.referral_invites FOR SELECT
USING (inviter_user_id = auth.uid() OR inviter_email IS NOT NULL);

-- Service role can update (for tracking conversions)
CREATE POLICY "Service role can update invites"
ON public.referral_invites FOR UPDATE
USING (true);

-- Create index for fast lookups
CREATE INDEX idx_referral_invites_email ON public.referral_invites(invitee_email);
CREATE INDEX idx_referral_invites_code ON public.referral_invites(referral_code);
CREATE INDEX idx_referral_invites_inviter ON public.referral_invites(inviter_user_id);