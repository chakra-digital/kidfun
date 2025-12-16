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
  actionLink?: string; // Optional route to complete this milestone
}

export interface GameifiedProgress {
  milestones: ProgressMilestone[];
  totalPoints: number;
  completedCount: number;
  progressPercentage: number;
}

export const useGameifiedProgress = () => {
  const { user } = useAuth();
  const { userProfile, parentProfile, providerProfile } = useUserProfile();
  const { children } = useChildren();
  const [savedActivitiesCount, setSavedActivitiesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check for saved activities from the saved_activities table
  useEffect(() => {
    const checkSavedActivities = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { count, error } = await supabase
          .from("saved_activities")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        if (error) throw error;
        setSavedActivitiesCount(count || 0);
      } catch (error) {
        console.error("Error checking saved activities:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSavedActivities();
  }, [user]);

  // Check onboarding completion status based on user type
  const userType = userProfile?.user_type || user?.user_metadata?.user_type;
  const isParent = userType === "parent";
  const hasCompletedBasicOnboarding = !!(userProfile?.first_name && userProfile?.last_name);
  const hasCompletedParentOnboarding = isParent && hasCompletedBasicOnboarding && 
    !!(parentProfile?.location && parentProfile?.emergency_contact_name && parentProfile?.emergency_contact_phone && children.length > 0);

  // Only count as having started onboarding if they have parent-specific data (location) or provider-specific completion
  const hasStartedOnboarding = isParent ? !!(parentProfile?.location) : hasCompletedBasicOnboarding;

  // Different milestone sets for parents vs providers
  const parentMilestones: ProgressMilestone[] = [
    {
      id: "account_created",
      title: "Account Created",
      description: "Successfully created and verified your KidFun account",
      completed: !!user, // User exists = account created and verified
      icon: "User",
      points: 10,
    },
    {
      id: "personal_info",
      title: "Add Personal Information",
      description: "Add your name and contact details",
      completed: hasStartedOnboarding && !!(userProfile?.first_name && userProfile?.last_name),
      icon: "UserCheck",
      points: 10,
      actionLink: "/onboarding",
    },
    {
      id: "location_preferences",
      title: "Set Location & Preferences",
      description: "Add your location and activity preferences",
      completed: hasStartedOnboarding && !!(parentProfile?.location),
      icon: "MapPin",
      points: 10,
      actionLink: "/onboarding",
    },
    {
      id: "emergency_contact",
      title: "Add Emergency Contact",
      description: "Provide emergency contact information",
      completed: hasStartedOnboarding && !!(parentProfile?.emergency_contact_name && parentProfile?.emergency_contact_phone),
      icon: "Phone",
      points: 10,
      actionLink: "/onboarding",
    },
    {
      id: "add_child",
      title: "Add Your First Child",
      description: "Create a profile for your child with their interests",
      completed: hasStartedOnboarding && children.length > 0,
      icon: "Heart",
      points: 15,
      actionLink: "/onboarding",
    },
    {
      id: "explore_activities",
      title: "Explore Activities",
      description: "Browse available activities and programs",
      completed: savedActivitiesCount > 0, // If they've saved something, they've explored
      icon: "Search",
      points: 10,
      actionLink: "/",
    },
    {
      id: "save_provider",
      title: "Save Your First Provider",
      description: "Find and save a provider you're interested in",
      completed: savedActivitiesCount > 0,
      icon: "Bookmark",
      points: 15,
      actionLink: "/",
    },
    {
      id: "book_activity",
      title: "Book Your First Activity",
      description: "Complete your first booking with a provider",
      completed: false, // Will be implemented when booking system is added
      icon: "Calendar",
      points: 20,
      actionLink: "/",
    },
    {
      id: "leave_review",
      title: "Leave Your First Review",
      description: "Share feedback about an activity or provider",
      completed: false, // Will be implemented when review system is added
      icon: "Star",
      points: 15,
    },
    {
      id: "invite_friend",
      title: "Invite Another Parent",
      description: "Share KidFun with friends and grow the community",
      completed: false, // Will be implemented when referral system is added
      icon: "Users",
      points: 15,
    },
  ];

  const providerMilestones: ProgressMilestone[] = [
    {
      id: "account_created",
      title: "Account Created",
      description: "Successfully created and verified your KidFun account",
      completed: !!user, // User exists = account created and verified
      icon: "User",
      points: 10,
    },
    {
      id: "personal_info",
      title: "Add Personal Information",
      description: "Add your name and contact details",
      completed: !!(userProfile?.first_name && userProfile?.last_name),
      icon: "UserCheck",
      points: 10,
    },
    {
      id: "business_info",
      title: "Business Information",
      description: "Add your business name, location, and description",
      completed: !!(providerProfile?.business_name && providerProfile?.location),
      icon: "Building",
      points: 10,
    },
    {
      id: "services_specialties",
      title: "Services & Specialties",
      description: "Define your age groups, specialties, and capacity",
      completed: !!(providerProfile?.age_groups?.length && providerProfile?.specialties?.length),
      icon: "Users",
      points: 10,
    },
    {
      id: "pricing_model",
      title: "Pricing & Availability",
      description: "Set your pricing model and rates",
      completed: !!(providerProfile?.pricing_model && providerProfile?.base_price),
      icon: "DollarSign",
      points: 10,
    },
    {
      id: "facilities_amenities",
      title: "Facilities & Amenities",
      description: "Highlight your facility features and amenities",
      completed: !!providerProfile, // Completed if provider profile exists (amenities are optional)
      icon: "MapPin",
      points: 10,
    },
    {
      id: "credentials",
      title: "Credentials & Experience",
      description: "Add your experience and professional credentials",
      completed: !!(providerProfile && providerProfile.years_experience !== null && providerProfile.years_experience !== undefined),
      icon: "Shield",
      points: 10,
    },
    {
      id: "program_photos",
      title: "Add Program Photos",
      description: "Upload photos to showcase your programs",
      completed: false, // Will be implemented when photo upload is added
      icon: "Camera",
      points: 15,
    },
    {
      id: "first_booking",
      title: "Receive Your First Booking",
      description: "Get booked by your first family",
      completed: false, // Will be implemented when booking system is added
      icon: "Calendar",
      points: 20,
    },
    {
      id: "first_review",
      title: "Get Your First Review",
      description: "Receive feedback from a satisfied family",
      completed: false, // Will be implemented when review system is added
      icon: "Star",
      points: 15,
    },
  ];

  const milestones = isParent ? parentMilestones : providerMilestones;

  const completedMilestones = milestones.filter(m => m.completed);
  const totalPoints = completedMilestones.reduce((sum, m) => sum + m.points, 0);
  const completedCount = completedMilestones.length;
  
  // Calculate progress as simple percentage: completed milestones / total milestones * 100
  const progressPercentage = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  const progress: GameifiedProgress = {
    milestones,
    totalPoints,
    completedCount,
    progressPercentage,
  };

  return { progress, loading };
};