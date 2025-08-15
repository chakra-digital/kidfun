-- Fix security issue: Restrict provider profile access to authenticated users only
-- Remove the overly permissive public access policy
DROP POLICY IF EXISTS "Anyone can view verified provider profiles" ON public.provider_profiles;

-- Create a more secure policy that requires authentication
-- This allows authenticated users (parents looking for childcare) to view provider profiles
-- but prevents completely public access that could be exploited by competitors or bad actors
CREATE POLICY "Authenticated users can view provider profiles" 
ON public.provider_profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Keep the existing policies for providers to manage their own profiles
-- (These are already properly restricted to the profile owner)