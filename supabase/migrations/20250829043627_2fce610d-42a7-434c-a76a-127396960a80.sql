-- Add verification status and Google Places integration fields to provider_profiles
ALTER TABLE public.provider_profiles 
ADD COLUMN verification_status text DEFAULT 'verified' CHECK (verification_status IN ('verified', 'unverified', 'pending')),
ADD COLUMN google_place_id text UNIQUE,
ADD COLUMN external_website text,
ADD COLUMN google_rating numeric,
ADD COLUMN google_reviews_count integer,
ADD COLUMN phone text;