import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, School, Home, Bell, Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface SuggestedParent {
  user_id: string;
  school_name: string | null;
  neighborhood: string | null;
  profile?: {
    first_name: string;
    last_name: string;
  };
}

export const SocialConnectionsCard = () => {
  const navigate = useNavigate();
  const { parentProfile } = useUserProfile();
  const { 
    connections, 
    groups, 
    loading, 
    fetchPendingRequests, 
    acceptConnectionRequest, 
    declineConnectionRequest, 
    findPotentialConnections,
    sendConnectionRequest,
    refetch 
  } = useSocialConnections();
  
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [suggestedParents, setSuggestedParents] = useState<SuggestedParent[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [connectingUserIds, setConnectingUserIds] = useState<Set<string>>(new Set());
  const [sentRequestUserIds, setSentRequestUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPendingRequests();
  }, []);

  // Load suggestions after connections are ready
  useEffect(() => {
    if (!loading && parentProfile) {
      loadSuggestions();
    }
  }, [parentProfile, connections, loading]);

  const loadPendingRequests = async () => {
    setLoadingRequests(true);
    const { received, sent } = await fetchPendingRequests();
    setPendingReceived(received);
    setSentRequestUserIds(new Set(sent.map((r: any) => r.connected_parent_id)));
    setLoadingRequests(false);
  };

  const loadSuggestions = async () => {
    if (!parentProfile?.school_name && !parentProfile?.neighborhood) return;
    
    setLoadingSuggestions(true);
    try {
      // Fetch suggestions based on school first, then neighborhood
      let suggestions: SuggestedParent[] = [];
      
      if (parentProfile?.school_name) {
        suggestions = await findPotentialConnections(parentProfile.school_name, undefined, parentProfile.school_place_id || undefined);
      }
      
      // If not enough from school, add neighborhood matches
      if (suggestions.length < 3 && parentProfile?.neighborhood) {
        const neighborhoodSuggestions = await findPotentialConnections(undefined, parentProfile.neighborhood);
        // Avoid duplicates
        const existingIds = new Set(suggestions.map(s => s.user_id));
        const newSuggestions = neighborhoodSuggestions.filter((s: SuggestedParent) => !existingIds.has(s.user_id));
        suggestions = [...suggestions, ...newSuggestions];
      }
      
      // Filter out already connected users (get both sides of connections)
      const connectedIds = new Set<string>();
      connections.forEach(c => {
        connectedIds.add(c.connected_parent_id);
        connectedIds.add(c.parent_id);
      });
      
      // Also filter out pending requests (both sent and received)
      const pendingReceivedIds = new Set(pendingReceived.map((r: any) => r.parent_id));
      
      suggestions = suggestions.filter(s => 
        !connectedIds.has(s.user_id) && 
        !sentRequestUserIds.has(s.user_id) &&
        !pendingReceivedIds.has(s.user_id)
      );
      
      setSuggestedParents(suggestions.slice(0, 3));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    const { error } = await acceptConnectionRequest(requestId);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Connected!', description: 'You are now connected.' });
      loadPendingRequests();
      refetch();
    }
  };

  const handleDecline = async (requestId: string) => {
    const { error } = await declineConnectionRequest(requestId);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Request declined' });
      loadPendingRequests();
    }
  };

  const handleQuickConnect = async (targetUserId: string, connectionType: string) => {
    setConnectingUserIds(prev => new Set([...prev, targetUserId]));
    
    const { error } = await sendConnectionRequest(targetUserId, connectionType);
    
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Request sent!', description: 'They\'ll be notified.' });
      setSentRequestUserIds(prev => new Set([...prev, targetUserId]));
      // Remove from suggestions
      setSuggestedParents(prev => prev.filter(p => p.user_id !== targetUserId));
    }
    
    setConnectingUserIds(prev => {
      const next = new Set(prev);
      next.delete(targetUserId);
      return next;
    });
  };

  const handleSchoolClick = () => {
    if (parentProfile?.school_name) {
      navigate('/find-parents', { 
        state: { 
          filterType: 'school', 
          filterValue: parentProfile.school_name,
          placeId: parentProfile.school_place_id 
        } 
      });
    }
  };

  const handleNeighborhoodClick = () => {
    if (parentProfile?.neighborhood) {
      navigate('/find-parents', { 
        state: { 
          filterType: 'neighborhood', 
          filterValue: parentProfile.neighborhood 
        } 
      });
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Your Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasConnections = connections.length > 0;
  const hasGroups = groups.length > 0;
  const hasPendingRequests = pendingReceived.length > 0;
  const hasSuggestions = suggestedParents.length > 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Your Network
            {hasPendingRequests && (
              <Badge variant="destructive" className="ml-1 animate-pulse">
                {pendingReceived.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/find-parents')}>
            See All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* Clickable filter chips */}
        {(parentProfile?.school_name || parentProfile?.neighborhood) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {parentProfile?.school_name && (
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-1"
                onClick={handleSchoolClick}
              >
                <School className="h-3 w-3" />
                {parentProfile.school_name}
              </Badge>
            )}
            {parentProfile?.neighborhood && (
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-1"
                onClick={handleNeighborhoodClick}
              >
                <Home className="h-3 w-3" />
                {parentProfile.neighborhood}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pending Requests - Priority */}
        {hasPendingRequests && (
          <div className="pb-3 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Requests</span>
            </div>
            <div className="space-y-2">
              {pendingReceived.slice(0, 2).map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {request.sender_profile?.first_name} {request.sender_profile?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.connection_type}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button size="sm" variant="default" className="h-7 w-7 p-0" onClick={() => handleAccept(request.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDecline(request.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discovery Suggestions - Facebook Style */}
        {hasSuggestions && (
          <div className="pb-3 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Parents you may know</span>
            </div>
            <div className="space-y-2">
              {suggestedParents.map((parent) => (
                <div 
                  key={parent.user_id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {parent.profile?.first_name} {parent.profile?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {parent.school_name && parentProfile?.school_name === parent.school_name ? (
                          <>
                            <School className="h-3 w-3" />
                            Same school
                          </>
                        ) : parent.neighborhood && parentProfile?.neighborhood === parent.neighborhood ? (
                          <>
                            <Home className="h-3 w-3" />
                            Same neighborhood
                          </>
                        ) : (
                          <>
                            <School className="h-3 w-3" />
                            {parent.school_name || parent.neighborhood}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 px-2 ml-2 flex-shrink-0"
                    disabled={connectingUserIds.has(parent.user_id)}
                    onClick={() => handleQuickConnect(
                      parent.user_id, 
                      parent.school_name && parentProfile?.school_name === parent.school_name ? 'school' : 'neighborhood'
                    )}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No suggestions prompt */}
        {!hasSuggestions && !loadingSuggestions && !parentProfile?.school_name && !parentProfile?.neighborhood && (
          <div className="text-center py-4 border-b border-border">
            <p className="text-sm text-muted-foreground mb-2">
              Add your school or neighborhood to discover parents nearby
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              Complete Profile
            </Button>
          </div>
        )}

        {/* Quick Stats Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{connections.length}</p>
              <p className="text-xs text-muted-foreground">Connections</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-accent-foreground">{groups.length}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </div>
          </div>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate('/find-parents')}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Find More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
