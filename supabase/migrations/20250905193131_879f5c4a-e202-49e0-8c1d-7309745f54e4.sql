-- Fix security issue: Remove public access to provider_profiles table
-- This prevents direct access to sensitive provider information

-- Drop the existing problematic SELECT policy that allows public access
DROP POLICY IF EXISTS "Providers can view their complete profile" ON public.provider_profiles;

-- Create secure SELECT policies
-- 1. Providers can view their own complete profile (including sensitive data)
CREATE POLICY "Providers can view their own complete profile" 
ON public.provider_profiles 
FOR SELECT 
USING (auth.uid() = user_id AND get_current_user_type() = 'provider'::text);

-- 2. Authenticated parents can view basic provider info via RPC function only
-- This ensures they only get public information through the secure function
CREATE POLICY "No direct table access for non-owners" 
ON public.provider_profiles 
FOR SELECT 
USING (false); -- This will be overridden by the provider policy above

-- Update the policy to allow providers to view their own data
DROP POLICY IF EXISTS "No direct table access for non-owners" ON public.provider_profiles;

CREATE POLICY "Only providers can view their own profiles" 
ON public.provider_profiles 
FOR SELECT 
USING (auth.uid() = user_id AND get_current_user_type() = 'provider'::text);

-- Ensure the public function remains available for safe public access
-- (The function already exists and only returns non-sensitive public information)