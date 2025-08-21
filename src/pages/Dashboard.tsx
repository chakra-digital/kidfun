import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useChildren } from "@/hooks/useChildren";
import { useGameifiedProgress } from "@/hooks/useGameifiedProgress";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Phone, Mail, Users, Edit, Plus, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import AddChildForm from "@/components/children/AddChildForm";
import { EditChildDialog } from "@/components/children/EditChildDialog";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { GameifiedProgress } from "@/components/progress/GameifiedProgress";

const Dashboard = () => {
  const { user } = useAuth();
  const { userProfile, loading } = useUserProfile();
  const { children, loading: childrenLoading, refetch: refetchChildren } = useChildren();
  const { progress } = useGameifiedProgress();

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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto py-8">
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
          <GameifiedProgress progress={progress} compact />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <EditProfileDialog />
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link to="/activities">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Activities
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/camps">
                  <Users className="h-4 w-4 mr-2" />
                  Find Camps
                </Link>
              </Button>
              {userType === "parent" ? (
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

        {userType === "parent" && (
          <div id="children-section" className="mt-8">
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