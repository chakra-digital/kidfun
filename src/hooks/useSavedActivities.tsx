import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface SavedActivity {
  id: string;
  user_id: string;
  provider_id: string | null;
  provider_name: string;
  activity_name: string | null;
  status: 'saved' | 'interested' | 'booked' | 'completed';
  scheduled_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionWithActivities {
  user_id: string;
  first_name: string;
  last_name: string;
  school_name?: string;
  neighborhood?: string;
  shared_activities: SavedActivity[];
}

export const useSavedActivities = () => {
  const { user } = useAuth();
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedActivities = async () => {
    if (!user) {
      setSavedActivities([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedActivities((data as SavedActivity[]) || []);
    } catch (err: any) {
      console.error('Error fetching saved activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedActivities();
  }, [user]);

  const saveActivity = async (
    providerId: string | null,
    providerName: string,
    activityName?: string,
    status: 'saved' | 'interested' | 'booked' | 'completed' = 'saved'
  ) => {
    if (!user) {
      console.log('saveActivity: No user found');
      toast({ title: 'Please sign in', description: 'You need to be signed in to save activities.', variant: 'destructive' });
      return { error: 'Not authenticated' };
    }

    console.log('saveActivity called:', { providerId, providerName, userId: user.id });

    try {
      const { data, error } = await supabase
        .from('saved_activities')
        .insert({
          user_id: user.id,
          provider_id: providerId || null,
          provider_name: providerName,
          activity_name: activityName || null,
          status
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Activity saved successfully:', data);
      setSavedActivities(prev => [data as SavedActivity, ...prev]);
      toast({ title: 'Activity saved!', description: `${providerName} added to your list.` });
      return { data, error: null };
    } catch (err: any) {
      console.error('Error saving activity:', err);
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
      return { data: null, error: err.message };
    }
  };

  const updateActivityStatus = async (
    activityId: string,
    status: 'saved' | 'interested' | 'booked' | 'completed',
    scheduledDate?: string
  ) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const updateData: any = { status };
      if (scheduledDate) updateData.scheduled_date = scheduledDate;

      const { data, error } = await supabase
        .from('saved_activities')
        .update(updateData)
        .eq('id', activityId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setSavedActivities(prev => 
        prev.map(a => a.id === activityId ? (data as SavedActivity) : a)
      );
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating activity:', err);
      return { data: null, error: err.message };
    }
  };

  const removeActivity = async (activityId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('saved_activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSavedActivities(prev => prev.filter(a => a.id !== activityId));
      return { error: null };
    } catch (err: any) {
      console.error('Error removing activity:', err);
      return { error: err.message };
    }
  };

  // Fetch activities from connected parents for social discovery
  const fetchConnectionActivities = async (connectionUserIds: string[]): Promise<SavedActivity[]> => {
    if (!user || connectionUserIds.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('saved_activities')
        .select('*')
        .in('user_id', connectionUserIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data as SavedActivity[]) || [];
    } catch (err: any) {
      console.error('Error fetching connection activities:', err);
      return [];
    }
  };

  return {
    savedActivities,
    loading,
    saveActivity,
    updateActivityStatus,
    removeActivity,
    fetchConnectionActivities,
    refetch: fetchSavedActivities
  };
};
