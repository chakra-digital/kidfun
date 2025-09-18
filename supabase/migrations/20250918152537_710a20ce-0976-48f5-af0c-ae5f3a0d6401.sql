-- Add latitude and longitude columns to provider_profiles table for geocoding
ALTER TABLE public.provider_profiles 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add index for geospatial queries
CREATE INDEX idx_provider_profiles_coordinates ON public.provider_profiles(latitude, longitude);