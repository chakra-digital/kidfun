-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Service role can manage cache" ON public.search_cache;

-- Create restrictive policy - only service role can access
CREATE POLICY "Only service role can manage cache" 
ON public.search_cache 
FOR ALL 
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');