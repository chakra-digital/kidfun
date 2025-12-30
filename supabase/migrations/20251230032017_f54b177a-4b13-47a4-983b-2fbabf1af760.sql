-- Create activity_rsvps table for tracking responses to shared activities
CREATE TABLE public.activity_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_share_id UUID NOT NULL REFERENCES public.activity_shares(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'declined')),
  children_bringing UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_share_id, user_id)
);

-- Enable RLS
ALTER TABLE public.activity_rsvps ENABLE ROW LEVEL SECURITY;

-- Users can view RSVPs for activities they created or were invited to
CREATE POLICY "Users can view RSVPs for their activities"
ON public.activity_rsvps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.activity_shares
    WHERE activity_shares.id = activity_rsvps.activity_share_id
    AND (activity_shares.shared_by = auth.uid() OR activity_shares.shared_with = auth.uid())
  )
);

-- Users can insert their own RSVP for activities shared with them
CREATE POLICY "Users can RSVP to activities shared with them"
ON public.activity_rsvps
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.activity_shares
    WHERE activity_shares.id = activity_rsvps.activity_share_id
    AND activity_shares.shared_with = auth.uid()
  )
);

-- Users can update their own RSVP
CREATE POLICY "Users can update their own RSVP"
ON public.activity_rsvps
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own RSVP
CREATE POLICY "Users can delete their own RSVP"
ON public.activity_rsvps
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_activity_rsvps_updated_at
BEFORE UPDATE ON public.activity_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to get RSVP summary for an activity share
CREATE OR REPLACE FUNCTION public.get_activity_rsvp_summary(share_id uuid)
RETURNS TABLE(
  going_count integer,
  maybe_count integer,
  declined_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'going' THEN 1 ELSE 0 END), 0)::integer as going_count,
    COALESCE(SUM(CASE WHEN status = 'maybe' THEN 1 ELSE 0 END), 0)::integer as maybe_count,
    COALESCE(SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END), 0)::integer as declined_count
  FROM public.activity_rsvps
  WHERE activity_share_id = share_id;
$$;