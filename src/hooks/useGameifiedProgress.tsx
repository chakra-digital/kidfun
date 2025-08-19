import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useChildren } from "@/hooks/useChildren";
import { supabase } from "@/integrations/supabase/client";

export interface ProgressMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: string;
  points: number;
}

export interface GameifiedProgress {
  milestones: ProgressMilestone[];
  totalPoints: number;
  completedCount: number;
  progressPercentage: number;
}

export const useGameifiedProgress = () => {
  const { user } = useAuth();
  const { userProfile, parentProfile } = useUserProfile();
  const { children } = useChildren();
  const [savedProviders, setSavedProviders] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check for saved providers (placeholder - you'll implement this when provider saving is added)
  useEffect(() => {
    const checkSavedProviders = async () => {
      if (!user) return;
      
      try {
        // This would be replaced with actual saved providers query
        // For now, we'll set it to 0
        setSavedProviders(0);
      } catch (error) {
        console.error("Error checking saved providers:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSavedProviders();
  }, [user]);

  // Check onboarding completion status based on user type
  const isParent = !!parentProfile;
  const hasCompletedOnboarding = isParent 
    ? !!(userProfile?.first_name && userProfile?.last_name && children.length > 0)
    : !!(userProfile?.first_name && userProfile?.last_name);

  const milestones: ProgressMilestone[] = [
    {
      id: "account_created",
      title: "Account Created",
      description: "Successfully created and verified your KidFun account",
      completed: !!(userProfile?.first_name && userProfile?.last_name),
      icon: "User",
      points: 10,
    },
    {
      id: "onboarding_step1",
      title: "Set Your Location", 
      description: "Tell us where you're located and your preferences",
      completed: hasCompletedOnboarding,
      icon: "MapPin",
      points: 15,
    },
    {
      id: "onboarding_step2",
      title: "Emergency Contact",
      description: "Add emergency contact information for safety",
      completed: hasCompletedOnboarding,
      icon: "User", 
      points: 15,
    },
    {
      id: "onboarding_step3",
      title: "Child Profiles",
      description: "Create profiles for your children with their interests",
      completed: isParent ? (hasCompletedOnboarding && children.length > 0) : hasCompletedOnboarding,
      icon: "Heart",
      points: 20,
    },
    {
      id: "save_provider",
      title: "Save Your First Provider",
      description: "Find and save a provider you're interested in",
      completed: savedProviders > 0,
      icon: "Bookmark",
      points: 20,
    },
    {
      id: "book_activity",
      title: "Book Your First Activity",
      description: "Complete your first booking with a provider",
      completed: false, // Will be implemented when booking system is added
      icon: "Calendar",
      points: 25,
    },
    {
      id: "invite_friend",
      title: "Invite Another Parent",
      description: "Share KidFun with friends and grow the community",
      completed: false, // Will be implemented when referral system is added
      icon: "Users",
      points: 15,
    },
    {
      id: "first_message",
      title: "Send Your First Message",
      description: "Connect with a provider through messaging",
      completed: false, // Will be implemented when messaging is added
      icon: "MessageCircle",
      points: 10,
    },
  ];

  const completedMilestones = milestones.filter(m => m.completed);
  const totalPoints = completedMilestones.reduce((sum, m) => sum + m.points, 0);
  const completedCount = completedMilestones.length;
  
  // Calculate progress: first 4 milestones (onboarding) = 60% of total journey
  // Remaining milestones = 40% of total journey  
  let progressPercentage = 0;
  const onboardingCompleted = Math.min(completedCount, 4);
  const remainingCompleted = Math.max(0, completedCount - 4);
  
  progressPercentage = (onboardingCompleted * 15) + (remainingCompleted * 10);
  progressPercentage = Math.min(progressPercentage, 100);

  const progress: GameifiedProgress = {
    milestones,
    totalPoints,
    completedCount,
    progressPercentage,
  };

  return { progress, loading };
};