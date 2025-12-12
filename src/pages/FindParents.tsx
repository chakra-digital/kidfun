import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ArrowLeft, Users, Edit } from 'lucide-react';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useUserProfile } from '@/hooks/useUserProfile';
import ParentCard from '@/components/social/ParentCard';
import ConnectionRequests from '@/components/social/ConnectionRequests';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { toast } from '@/hooks/use-toast';

const FindParents = () => {
  const navigate = useNavigate();
  const { parentProfile, refreshProfile } = useUserProfile();
  const { findPotentialConnections, sendConnectionRequest, connections, fetchPendingRequests, loading } = useSocialConnections();
  
  const [searchType, setSearchType] = useState<'school' | 'neighborhood'>('school');
  const [searchTerm, setSearchTerm] = useState('');
  const [potentialConnections, setPotentialConnections] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [pendingUserIds, setPendingUserIds] = useState<Set<string>>(new Set());
  const [connectedUserIds, setConnectedUserIds] = useState<Set<string>>(new Set());
  const [sentRequestUserIds, setSentRequestUserIds] = useState<Set<string>>(new Set());

  // Load existing connections and pending requests to filter results
  useEffect(() => {
    const loadConnectionStatus = async () => {
      // Get connected user IDs from accepted connections
      const connectedIds = new Set(connections.map(c => c.profile?.email ? c.connected_parent_id : c.parent_id));
      setConnectedUserIds(connectedIds);

      // Get pending request user IDs
      const { sent } = await fetchPendingRequests();
      const sentIds = new Set(sent.map((r: any) => r.connected_parent_id));
      setSentRequestUserIds(sentIds);
    };
    loadConnectionStatus();
  }, [connections]);

  const handleSearch = async (overrideSearchTerm?: string, overrideType?: 'school' | 'neighborhood', overridePlaceId?: string) => {
    const term = overrideSearchTerm ?? searchTerm;
    const type = overrideType ?? searchType;
    
    if (!term.trim()) return;
    
    setIsSearching(true);
    // Pass school_place_id for more accurate matching when searching by school
    const schoolPlaceId = type === 'school' ? (overridePlaceId ?? parentProfile?.school_place_id) : undefined;
    const results = await findPotentialConnections(
      type === 'school' ? term : undefined,
      type === 'neighborhood' ? term : undefined,
      schoolPlaceId || undefined
    );
    setPotentialConnections(results);
    setIsSearching(false);
  };

  const handleQuickSearch = (type: 'school' | 'neighborhood', term: string, placeId?: string) => {
    setSearchType(type);
    setSearchTerm(term);
    handleSearch(term, type, placeId);
  };

  const handleSendRequest = async (targetUserId: string) => {
    const { error } = await sendConnectionRequest(targetUserId, searchType);
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      // Mark as pending instead of removing
      setSentRequestUserIds(prev => new Set([...prev, targetUserId]));
      toast({
        title: 'Connection request sent!',
        description: 'The parent will be notified of your request.',
      });
    }
  };

  const getConnectionStatus = (userId: string): 'none' | 'pending' | 'connected' => {
    if (connectedUserIds.has(userId)) return 'connected';
    if (sentRequestUserIds.has(userId) || pendingUserIds.has(userId)) return 'pending';
    return 'none';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Find Parents</h1>
          <p className="text-muted-foreground mb-8">
            Connect with parents from your school or neighborhood to coordinate activities together.
          </p>

          <Tabs defaultValue="discover" className="mb-8">
            <TabsList>
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="requests">Connection Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-6">
              {/* Prompt to set school/neighborhood if not set */}
              {!parentProfile?.school_name && !parentProfile?.neighborhood && (
                <Card className="p-6 border-primary/20 bg-primary/5">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Complete Your Profile</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add your child's school or neighborhood to find and connect with nearby parents more easily.
                        </p>
                      </div>
                    </div>
                    <EditProfileDialog 
                      open={editProfileOpen} 
                      onOpenChange={(open) => {
                        setEditProfileOpen(open);
                        if (!open) {
                          // Refresh profile when dialog closes
                          refreshProfile();
                        }
                      }}
                      trigger={
                        <Button>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Profile Settings
                        </Button>
                      }
                    />
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Search for Parents</h3>
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={searchType === 'school' ? 'default' : 'outline'}
                        onClick={() => setSearchType('school')}
                      >
                        By School
                      </Button>
                      <Button
                        variant={searchType === 'neighborhood' ? 'default' : 'outline'}
                        onClick={() => setSearchType('neighborhood')}
                      >
                        By Neighborhood
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Search by ${searchType}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={() => handleSearch()} disabled={isSearching || !searchTerm.trim()}>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>

                  {parentProfile?.school_name && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Quick search:</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickSearch('school', parentProfile.school_name || '', parentProfile.school_place_id || undefined)}
                        >
                          My School: {parentProfile.school_name}
                        </Button>
                        {parentProfile.neighborhood && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickSearch('neighborhood', parentProfile.neighborhood || '')}
                          >
                            My Neighborhood: {parentProfile.neighborhood}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {potentialConnections.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Found {potentialConnections.length} parent{potentialConnections.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {potentialConnections.map((parent) => (
                      <ParentCard
                        key={parent.user_id}
                        parent={parent}
                        onConnect={handleSendRequest}
                        connectionStatus={getConnectionStatus(parent.user_id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isSearching && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Searching for parents...</p>
                </div>
              )}

              {!isSearching && potentialConnections.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No parents found. Try a different search term.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              <ConnectionRequests />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FindParents;
