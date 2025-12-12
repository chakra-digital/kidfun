import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, School, Home, Bell, Check, X } from 'lucide-react';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export const SocialConnectionsCard = () => {
  const navigate = useNavigate();
  const { connections, groups, loading, fetchPendingRequests, acceptConnectionRequest, declineConnectionRequest, refetch } = useSocialConnections();
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    setLoadingRequests(true);
    const { received } = await fetchPendingRequests();
    setPendingReceived(received);
    setLoadingRequests(false);
  };

  const handleAccept = async (requestId: string) => {
    const { error } = await acceptConnectionRequest(requestId);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Connection accepted!', description: 'You are now connected.' });
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Network
          {hasPendingRequests && (
            <Badge variant="destructive" className="ml-2">
              {pendingReceived.length} new
            </Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate('/find-parents')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Find Parents
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Requests Section */}
        {hasPendingRequests && (
          <div className="pb-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-destructive" />
              <h4 className="text-sm font-medium">Connection Requests</h4>
            </div>
            <div className="space-y-2">
              {pendingReceived.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {request.sender_profile?.first_name} {request.sender_profile?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      wants to connect via {request.connection_type}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button size="sm" variant="default" onClick={() => handleAccept(request.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecline(request.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connections Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground">Connections</h4>
            <Badge variant="secondary">{connections.length}</Badge>
          </div>
          {hasConnections ? (
            <div className="space-y-2">
              {connections.slice(0, 3).map((connection) => (
                <div 
                  key={connection.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {connection.profile?.first_name} {connection.profile?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {connection.connection_type} connection
                    </p>
                  </div>
                </div>
              ))}
              {connections.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full">
                  View all {connections.length} connections
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No connections yet</p>
              <p className="text-xs">Connect with parents in your area</p>
            </div>
          )}
        </div>

        {/* Groups Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground">Groups</h4>
            <Badge variant="secondary">{groups.length}</Badge>
          </div>
          {hasGroups ? (
            <div className="space-y-2">
              {groups.slice(0, 3).map((group) => (
                <div 
                  key={group.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                    {group.group_type === 'school' ? (
                      <School className="h-4 w-4 text-accent" />
                    ) : (
                      <Home className="h-4 w-4 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {group.group_type} group
                    </p>
                  </div>
                </div>
              ))}
              {groups.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full">
                  View all {groups.length} groups
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <School className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No groups yet</p>
              <p className="text-xs">Join or create groups to coordinate</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {(hasConnections || hasGroups) && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{connections.length}</p>
                <p className="text-xs text-muted-foreground">Parents Connected</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{groups.length}</p>
                <p className="text-xs text-muted-foreground">Groups Joined</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};