import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGameifiedProgress } from "@/hooks/useGameifiedProgress";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ParentOnboarding } from "@/components/onboarding/ParentOnboarding";
import { ProviderOnboarding } from "@/components/onboarding/ProviderOnboarding";
import { GameifiedProgress } from "@/components/progress/GameifiedProgress";

const Onboarding = () => {
  const { user, loading } = useAuth();
  const { progress } = useGameifiedProgress();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [userType, setUserType] = useState<"parent" | "provider" | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      setIsLoading(true);
      return;
    }

    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    // Get user type from URL params or fetch from profile
    const typeFromUrl = searchParams.get("type") as "parent" | "provider" | null;
    
    if (typeFromUrl) {
      setUserType(typeFromUrl);
      setIsLoading(false);
    } else {
      // Fetch user profile to get type
      fetchUserProfile();
    }
  }, [user, loading, searchParams, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (profile?.user_type) {
        setUserType(profile.user_type);
      } else {
        // If no user type found, redirect back to auth
        toast({
          title: "Profile not found",
          description: "Please sign up again to complete onboarding.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Unable to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      // Send welcome email after successful onboarding
      await supabase.functions.invoke('send-welcome-email', {
        body: { 
          userId: user?.id,
          userType: userType 
        }
      });
      
      toast({
        title: "Welcome to KidFun!",
        description: "Your profile has been set up successfully. Check your email for next steps!",
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      toast({
        title: "Profile Complete!",
        description: "Your profile has been set up successfully.",
      });
    }
    navigate("/");
  };

  const handleSkip = () => {
    navigate("/");
  };

  // Show loading immediately while auth is loading or while fetching profile
  if (loading || isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading your profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="mb-4">Unable to determine account type.</p>
              <Button onClick={() => navigate("/auth")}>Back to Sign In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSteps = userType === "parent" ? 5 : 5;
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="text-3xl transform scale-x-[-1]">🏃‍♀️</div>
              <span className="text-2xl font-bold text-primary">KidFun</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to KidFun!
            </h1>
            <p className="text-muted-foreground">
              Let's set up your {userType} profile to get personalized recommendations
            </p>
          </div>

          {/* Gamified Progress */}
          <div className="mb-8">
            <GameifiedProgress progress={progress} compact />
          </div>

          {/* Onboarding Content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {userType === "parent" ? "Parent Profile Setup" : "Provider Profile Setup"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userType === "parent" ? (
                <ParentOnboarding
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                />
              ) : (
                <ProviderOnboarding
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                />
              )}
            </CardContent>
          </Card>

          {/* Skip Option */}
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip for now, I'll complete this later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;