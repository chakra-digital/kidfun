-- Make user_id nullable for provider_profiles to allow unverified providers
ALTER TABLE public.provider_profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy to allow viewing unverified providers (with NULL user_id)
DROP POLICY IF EXISTS "Providers can view their complete profile" ON public.provider_profiles;

CREATE POLICY "Providers can view their complete profile" 
ON public.provider_profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id AND get_current_user_type() = 'provider'::text) OR
  (user_id IS NULL AND verification_status = 'unverified')
);