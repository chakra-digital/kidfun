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

      // Mark as read
      await supabase
        .from('activity_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

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
