import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { SavedActivity } from './useSavedActivities';

export interface ActivityMessage {
  id: string;
  activity_id: string | null;
  sender_id: string;
  recipient_id: string;
  message: string;
  message_type: 'join_request' | 'invite' | 'general' | 'accepted' | 'declined';
  read_at: string | null;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
  };
  activity?: SavedActivity;
}

export const useActivityCoordination = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ActivityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('activity_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Type cast safely
      const typedMessages = (data || []) as ActivityMessage[];
      setMessages(typedMessages);
      setUnreadCount(typedMessages.filter(m => m.recipient_id === user.id && !m.read_at).length);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('activity-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ActivityMessage;
          setMessages(prev => [newMessage, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast({
            title: 'New message!',
            description: newMessage.message_type === 'invite' 
              ? 'You\'ve been invited to an activity'
              : 'Someone wants to join your activity',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const sendJoinRequest = async (
    activityId: string,
    recipientId: string,
    message: string
  ) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('activity_messages')
        .insert({
          activity_id: activityId,
          sender_id: user.id,
          recipient_id: recipientId,
          message,
          message_type: 'join_request'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Request sent!', description: 'They\'ll be notified.' });
      return { data, error: null };
    } catch (err: any) {
      console.error('Error sending join request:', err);
      return { data: null, error: err.message };
    }
  };

  const sendInvite = async (
    activityId: string | null,
    recipientId: string,
    providerName: string,
    message: string
  ) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('activity_messages')
        .insert({
          activity_id: activityId,
          sender_id: user.id,
          recipient_id: recipientId,
          message: message || `I thought you might be interested in ${providerName}!`,
          message_type: 'invite'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Invite sent!', description: 'They\'ll be notified.' });
      return { data, error: null };
    } catch (err: any) {
      console.error('Error sending invite:', err);
      return { data: null, error: err.message };
    }
  };

  const respondToRequest = async (
    messageId: string,
    response: 'accepted' | 'declined'
  ) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Find the original message
      const originalMessage = messages.find(m => m.id === messageId);
      if (!originalMessage) throw new Error('Message not found');

      // If accepting, save the activity to this user's account and create activity_share for RSVP tracking
      if (response === 'accepted' && originalMessage.activity_id) {
        // Fetch the original activity details
        const { data: originalActivity, error: activityError } = await supabase
          .from('saved_activities')
          .select('*')
          .eq('id', originalMessage.activity_id)
          .single();

        if (!activityError && originalActivity) {
          // Check if user already has this activity saved
          const activityLookup = supabase
            .from('saved_activities')
            .select('id')
            .eq('user_id', user.id);

          const { data: existingActivity } = originalActivity.provider_id
            ? await activityLookup.eq('provider_id', originalActivity.provider_id).maybeSingle()
            : await activityLookup.eq('provider_name', originalActivity.provider_name).maybeSingle();

          // Only create if not already saved
          if (!existingActivity) {
            const { error: saveError } = await supabase
              .from('saved_activities')
              .insert({
                user_id: user.id,
                provider_id: originalActivity.provider_id,
                provider_name: originalActivity.provider_name,
                activity_name: originalActivity.activity_name,
                provider_url: originalActivity.provider_url,
                scheduled_date: originalActivity.scheduled_date,
                status: 'saved',
              });

            if (saveError) {
              console.error('Error saving activity to user:', saveError);
            }
          }

          // Create activity_share (only if it doesn't already exist)
          const shareLookup = supabase
            .from('activity_shares')
            .select('id')
            .eq('shared_by', originalMessage.sender_id)
            .eq('shared_with', user.id);

          const { data: existingShare } = originalActivity.provider_id
            ? await shareLookup.eq('provider_id', originalActivity.provider_id).maybeSingle()
            : await shareLookup.eq('provider_name', originalActivity.provider_name).maybeSingle();

          if (!existingShare) {
            const { error: shareError } = await supabase
              .from('activity_shares')
              .insert({
                shared_by: originalMessage.sender_id,
                shared_with: user.id,
                activity_name: originalActivity.activity_name || originalActivity.provider_name,
                provider_name: originalActivity.provider_name,
                provider_id: originalActivity.provider_id,
              });

            if (shareError) {
              console.error('Error creating activity share:', shareError);
            }
          }
        }
      }

      // Send response message
      const { error } = await supabase
        .from('activity_messages')
        .insert({
          activity_id: originalMessage.activity_id,
          sender_id: user.id,
          recipient_id: originalMessage.sender_id,
          message: response === 'accepted'
            ? 'Great! Let\'s coordinate the details.'
            : 'Sorry, this doesn\'t work for us this time.',
          message_type: response
        });

      if (error) throw error;

      toast({
        title: response === 'accepted' ? 'Request accepted!' : 'Request declined',
        description: response === 'accepted' ? 'Activity added to your list!' : undefined,
      });

      fetchMessages();
      return { error: null };
    } catch (err: any) {
      console.error('Error responding to request:', err);
      return { error: err.message };
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('activity_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('recipient_id', user.id);

      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  return {
    messages,
    loading,
    unreadCount,
    sendJoinRequest,
    sendInvite,
    respondToRequest,
    markAsRead,
    refetch: fetchMessages
  };
};
