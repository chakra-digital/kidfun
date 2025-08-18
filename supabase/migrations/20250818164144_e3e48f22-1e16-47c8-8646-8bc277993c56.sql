-- Drop existing policies for children table
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;
DROP POLICY IF EXISTS "Parents can insert their own children" ON public.children;
DROP POLICY IF EXISTS "Parents can update their own children" ON public.children;
DROP POLICY IF EXISTS "Parents can delete their own children" ON public.children;

-- Create more secure policies that verify both parent ownership AND user type
CREATE POLICY "Only verified parents can view their own children"
ON public.children
FOR SELECT
USING (
  auth.uid() = parent_id 
  AND get_current_user_type() = 'parent'
);

CREATE POLICY "Only verified parents can insert their own children"
ON public.children
FOR INSERT
WITH CHECK (
  auth.uid() = parent_id 
  AND get_current_user_type() = 'parent'
);

CREATE POLICY "Only verified parents can update their own children"
ON public.children
FOR UPDATE
USING (
  auth.uid() = parent_id 
  AND get_current_user_type() = 'parent'
);

CREATE POLICY "Only verified parents can delete their own children"
ON public.children
FOR DELETE
USING (
  auth.uid() = parent_id 
  AND get_current_user_type() = 'parent'
);