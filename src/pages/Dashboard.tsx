import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useChildren } from "@/hooks/useChildren";
import { useGameifiedProgress } from "@/hooks/useGameifiedProgress";
import { useSocialConnections } from "@/hooks/useSocialConnections";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Phone, Mail, Users, Edit, Plus, Calendar, GraduationCap, Home, ChevronDown, ChevronUp, UserPlus, Search, Sparkles, X } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AddChildForm from "@/components/children/AddChildForm";
import { EditChildDialog } from "@/components/children/EditChildDialog";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { GameifiedProgress } from "@/components/progress/GameifiedProgress";
import { SocialConnectionsCard } from "@/components/social/SocialConnectionsCard";
import { CoordinationFeed } from "@/components/coordination/CoordinationFeed";
import { SavedActivitiesSection } from "@/components/dashboard/SavedActivitiesSection";
import { InviteParentDialog } from "@/components/social/InviteParentDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Dashboard = () => {
  const { user } = useAuth();
  const { userProfile, parentProfile, loading } = useUserProfile();
  const { children, loading: childrenLoading, refetch: refetchChildren } = useChildren();
  const { progress } = useGameifiedProgress();
  const { connections } = useSocialConnections();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Welcome banner for newly onboarded users
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    const isNewOnboarding = searchParams.get('onboarding') === 'complete';
    const dismissed = localStorage.getItem('welcome_banner_dismissed');
    return isNewOnboarding || (!dismissed && !loading);
  });
  
  // Profile section collapsed state with localStorage persistence
  const [profileExpanded, setProfileExpanded] = useState(() => {
    const saved = localStorage.getItem('dashboard_profile_expanded');
    return saved !== null ? JSON.parse(saved) : false; // Default collapsed on mobile
  });

  useEffect(() => {
    localStorage.setItem('dashboard_profile_expanded', JSON.stringify(profileExpanded));
  }, [profileExpanded]);
  
  // Dismiss welcome banner
  const dismissWelcomeBanner = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('welcome_banner_dismissed', 'true');
  };

  const handleSchoolClick = () => {
    if (parentProfile?.school_name) {
      navigate('/find-parents', { state: { filterSchool: parentProfile.school_name } });
    }
  };

  const handleNeighborhoodClick = () => {
    if (parentProfile?.neighborhood) {
      navigate('/find-parents', { state: { filterNeighborhood: parentProfile.neighborhood } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-48 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const userType = userProfile?.user_type || user?.user_metadata?.user_type;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <main className="container mx-auto py-8 px-4 max-w-full">
        {/* Welcome Banner for New Users */}
        {showWelcomeBanner && userType === "parent" && connections.length === 0 && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Welcome to KidFun!</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    You're all set up! Here's what you can do next to get the most out of KidFun:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button asChild size="sm" className="justify-start">
                      <Link to="/">
                        <Search className="h-4 w-4 mr-2" />
                        Find Activities
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="justify-start">
                      <Link to="/find-parents">
                        <Users className="h-4 w-4 mr-2" />
                        Connect with Parents
                      </Link>
                    </Button>
                    <InviteParentDialog>
                      <Button variant="outline" size="sm" className="justify-start w-full">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Friends
                      </Button>
                    </InviteParentDialog>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={dismissWelcomeBanner}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userProfile?.first_name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Manage your {userType === "parent" ? "family" : "business"} profile and activities
          </p>
        </div>

        {/* Gamified Progress */}
        <div className="mb-6">
          <GameifiedProgress progress={progress} defaultExpanded={false} />
        </div>

        {/* Profile Info & Quick Actions - immediately after journey */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Profile Information Card - Collapsible */}
          <Card className="lg:col-span-2">
            <Collapsible open={profileExpanded} onOpenChange={setProfileExpanded}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </div>
                <EditProfileDialog />
              </CardHeader>
              
              {/* Collapsed summary - show key info */}
              {!profileExpanded && userType === "parent" && (
                <CardContent className="pt-0 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {parentProfile?.school_name && (
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={handleSchoolClick}
                      >
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {parentProfile.school_name}
                      </Badge>
                    )}
                    {parentProfile?.neighborhood && (
                      <Badge 
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={handleNeighborhoodClick}
                      >
                        <Home className="h-3 w-3 mr-1" />
                        {parentProfile.neighborhood}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              )}

              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-foreground">
                        {userProfile?.first_name} {userProfile?.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">User Type</label>
                      <div className="mt-1">
                        <Badge 
                          variant={userType === "provider" ? "default" : "secondary"}
                          className={userType === "provider" ? "bg-primary text-primary-foreground" : ""}
                        >
                          {userType === "provider" ? "🏢 Provider" : "👨‍👩‍👧‍👦 Parent"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {userProfile?.email}
                      </p>
                    </div>
                    {userProfile?.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {userProfile.phone}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* School & Neighborhood for Parents - Clickable */}
                  {userType === "parent" && (
                    <div className="pt-4 border-t border-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">School</label>
                          {parentProfile?.school_name ? (
                            <button 
                              onClick={handleSchoolClick}
                              className="text-foreground flex items-center gap-2 hover:text-primary transition-colors text-left"
                            >
                              <GraduationCap className="h-4 w-4 text-primary" />
                              <span className="underline decoration-dotted underline-offset-2">
                                {parentProfile.school_name}
                              </span>
                            </button>
                          ) : (
                            <p className="text-foreground flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-primary" />
                              <span className="text-muted-foreground italic">Not set</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Neighborhood</label>
                          {parentProfile?.neighborhood ? (
                            <button 
                              onClick={handleNeighborhoodClick}
                              className="text-foreground flex items-center gap-2 hover:text-primary transition-colors text-left"
                            >
                              <Home className="h-4 w-4 text-primary" />
                              <span className="underline decoration-dotted underline-offset-2">
                                {parentProfile.neighborhood}
                              </span>
                            </button>
                          ) : (
                            <p className="text-foreground flex items-center gap-2">
                              <Home className="h-4 w-4 text-primary" />
                              <span className="text-muted-foreground italic">Not set</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
              
              {/* Toggle button at bottom - like milestones */}
              <CardContent className="pt-0 pb-4">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center gap-2"
                  >
                    {profileExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show details
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </CardContent>
            </Collapsible>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link to="/">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Activities
                </Link>
              </Button>
              {userType === "parent" ? (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      document.getElementById('children-section')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Manage Children
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/find-parents">
                      <Users className="h-4 w-4 mr-2" />
                      Find Parents
                    </Link>
                  </Button>
                  <InviteParentDialog>
                    <Button variant="outline" className="w-full justify-start">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Parents
                    </Button>
                  </InviteParentDialog>
                </>
              ) : (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/onboarding">
                    <Edit className="h-4 w-4 mr-2" />
                    Complete Business Profile
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Your Network */}
        {userType === "parent" && (
          <div className="mb-6">
            <SocialConnectionsCard />
          </div>
        )}

        {/* Coordination Feed for planning with others */}
        {userType === "parent" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Coordination
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CoordinationFeed />
            </CardContent>
          </Card>
        )}

        {/* My Saved Activities */}
        {userType === "parent" && (
          <div className="mb-6">
            <SavedActivitiesSection />
          </div>
        )}

        {/* Children Profiles */}
        {userType === "parent" && (
          <div id="children-section">
              <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Children Profiles
                </CardTitle>
                <AddChildForm onChildAdded={refetchChildren} />
              </CardHeader>
              <CardContent>
                {childrenLoading ? (
                  <div className="animate-pulse">
                    <div className="h-20 bg-muted rounded mb-4"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ) : children.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child) => (
                      <Card key={child.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{child.first_name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {child.age} years old
                            </p>
                          </div>
                          <EditChildDialog child={child} onChildUpdated={refetchChildren} />
                        </div>
                        
                        {child.interests && child.interests.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Interests</p>
                            <div className="flex flex-wrap gap-1">
                              {child.interests.slice(0, 3).map((interest) => (
                                <Badge key={interest} variant="secondary" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                              {child.interests.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{child.interests.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {(child.allergies || child.special_needs) && (
                          <div className="text-xs text-muted-foreground">
                            {child.allergies && <p>Allergies: {child.allergies}</p>}
                            {child.special_needs && <p>Special needs: {child.special_needs}</p>}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No children profiles yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your children's information to get personalized activity recommendations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {userType === "provider" && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Business Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Complete your business profile</h3>
                  <p className="text-muted-foreground mb-4">
                    Add more details about your services to attract more families
                  </p>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Complete Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;