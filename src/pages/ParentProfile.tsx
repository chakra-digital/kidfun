import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, School, Home, Users, Calendar, Bookmark, MessageCircle, UserCheck, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useSavedActivities, SavedActivity } from '@/hooks/useSavedActivities';
import { toast } from '@/hooks/use-toast';

interface ParentProfileData {
  user_id: string;
  first_name: string;
  last_name: string;
  school_name?: string;
  neighborhood?: string;
}

const ParentProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connections, sendConnectionRequest } = useSocialConnections();
  const { fetchConnectionActivities } = useSavedActivities();
  
  const [profile, setProfile] = useState<ParentProfileData | null>(null);
  const [activities, setActivities] = useState<SavedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const isConnected = connections.some(c => c.connected_parent_id === userId);
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && isConnected) {
      loadActivities();
    }
  }, [userId, isConnected]);

  const loadProfile = async () => {
    try {
      // Get basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Get parent profile details (school, neighborhood) - only if connected or own profile
      let parentDetails: { school_name?: string; neighborhood?: string } = {};
      
      const { data: parentData } = await supabase
        .from('parent_profiles')
        .select('school_name, neighborhood')
        .eq('user_id', userId)
        .single();
      
      if (parentData) {
        parentDetails = parentData;
      }

      setProfile({
        ...profileData,
        ...parentDetails
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      toast({ title: 'Error', description: 'Could not load profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    if (!userId) return;
    const acts = await fetchConnectionActivities([userId]);
    setActivities(acts.filter(a => a.user_id === userId));
  };

  const handleConnect = async () => {
    if (!userId) return;
    setConnecting(true);
    
    const connectionType = profile?.school_name ? 'school' : 'neighborhood';
    const { error } = await sendConnectionRequest(userId, connectionType);
    
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Request sent!', description: 'They will be notified.' });
    }
    setConnecting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground mb-4">This parent profile doesn't exist or is private.</p>
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 text-2xl">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold mb-2">
                  {profile.first_name} {profile.last_name}
                </h1>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                  {profile.school_name && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <School className="h-3 w-3" />
                      {profile.school_name}
                    </Badge>
                  )}
                  {profile.neighborhood && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {profile.neighborhood}
                    </Badge>
                  )}
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2 justify-center sm:justify-start">
                    {isConnected ? (
                      <Button variant="outline" disabled>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Connected
                      </Button>
                    ) : (
                      <Button onClick={handleConnect} disabled={connecting}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {connecting ? 'Sending...' : 'Connect'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Section - Only visible if connected */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                Saved Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No saved activities yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div 
                      key={activity.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{activity.provider_name}</p>
                          {activity.activity_name && (
                            <p className="text-sm text-muted-foreground">{activity.activity_name}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {activity.status}
                        </Badge>
                      </div>
                      {activity.scheduled_date && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(activity.scheduled_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Not connected message */}
        {!isConnected && !isOwnProfile && (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Connect with {profile.first_name} to see their activities and coordinate together
              </p>
              <Button onClick={handleConnect} disabled={connecting}>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Connection Request
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ParentProfile;
