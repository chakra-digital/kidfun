import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Types matching database enums
export type ThreadStatus = 'idea' | 'proposing' | 'scheduled' | 'completed' | 'cancelled';
export type RsvpStatus = 'pending' | 'going' | 'maybe' | 'declined';
export type ParticipantRole = 'organizer' | 'invited';
export type ProposalStatus = 'proposed' | 'accepted' | 'withdrawn';
export type ThreadEventType = 'created' | 'invited' | 'proposed_time' | 'accepted_time' | 'rsvp' | 'message' | 'locked' | 'cancelled' | 'completed';

export interface CoordinationThread {
  id: string;
  created_by: string;
  activity_name: string;
  provider_id?: string;
  provider_name?: string;
  provider_url?: string;
  status: ThreadStatus;
  scheduled_date?: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ThreadParticipant {
  id: string;
  thread_id: string;
  user_id: string;
  role: ParticipantRole;
  rsvp_status: RsvpStatus;
  children_bringing: string[];
  invited_at: string;
  responded_at?: string;
  // Joined profile data
  profile?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

export interface ThreadTimeProposal {
  id: string;
  thread_id: string;
  proposed_by: string;
  proposed_date: string;
  notes?: string;
  status: ProposalStatus;
  created_at: string;
  // Joined profile data
  proposer_name?: string;
}

export interface ThreadEvent {
  id: string;
  thread_id: string;
  user_id: string;
  event_type: ThreadEventType;
  payload: Record<string, unknown> | null;
  created_at: string;
  // Joined profile data
  user_name?: string;
}

export interface ThreadWithDetails extends CoordinationThread {
  participants: ThreadParticipant[];
  proposals: ThreadTimeProposal[];
  events: ThreadEvent[];
  organizer_name?: string;
}

export function useCoordinationThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all threads user participates in
  const fetchThreads = useCallback(async () => {
    if (!user) {
      setThreads([]);
      setLoading(false);
      return;
    }

    try {
      // Get threads where user is creator or participant
      const { data: threadData, error: threadError } = await supabase
        .from('coordination_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (threadError) throw threadError;

      if (!threadData || threadData.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }

      // Get participants for all threads
      const threadIds = threadData.map(t => t.id);
      const { data: participants } = await supabase
        .from('thread_participants')
        .select('*')
        .in('thread_id', threadIds);

      // Get proposals for all threads
      const { data: proposals } = await supabase
        .from('thread_time_proposals')
        .select('*')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false });

      // Get recent events for feed
      const { data: events } = await supabase
        .from('thread_events')
        .select('*')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get profile info for all involved users
      const userIds = new Set<string>();
      threadData.forEach(t => userIds.add(t.created_by));
      participants?.forEach(p => userIds.add(p.user_id));
      proposals?.forEach(p => userIds.add(p.proposed_by));
      events?.forEach(e => userIds.add(e.user_id));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      // Combine all data
      const threadsWithDetails: ThreadWithDetails[] = threadData.map(thread => {
        const threadParticipants = (participants ?? [])
          .filter(p => p.thread_id === thread.id)
          .map(p => ({
            ...p,
            profile: profileMap.get(p.user_id)
          }));

        const threadProposals = (proposals ?? [])
          .filter(p => p.thread_id === thread.id)
          .map(p => ({
            ...p,
            proposer_name: profileMap.get(p.proposed_by)?.first_name ?? 'Someone'
          }));

        const threadEvents: ThreadEvent[] = (events ?? [])
          .filter(e => e.thread_id === thread.id)
          .map(e => ({
            ...e,
            payload: (e.payload as Record<string, unknown>) ?? {},
            user_name: profileMap.get(e.user_id)?.first_name ?? 'Someone'
          }));

        const organizerProfile = profileMap.get(thread.created_by);

        return {
          ...thread,
          participants: threadParticipants,
          proposals: threadProposals,
          events: threadEvents,
          organizer_name: organizerProfile?.first_name ?? 'Someone'
        };
      });

      setThreads(threadsWithDetails);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load coordination threads');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new thread and invite participants
  const createThread = async (
    activityName: string,
    inviteUserIds: string[],
    options?: {
      providerId?: string;
      providerName?: string;
      providerUrl?: string;
      location?: string;
      notes?: string;
      proposedDate?: Date;
    }
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Create the thread
      const { data: thread, error: threadError } = await supabase
        .from('coordination_threads')
        .insert({
          created_by: user.id,
          activity_name: activityName,
          provider_id: options?.providerId,
          provider_name: options?.providerName,
          provider_url: options?.providerUrl,
          location: options?.location,
          notes: options?.notes,
          status: options?.proposedDate ? 'proposing' : 'idea'
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add creator as organizer participant
      await supabase.from('thread_participants').insert({
        thread_id: thread.id,
        user_id: user.id,
        role: 'organizer',
        rsvp_status: 'going'
      });

      // Add invited participants
      if (inviteUserIds.length > 0) {
        await supabase.from('thread_participants').insert(
          inviteUserIds.map(uid => ({
            thread_id: thread.id,
            user_id: uid,
            role: 'invited' as const
          }))
        );
      }

      // Log creation event
      await supabase.from('thread_events').insert({
        thread_id: thread.id,
        user_id: user.id,
        event_type: 'created',
        payload: { activity_name: activityName, invited_count: inviteUserIds.length }
      });

      // Log invite events
      for (const uid of inviteUserIds) {
        await supabase.from('thread_events').insert({
          thread_id: thread.id,
          user_id: user.id,
          event_type: 'invited',
          payload: { invited_user_id: uid }
        });
      }

      // If there's a proposed date, add it
      if (options?.proposedDate) {
        await proposeTime(thread.id, options.proposedDate);
      }

      toast.success('Plan created!');
      await fetchThreads();
      return thread.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create plan');
      return null;
    }
  };

  // Propose a time for the thread
  const proposeTime = async (
    threadId: string,
    proposedDate: Date,
    notes?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: proposalError } = await supabase
        .from('thread_time_proposals')
        .insert({
          thread_id: threadId,
          proposed_by: user.id,
          proposed_date: proposedDate.toISOString(),
          notes
        });

      if (proposalError) throw proposalError;

      // Update thread status to proposing
      await supabase
        .from('coordination_threads')
        .update({ status: 'proposing' })
        .eq('id', threadId);

      // Log event
      await supabase.from('thread_events').insert({
        thread_id: threadId,
        user_id: user.id,
        event_type: 'proposed_time',
        payload: { proposed_date: proposedDate.toISOString(), notes }
      });

      toast.success('Time proposed!');
      await fetchThreads();
      return true;
    } catch (error) {
      console.error('Error proposing time:', error);
      toast.error('Failed to propose time');
      return false;
    }
  };

  // Accept a proposed time (locks the thread)
  const acceptProposal = async (proposalId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get the proposal
      const { data: proposal, error: fetchError } = await supabase
        .from('thread_time_proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (fetchError) throw fetchError;

      // Mark proposal as accepted
      await supabase
        .from('thread_time_proposals')
        .update({ status: 'accepted' })
        .eq('id', proposalId);

      // Withdraw other proposals for this thread
      await supabase
        .from('thread_time_proposals')
        .update({ status: 'withdrawn' })
        .eq('thread_id', proposal.thread_id)
        .neq('id', proposalId)
        .eq('status', 'proposed');

      // Lock the thread with scheduled date
      await supabase
        .from('coordination_threads')
        .update({
          status: 'scheduled',
          scheduled_date: proposal.proposed_date
        })
        .eq('id', proposal.thread_id);

      // Log event
      await supabase.from('thread_events').insert({
        thread_id: proposal.thread_id,
        user_id: user.id,
        event_type: 'locked',
        payload: { scheduled_date: proposal.proposed_date, accepted_proposal_id: proposalId }
      });

      toast.success('Date confirmed!');
      await fetchThreads();
      return true;
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Failed to confirm date');
      return false;
    }
  };

  // Update RSVP status
  const updateRsvp = async (
    threadId: string,
    status: RsvpStatus,
    childrenBringing?: string[]
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('thread_participants')
        .update({
          rsvp_status: status,
          children_bringing: childrenBringing ?? [],
          responded_at: new Date().toISOString()
        })
        .eq('thread_id', threadId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Log event
      await supabase.from('thread_events').insert({
        thread_id: threadId,
        user_id: user.id,
        event_type: 'rsvp',
        payload: { status, children_count: childrenBringing?.length ?? 0 }
      });

      toast.success(`RSVP updated: ${status}`);
      await fetchThreads();
      return true;
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP');
      return false;
    }
  };

  // Get user's participation in a thread
  const getMyParticipation = (threadId: string): ThreadParticipant | undefined => {
    const thread = threads.find(t => t.id === threadId);
    return thread?.participants.find(p => p.user_id === user?.id);
  };

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    fetchThreads();

    // Subscribe to thread changes
    const channel = supabase
      .channel('coordination-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coordination_threads' },
        () => fetchThreads()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'thread_participants' },
        () => fetchThreads()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'thread_events' },
        (payload) => {
          // Show toast for new events from others
          const event = payload.new as ThreadEvent;
          if (event.user_id !== user.id) {
            fetchThreads();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchThreads]);

  return {
    threads,
    loading,
    createThread,
    proposeTime,
    acceptProposal,
    updateRsvp,
    getMyParticipation,
    refetch: fetchThreads
  };
}
