-- Fix security issue: Restrict search_cache access to service role only
-- Remove the public SELECT policy that exposes user search history

DROP POLICY IF EXISTS "Anyone can read search cache" ON public.search_cache;

-- The "Service role can manage cache" policy already exists and handles all operations
-- Edge functions with service role can still read/write to cache for performance optimization
-- Regular users cannot query the cache table directly, protecting their search history

-- Add a comment to document the security model
COMMENT ON TABLE public.search_cache IS 'Search result cache - only accessible by edge functions with service role. Stores AI search results to optimize performance without exposing user search history to public queries.';