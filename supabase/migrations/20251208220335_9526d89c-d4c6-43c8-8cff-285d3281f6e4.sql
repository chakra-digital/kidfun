-- Add school_place_id column to parent_profiles for standardized school matching
ALTER TABLE public.parent_profiles 
ADD COLUMN IF NOT EXISTS school_place_id text;

-- Create index for faster school matching
CREATE INDEX IF NOT EXISTS idx_parent_profiles_school_place_id ON public.parent_profiles(school_place_id);