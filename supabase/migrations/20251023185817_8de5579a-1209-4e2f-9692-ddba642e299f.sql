-- Create search cache table to store AI search results
CREATE TABLE IF NOT EXISTS public.search_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_hash TEXT NOT NULL UNIQUE,
  original_query TEXT NOT NULL,
  location TEXT NOT NULL,
  results JSONB NOT NULL,
  search_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Enable RLS
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached searches (public data)
CREATE POLICY "Anyone can read search cache"
  ON public.search_cache
  FOR SELECT
  USING (expires_at > now());

-- Only authenticated users can insert cache entries
CREATE POLICY "Service role can manage cache"
  ON public.search_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_search_cache_query_hash ON public.search_cache(query_hash);
CREATE INDEX idx_search_cache_expires_at ON public.search_cache(expires_at);

-- Function to clean expired cache entries (can be called via cron)
CREATE OR REPLACE FUNCTION public.clean_expired_search_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.search_cache WHERE expires_at < now();
$$;