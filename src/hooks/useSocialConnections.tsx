import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ParentConnection {
  id: string;
  parent_id: string;
  connected_parent_id: string;
  connection_type: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface SocialGroup {
  id: string;
  name: string;
  description: string;
  group_type: string;
  privacy_level: string;
  member_count?: number;
}

export const useSocialConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ParentConnection[]>([]);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchGroups();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('parent_connections')
        .select('*')
        .or(`parent_id.eq.${user.id},connected_parent_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;
      
      // Fetch profile details for each connection
      const connectionsWithProfiles = await Promise.all(
        (data || []).map(async (conn) => {
          const targetUserId = conn.parent_id === user.id ? conn.connected_parent_id : conn.parent_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', targetUserId)
            .single();
          
          return { ...conn, profile };
        })
      );
      
      setConnections(connectionsWithProfiles as ParentConnection[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    if (!user) return;

    try {
      const { data: memberships, error } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('parent_id', user.id);

      if (error) throw error;

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }

      // Fetch group details
      const { data: groupsData, error: groupsError } = await supabase
        .from('social_groups')
        .select('id, name, description, group_type, privacy_level')
        .in('id', memberships.map(m => m.group_id));

      if (groupsError) throw groupsError;

      setGroups(groupsData || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const findPotentialConnections = async (schoolName?: string, neighborhood?: string) => {
    if (!user) return [];

    try {
      let query = supabase
        .from('parent_profiles')
        .select('user_id, school_name, neighborhood')
        .neq('user_id', user.id);

      if (schoolName) {
        query = query.eq('school_name', schoolName);
      } else if (neighborhood) {
        query = query.eq('neighborhood', neighborhood);
      }

      const { data: profiles, error } = await query.limit(10);

      if (error) throw error;
      
      if (!profiles || profiles.length === 0) return [];

      // Fetch profile details
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', profiles.map(p => p.user_id));

      return profiles.map(profile => ({
        ...profile,
        profile: userProfiles?.find(up => up.user_id === profile.user_id)
      }));
    } catch (err: any) {
      console.error('Error finding connections:', err);
      return [];
    }
  };

  const sendConnectionRequest = async (targetUserId: string, connectionType: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('parent_connections')
        .insert({
          parent_id: user.id,
          connected_parent_id: targetUserId,
          connection_type: connectionType,
          status: 'pending'
        });

      if (error) throw error;
      
      await fetchConnections();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    connections,
    groups,
    loading,
    error,
    findPotentialConnections,
    sendConnectionRequest,
    refetch: () => {
      fetchConnections();
      fetchGroups();
    }
  };
};
