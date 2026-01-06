-- Fix: Allow thread participants to update thread status (for accepting proposals)
-- Drop the existing update policy
DROP POLICY IF EXISTS "Thread creator can update" ON coordination_threads;

-- Create new policy: thread creator OR participants can update
CREATE POLICY "Thread participants can update"
ON coordination_threads
FOR UPDATE
USING (
  auth.uid() = created_by 
  OR is_thread_participant(id, auth.uid())
);