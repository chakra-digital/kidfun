import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock } from 'lucide-react';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { toast } from '@/hooks/use-toast';

const ConnectionRequests = () => {
  const { fetchPendingRequests, acceptConnectionRequest, declineConnectionRequest } = useSocialConnections();
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { received, sent } = await fetchPendingRequests();
    setReceivedRequests(received);
    setSentRequests(sent);
    setLoading(false);
  };

  const handleAccept = async (requestId: string) => {
    const { error } = await acceptConnectionRequest(requestId);
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Connection accepted!',
        description: 'You are now connected.',
      });
      loadRequests();
    }
  };

  const handleDecline = async (requestId: string) => {
    const { error } = await declineConnectionRequest(requestId);
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Request declined',
      });
      loadRequests();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">
            Received ({receivedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending connection requests</p>
            </Card>
          ) : (
            receivedRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {request.sender_profile?.first_name} {request.sender_profile?.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {request.sender_profile?.email}
                    </p>
                    {request.connection_type && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Via: {request.connection_type}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAccept(request.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(request.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending sent requests</p>
            </Card>
          ) : (
            sentRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {request.receiver_profile?.first_name} {request.receiver_profile?.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {request.receiver_profile?.email}
                    </p>
                    {request.connection_type && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Via: {request.connection_type}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Sent on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Pending</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionRequests;
