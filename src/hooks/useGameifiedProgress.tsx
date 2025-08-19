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
  const { userProfile } = useUserProfile();
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

  const milestones: ProgressMilestone[] = [
    {
      id: "profile_complete",
      title: "Complete Your Profile",
      description: "Add your personal information and preferences",
      completed: !!(userProfile?.first_name && userProfile?.last_name && userProfile?.phone),
      icon: "User",
      points: 10,
    },
    {
      id: "add_child",
      title: "Add Your First Child",
      description: "Create a profile for your child with their interests",
      completed: children.length > 0,
      icon: "Heart",
      points: 15,
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
  
  // Calculate progress: first 2 milestones (profile + child) = 40% of total journey
  // Remaining 4 milestones = 60% of total journey
  let progressPercentage = 0;
  const firstTwoCompleted = Math.min(completedCount, 2);
  const remainingCompleted = Math.max(0, completedCount - 2);
  
  progressPercentage = (firstTwoCompleted * 20) + (remainingCompleted * 15);
  progressPercentage = Math.min(progressPercentage, 100);

  const progress: GameifiedProgress = {
    milestones,
    totalPoints,
    completedCount,
    progressPercentage,
  };

  return { progress, loading };
};