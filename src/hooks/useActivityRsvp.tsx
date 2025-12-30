import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export type RsvpStatus = 'going' | 'maybe' | 'declined';

export interface ActivityRsvp {
  id: string;
  activity_share_id: string;
  user_id: string;
  status: RsvpStatus;
  children_bringing: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RsvpSummary {
  going_count: number;
  maybe_count: number;
  declined_count: number;
}

export interface RsvpWithProfile extends ActivityRsvp {
  profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export const useActivityRsvp = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Get user's RSVP for a specific activity share
  const getUserRsvp = useCallback(async (activityShareId: string): Promise<ActivityRsvp | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('activity_rsvps')
        .select('*')
        .eq('activity_share_id', activityShareId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ActivityRsvp | null;
    } catch (err: any) {
      console.error('Error fetching user RSVP:', err);
      return null;
    }
  }, [user]);

  // Set or update RSVP
  const setRsvp = useCallback(async (
    activityShareId: string,
    status: RsvpStatus,
    childrenBringing: string[] = [],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setLoading(true);
    try {
      // Use upsert to handle both insert and update
      const { error } = await supabase
        .from('activity_rsvps')
        .upsert({
          activity_share_id: activityShareId,
          user_id: user.id,
          status,
          children_bringing: childrenBringing,
          notes: notes || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'activity_share_id,user_id'
        });

      if (error) throw error;

      const statusLabels: Record<RsvpStatus, string> = {
        going: "You're going!",
        maybe: "Marked as maybe",
        declined: "Declined"
      };

      toast({
        title: statusLabels[status],
        description: status === 'going' 
          ? "The activity organizer will be notified."
          : undefined
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error setting RSVP:', err);
      toast({
        title: 'Failed to update RSVP',
        description: err.message,
        variant: 'destructive'
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get RSVP summary for an activity share
  const getRsvpSummary = useCallback(async (activityShareId: string): Promise<RsvpSummary> => {
    try {
      const { data, error } = await supabase
        .rpc('get_activity_rsvp_summary', { share_id: activityShareId });

      if (error) throw error;
      
      // The RPC returns an array with one row
      if (data && data.length > 0) {
        return data[0] as RsvpSummary;
      }
      
      return { going_count: 0, maybe_count: 0, declined_count: 0 };
    } catch (err: any) {
      console.error('Error fetching RSVP summary:', err);
      return { going_count: 0, maybe_count: 0, declined_count: 0 };
    }
  }, []);

  // Get all RSVPs with profiles for an activity share (for activity creator)
  const getRsvpsWithProfiles = useCallback(async (activityShareId: string): Promise<RsvpWithProfile[]> => {
    try {
      const { data: rsvps, error: rsvpError } = await supabase
        .from('activity_rsvps')
        .select('*')
        .eq('activity_share_id', activityShareId);

      if (rsvpError) throw rsvpError;
      if (!rsvps || rsvps.length === 0) return [];

      // Fetch profiles for each RSVP
      const userIds = rsvps.map(r => r.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profileError) {
        console.error('Error fetching profiles for RSVPs:', profileError);
        return rsvps as RsvpWithProfile[];
      }

      // Merge profiles with RSVPs
      return rsvps.map(rsvp => ({
        ...rsvp,
        profile: profiles?.find(p => p.user_id === rsvp.user_id) || undefined
      })) as RsvpWithProfile[];
    } catch (err: any) {
      console.error('Error fetching RSVPs with profiles:', err);
      return [];
    }
  }, []);

  // Remove RSVP
  const removeRsvp = useCallback(async (activityShareId: string): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('activity_rsvps')
        .delete()
        .eq('activity_share_id', activityShareId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Error removing RSVP:', err);
      return { success: false };
    }
  }, [user]);

  return {
    loading,
    getUserRsvp,
    setRsvp,
    getRsvpSummary,
    getRsvpsWithProfiles,
    removeRsvp
  };
};
