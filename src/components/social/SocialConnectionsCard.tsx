import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, UserPlus, School, Home, Bell, Check, X, Sparkles, ArrowRight, ChevronDown, Bookmark } from 'lucide-react';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSavedActivities, SavedActivity } from '@/hooks/useSavedActivities';
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
  const [connectionsExpanded, setConnectionsExpanded] = useState(false);
  const [connectionActivities, setConnectionActivities] = useState<Record<string, SavedActivity[]>>({});
  
  const { fetchConnectionActivities } = useSavedActivities();

  useEffect(() => {
    loadPendingRequests();
  }, []);

  // Load suggestions after connections are ready
  useEffect(() => {
    if (!loading && parentProfile) {
      loadSuggestions();
    }
  }, [parentProfile, connections, loading]);

  // Load connection activities when expanded
  useEffect(() => {
    const loadConnectionActivities = async () => {
      if (!connectionsExpanded || connections.length === 0) return;
      
      const connectionIds = connections.map(c => c.connected_parent_id);
      const activities = await fetchConnectionActivities(connectionIds);
      
      // Group by user_id
      const grouped: Record<string, SavedActivity[]> = {};
      activities.forEach(activity => {
        if (!grouped[activity.user_id]) {
          grouped[activity.user_id] = [];
        }
        grouped[activity.user_id].push(activity);
      });
      setConnectionActivities(grouped);
    };
    
    loadConnectionActivities();
  }, [connectionsExpanded, connections]);

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
                      {request.sender_profile?.first_name 
                        ? `${request.sender_profile.first_name}${request.sender_profile.last_name ? ` ${request.sender_profile.last_name}` : ''}`
                        : 'A parent'}
                      {' '}
                      <span className="font-normal text-muted-foreground">wants to connect</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {request.connection_type === 'school' ? (
                        <><School className="h-3 w-3" /> Same school</>
                      ) : request.connection_type === 'neighborhood' ? (
                        <><Home className="h-3 w-3" /> Neighbor</>
                      ) : (
                        request.connection_type
                      )}
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
              {suggestedParents
                .filter(parent => parent.profile?.first_name) // Only show parents with names
                .map((parent) => (
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

        {/* No suggestions or empty suggestions prompt */}
        {(!hasSuggestions || suggestedParents.filter(p => p.profile?.first_name).length === 0) && !loadingSuggestions && (
          <div className="text-center py-6 border-b border-border">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            {!parentProfile?.school_name && !parentProfile?.neighborhood ? (
              <>
                <p className="font-medium text-foreground mb-1">Build Your Network</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Add your school or neighborhood to discover parents nearby
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                  Complete Profile
                </Button>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground mb-1">Grow Your Circle</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Search for parents at your school or in your area
                </p>
                <Button variant="default" size="sm" onClick={() => navigate('/find-parents')}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Find Parents
                </Button>
              </>
            )}
          </div>
        )}

        {/* Connections List - Expandable */}
        {hasConnections && (
          <Collapsible open={connectionsExpanded} onOpenChange={setConnectionsExpanded}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Your Connections</span>
                  <Badge variant="secondary" className="text-xs">{connections.length}</Badge>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${connectionsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {connections.map((connection) => {
                const activities = connectionActivities[connection.connected_parent_id] || [];
                return (
                  <div 
                    key={connection.id}
                    className="p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/parent/${connection.connected_parent_id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium hover:text-primary transition-colors">
                            {connection.profile?.first_name} {connection.profile?.last_name}
                          </p>
                          {connection.connection_type && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {connection.connection_type === 'school' ? (
                                <span className="flex items-center gap-1"><School className="h-3 w-3" /> Same school</span>
                              ) : (
                                <span className="flex items-center gap-1"><Home className="h-3 w-3" /> Neighbor</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    {/* Shared activities preview */}
                    {activities.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Bookmark className="h-3 w-3" />
                          Saved activities:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {activities.slice(0, 2).map(activity => (
                            <Badge key={activity.id} variant="outline" className="text-xs">
                              {activity.provider_name}
                            </Badge>
                          ))}
                          {activities.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{activities.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Quick Stats Row */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
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
