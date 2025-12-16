-- Store outbound provider link (website) for saved activities
ALTER TABLE public.saved_activities
ADD COLUMN IF NOT EXISTS provider_url text;