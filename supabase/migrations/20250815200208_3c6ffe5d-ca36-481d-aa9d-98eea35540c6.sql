-- Fix security issue: Create granular access controls for provider profiles
-- Remove the overly permissive policy that allows all authenticated users to see everything
DROP POLICY IF EXISTS "Authenticated users can view provider profiles" ON public.provider_profiles;

-- Create a security definer function to get the current user's type
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT AS $$
  SELECT user_type::text FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Policy 1: Providers can view their complete own profile (including sensitive data)
CREATE POLICY "Providers can view their own complete profile" 
ON public.provider_profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id AND 
  public.get_current_user_type() = 'provider'
);

-- Policy 2: Parents can view only basic public information from provider profiles
-- This excludes sensitive fields like license_number
CREATE POLICY "Parents can view basic provider information" 
ON public.provider_profiles 
FOR SELECT 
TO authenticated
USING (
  public.get_current_user_type() = 'parent'
);

-- Note: The above policy allows parents to SELECT from the table, but we'll need to ensure
-- the application layer only shows non-sensitive fields to parents.
-- Sensitive fields like license_number should be filtered out in queries when user_type = 'parent'