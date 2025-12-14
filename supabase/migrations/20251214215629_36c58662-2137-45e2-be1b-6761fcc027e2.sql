-- Create table for coordination messages between parents about activities
CREATE TABLE public.activity_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES public.saved_activities(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'general' CHECK (message_type IN ('join_request', 'invite', 'general', 'accepted', 'declined')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see messages they sent or received, and only if connected
CREATE POLICY "Users can view their own messages"
  ON public.activity_messages
  FOR SELECT
  USING (
    (auth.uid() = sender_id OR auth.uid() = recipient_id)
    AND are_parents_connected(sender_id, recipient_id)
  );

CREATE POLICY "Users can send messages to connections"
  ON public.activity_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND are_parents_connected(sender_id, recipient_id)
  );

CREATE POLICY "Users can update messages they received"
  ON public.activity_messages
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Add scheduled_date index to saved_activities for calendar queries
CREATE INDEX IF NOT EXISTS idx_saved_activities_scheduled_date 
  ON public.saved_activities(scheduled_date) 
  WHERE scheduled_date IS NOT NULL;

-- Enable realtime for activity_messages
ALTER TABLE public.activity_messages REPLICA IDENTITY FULL;