-- Add image_url field to provider_profiles to store generated preview images
ALTER TABLE provider_profiles 
ADD COLUMN image_url text;

-- Add comment explaining the field
COMMENT ON COLUMN provider_profiles.image_url IS 'AI-generated preview image URL or data URI for provider card display';