import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface LocationState {
  filterType?: 'school' | 'neighborhood';
  filterValue?: string;
  placeId?: string;
}

const FindParents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  
  const { parentProfile, refreshProfile } = useUserProfile();
  const { findPotentialConnections, sendConnectionRequest, connections, fetchPendingRequests, loading } = useSocialConnections();
  
  const [searchType, setSearchType] = useState<'school' | 'neighborhood'>(locationState?.filterType || 'school');
  const [searchTerm, setSearchTerm] = useState(locationState?.filterValue || '');
  const [potentialConnections, setPotentialConnections] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [pendingUserIds, setPendingUserIds] = useState<Set<string>>(new Set());
  const [connectedUserIds, setConnectedUserIds] = useState<Set<string>>(new Set());
  const [sentRequestUserIds, setSentRequestUserIds] = useState<Set<string>>(new Set());
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  // Auto-search if coming from dashboard with filter params
  useEffect(() => {
    if (locationState?.filterValue && !hasAutoSearched) {
      setHasAutoSearched(true);
      handleSearch(locationState.filterValue, locationState.filterType, locationState.placeId);
    }
  }, [locationState, hasAutoSearched]);

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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Header Section */}
        <div className="bg-gradient-to-b from-rose-50/50 to-background dark:from-rose-950/20 dark:to-background pt-8 pb-12">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-medium mb-4">
                <Users className="h-4 w-4" />
                Parent Network
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Find Parents</h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Connect with parents from your school or neighborhood to coordinate activities together.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="discover" className="mb-8">
              <TabsList className="bg-muted/50 p-1 rounded-full w-fit mx-auto mb-8">
                <TabsTrigger 
                  value="discover" 
                  className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Discover
                </TabsTrigger>
                <TabsTrigger 
                  value="requests" 
                  className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Connection Requests
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discover" className="space-y-6">
                {/* Prompt to set school/neighborhood if not set */}
                {!parentProfile?.school_name && !parentProfile?.neighborhood && (
                  <Card className="p-6 rounded-2xl border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-rose-500 to-orange-400 rounded-xl shadow-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">Complete Your Profile</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add your child's school or neighborhood to find and connect with nearby parents more easily.
                        </p>
                        <EditProfileDialog 
                          open={editProfileOpen} 
                          onOpenChange={(open) => {
                            setEditProfileOpen(open);
                            if (!open) {
                              refreshProfile();
                            }
                          }}
                          trigger={
                            <Button className="bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500">
                              <Edit className="h-4 w-4 mr-2" />
                              Update Profile Settings
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Search Card */}
                <Card className="p-6 md:p-8 rounded-2xl shadow-sm border-border/50">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Search for Parents</h3>
                      <div className="flex gap-2 mb-5">
                        <Button
                          variant={searchType === 'school' ? 'default' : 'outline'}
                          onClick={() => setSearchType('school')}
                          className={searchType === 'school' 
                            ? 'bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 rounded-full' 
                            : 'rounded-full'}
                        >
                          By School
                        </Button>
                        <Button
                          variant={searchType === 'neighborhood' ? 'default' : 'outline'}
                          onClick={() => setSearchType('neighborhood')}
                          className={searchType === 'neighborhood' 
                            ? 'bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 rounded-full' 
                            : 'rounded-full'}
                        >
                          By Neighborhood
                        </Button>
                      </div>
                      
                      <div className="flex gap-3">
                        <Input
                          placeholder={`Search by ${searchType}...`}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="rounded-xl h-12"
                        />
                        <Button 
                          onClick={() => handleSearch()} 
                          disabled={isSearching || !searchTerm.trim()}
                          className="h-12 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </Button>
                      </div>
                    </div>

                    {parentProfile?.school_name && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-sm text-muted-foreground mb-3">Quick search:</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickSearch('school', parentProfile.school_name || '', parentProfile.school_place_id || undefined)}
                            className="rounded-full text-sm"
                          >
                            My School: {parentProfile.school_name}
                          </Button>
                          {parentProfile.neighborhood && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickSearch('neighborhood', parentProfile.neighborhood || '')}
                              className="rounded-full text-sm"
                            >
                              My Neighborhood: {parentProfile.neighborhood}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Results */}
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
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-3 text-muted-foreground">
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Searching for parents...
                    </div>
                  </div>
                )}

                {!isSearching && potentialConnections.length === 0 && searchTerm && (
                  <div className="text-center py-12">
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FindParents;
