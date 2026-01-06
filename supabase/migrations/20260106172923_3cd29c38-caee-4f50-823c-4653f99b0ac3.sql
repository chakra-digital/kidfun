-- ============================================
-- COORDINATION THREADS: Single Source of Truth
-- ============================================

-- Status enum for thread lifecycle
CREATE TYPE public.thread_status AS ENUM ('idea', 'proposing', 'scheduled', 'completed', 'cancelled');

-- RSVP status enum
CREATE TYPE public.rsvp_status AS ENUM ('pending', 'going', 'maybe', 'declined');

-- Participant role enum
CREATE TYPE public.participant_role AS ENUM ('organizer', 'invited');

-- Proposal status enum
CREATE TYPE public.proposal_status AS ENUM ('proposed', 'accepted', 'withdrawn');

-- Event type enum for feed
CREATE TYPE public.thread_event_type AS ENUM (
  'created', 'invited', 'proposed_time', 'accepted_time', 
  'rsvp', 'message', 'locked', 'cancelled', 'completed'
);

-- ============================================
-- 1. COORDINATION_THREADS (main entity)
-- ============================================
CREATE TABLE public.coordination_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  activity_name TEXT NOT NULL,
  provider_id UUID REFERENCES public.provider_profiles(id) ON DELETE SET NULL,
  provider_name TEXT,
  provider_url TEXT,
  status thread_status NOT NULL DEFAULT 'idea',
  scheduled_date TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coordination_threads ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX idx_coordination_threads_created_by ON public.coordination_threads(created_by);
CREATE INDEX idx_coordination_threads_status ON public.coordination_threads(status);

-- ============================================
-- 2. THREAD_PARTICIPANTS
-- ============================================
CREATE TABLE public.thread_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.coordination_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role participant_role NOT NULL DEFAULT 'invited',
  rsvp_status rsvp_status NOT NULL DEFAULT 'pending',
  children_bringing UUID[] DEFAULT '{}',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(thread_id, user_id)
);

-- Enable RLS
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_thread_participants_thread_id ON public.thread_participants(thread_id);
CREATE INDEX idx_thread_participants_user_id ON public.thread_participants(user_id);

-- ============================================
-- 3. THREAD_TIME_PROPOSALS
-- ============================================
CREATE TABLE public.thread_time_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.coordination_threads(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL,
  proposed_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status proposal_status NOT NULL DEFAULT 'proposed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.thread_time_proposals ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_thread_time_proposals_thread_id ON public.thread_time_proposals(thread_id);

-- ============================================
-- 4. THREAD_EVENTS (activity feed)
-- ============================================
CREATE TABLE public.thread_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.coordination_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type thread_event_type NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.thread_events ENABLE ROW LEVEL SECURITY;

-- Indexes for feed queries
CREATE INDEX idx_thread_events_thread_id ON public.thread_events(thread_id);
CREATE INDEX idx_thread_events_created_at ON public.thread_events(created_at DESC);
CREATE INDEX idx_thread_events_user_id ON public.thread_events(user_id);

-- ============================================
-- HELPER FUNCTION: Check if user is participant
-- ============================================
CREATE OR REPLACE FUNCTION public.is_thread_participant(thread_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.thread_participants
    WHERE thread_id = thread_uuid AND user_id = user_uuid
  )
  OR EXISTS (
    SELECT 1 FROM public.coordination_threads
    WHERE id = thread_uuid AND created_by = user_uuid
  );
$$;

-- ============================================
-- RLS POLICIES: coordination_threads
-- ============================================

-- SELECT: User is creator or participant
CREATE POLICY "Users can view threads they participate in"
ON public.coordination_threads FOR SELECT
USING (
  created_by = auth.uid() 
  OR is_thread_participant(id, auth.uid())
);

-- INSERT: Any authenticated user can create
CREATE POLICY "Authenticated users can create threads"
ON public.coordination_threads FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only creator can update
CREATE POLICY "Thread creator can update"
ON public.coordination_threads FOR UPDATE
USING (auth.uid() = created_by);

-- DELETE: Only creator can delete (soft delete preferred via status='cancelled')
CREATE POLICY "Thread creator can delete"
ON public.coordination_threads FOR DELETE
USING (auth.uid() = created_by);

-- ============================================
-- RLS POLICIES: thread_participants
-- ============================================

-- SELECT: Can view if you're a participant in the thread
CREATE POLICY "Participants can view thread members"
ON public.thread_participants FOR SELECT
USING (is_thread_participant(thread_id, auth.uid()));

-- INSERT: Creator can invite, or user accepts invite via message flow
CREATE POLICY "Thread creator can add participants"
ON public.thread_participants FOR INSERT
WITH CHECK (
  -- Creator can add anyone
  EXISTS (
    SELECT 1 FROM public.coordination_threads
    WHERE id = thread_id AND created_by = auth.uid()
  )
  -- Or user is adding themselves (accepting invite)
  OR user_id = auth.uid()
);

-- UPDATE: Users can update their own participation (RSVP, children)
CREATE POLICY "Users can update their own participation"
ON public.thread_participants FOR UPDATE
USING (user_id = auth.uid());

-- DELETE: Users can remove themselves, creator can remove others
CREATE POLICY "Users can leave threads"
ON public.thread_participants FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.coordination_threads
    WHERE id = thread_id AND created_by = auth.uid()
  )
);

-- ============================================
-- RLS POLICIES: thread_time_proposals
-- ============================================

-- SELECT: Participants can view proposals
CREATE POLICY "Participants can view time proposals"
ON public.thread_time_proposals FOR SELECT
USING (is_thread_participant(thread_id, auth.uid()));

-- INSERT: Participants can propose times
CREATE POLICY "Participants can propose times"
ON public.thread_time_proposals FOR INSERT
WITH CHECK (
  auth.uid() = proposed_by
  AND is_thread_participant(thread_id, auth.uid())
);

-- UPDATE: Proposer can withdraw, or any participant can accept
CREATE POLICY "Participants can update proposals"
ON public.thread_time_proposals FOR UPDATE
USING (is_thread_participant(thread_id, auth.uid()));

-- ============================================
-- RLS POLICIES: thread_events
-- ============================================

-- SELECT: Participants can view events
CREATE POLICY "Participants can view thread events"
ON public.thread_events FOR SELECT
USING (is_thread_participant(thread_id, auth.uid()));

-- INSERT: Participants can log events
CREATE POLICY "Participants can log events"
ON public.thread_events FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND is_thread_participant(thread_id, auth.uid())
);

-- No UPDATE or DELETE - events are immutable

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_coordination_threads_updated_at
  BEFORE UPDATE ON public.coordination_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- REALTIME: Enable for live updates
-- ============================================
ALTER TABLE public.coordination_threads REPLICA IDENTITY FULL;
ALTER TABLE public.thread_participants REPLICA IDENTITY FULL;
ALTER TABLE public.thread_time_proposals REPLICA IDENTITY FULL;
ALTER TABLE public.thread_events REPLICA IDENTITY FULL;