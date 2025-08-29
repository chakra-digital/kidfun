-- Create a system user profile for unverified providers
INSERT INTO public.profiles (
  user_id, 
  first_name, 
  last_name, 
  email, 
  user_type
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'System',
  'User', 
  'system@kidfun.app',
  'provider'
) ON CONFLICT (user_id) DO NOTHING;

-- Make user_id nullable for provider_profiles to allow unverified providers
ALTER TABLE public.provider_profiles 
ALTER COLUMN user_id DROP NOT NULL;