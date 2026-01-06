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
  profile: {
    user_id: string;
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
      
      // Dedupe by connection pair and normalize to always show the "other" user
      const seenPairs = new Set<string>();
      const uniqueConnections: any[] = [];
      
      (data || []).forEach(conn => {
        const pairKey = [conn.parent_id, conn.connected_parent_id].sort().join('-');
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          // Normalize: always put the "other" user in connected_parent_id
          const otherUserId = conn.parent_id === user.id ? conn.connected_parent_id : conn.parent_id;
          uniqueConnections.push({
            ...conn,
            connected_parent_id: otherUserId
          });
        }
      });
      
      // Fetch profile details for each connection
      const connectionsWithProfiles = await Promise.all(
        uniqueConnections.map(async (conn) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', conn.connected_parent_id)
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

  const findPotentialConnections = async (schoolName?: string, neighborhood?: string, schoolPlaceId?: string) => {
    if (!user) return [];

    try {
      // Use the secure RPC function that only exposes non-sensitive discovery fields
      // This protects emergency contacts, precise locations, and budget information
      const { data: profiles, error } = await supabase
        .rpc('get_parent_discovery_info', {
          search_school: schoolName || null,
          search_neighborhood: neighborhood || null
        });

      if (error) throw error;
      
      if (!profiles || profiles.length === 0) return [];

      // Fetch basic profile details (name only for display)
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', profiles.map((p: any) => p.user_id));

      return profiles.slice(0, 20).map((profile: any) => ({
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

  const fetchPendingRequests = async () => {
    if (!user) return { received: [], sent: [] };

    try {
      // Fetch received requests
      const { data: receivedData, error: receivedError } = await supabase
        .from('parent_connections')
        .select('*')
        .eq('connected_parent_id', user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      // Fetch sender profiles
      const receivedWithProfiles = await Promise.all(
        (receivedData || []).map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', req.parent_id)
            .single();
          
          return { ...req, sender_profile: profile };
        })
      );

      // Fetch sent requests
      const { data: sentData, error: sentError } = await supabase
        .from('parent_connections')
        .select('*')
        .eq('parent_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Fetch receiver profiles
      const sentWithProfiles = await Promise.all(
        (sentData || []).map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', req.connected_parent_id)
            .single();
          
          return { ...req, receiver_profile: profile };
        })
      );

      return {
        received: receivedWithProfiles,
        sent: sentWithProfiles
      };
    } catch (err: any) {
      console.error('Error fetching pending requests:', err);
      return { received: [], sent: [] };
    }
  };

  const acceptConnectionRequest = async (requestId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('parent_connections')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('connected_parent_id', user.id);

      if (error) throw error;
      
      await fetchConnections();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const declineConnectionRequest = async (requestId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('parent_connections')
        .update({ status: 'declined' })
        .eq('id', requestId)
        .eq('connected_parent_id', user.id);

      if (error) throw error;
      
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
    fetchPendingRequests,
    acceptConnectionRequest,
    declineConnectionRequest,
    refetch: () => {
      fetchConnections();
      fetchGroups();
    }
  };
};
