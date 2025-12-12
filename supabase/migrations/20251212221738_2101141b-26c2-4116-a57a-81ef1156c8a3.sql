-- Create saved_activities table for personal bookmarks/saves
CREATE TABLE public.saved_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_id uuid REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  activity_name text,
  status text NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'interested', 'booked', 'completed')),
  scheduled_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_activities ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved activities
CREATE POLICY "Users can view own saved activities"
ON public.saved_activities
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own saved activities
CREATE POLICY "Users can insert own saved activities"
ON public.saved_activities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved activities
CREATE POLICY "Users can update own saved activities"
ON public.saved_activities
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own saved activities
CREATE POLICY "Users can delete own saved activities"
ON public.saved_activities
FOR DELETE
USING (auth.uid() = user_id);

-- Connected parents can view each other's saved activities (for social discovery)
CREATE POLICY "Connected parents can view saved activities"
ON public.saved_activities
FOR SELECT
USING (
  auth.uid() != user_id 
  AND public.are_parents_connected(auth.uid(), user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_saved_activities_user_id ON public.saved_activities(user_id);
CREATE INDEX idx_saved_activities_provider_id ON public.saved_activities(provider_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_activities_updated_at
BEFORE UPDATE ON public.saved_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();