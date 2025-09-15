// Import the available local images
import artDesignWorkshop from "@/assets/art-design-workshop.jpg";
import artsCraftsKids from "@/assets/arts-crafts-kids.jpg";
import kidsSoccerHeroBright from "@/assets/kids-soccer-hero-bright.jpg";
import kidsSoccerHero from "@/assets/kids-soccer-hero.jpg";
import scienceKids from "@/assets/science-kids.jpg";
import soccerKidsAction from "@/assets/soccer-kids-action.jpg";
import swimmingKids from "@/assets/swimming-kids.jpg";

// Array of available images
const activityImages = [
  artDesignWorkshop,
  artsCraftsKids,
  kidsSoccerHeroBright,
  kidsSoccerHero,
  scienceKids,
  soccerKidsAction,
  swimmingKids,
];

/**
 * Simple hash function to convert string to number
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a consistent unique image for a provider based on their ID or business name
 */
export function getProviderImage(identifier: string): string {
  const hash = simpleHash(identifier);
  const imageIndex = hash % activityImages.length;
  return activityImages[imageIndex];
}

/**
 * Get a themed image based on activity type keywords
 */
export function getThemedProviderImage(identifier: string, businessName?: string, specialties?: string[]): string {
  const searchText = `${businessName || ''} ${specialties?.join(' ') || ''}`.toLowerCase();
  
  // Theme-based image selection
  if (searchText.includes('soccer') || searchText.includes('sport') || searchText.includes('athletic')) {
    return Math.random() > 0.5 ? soccerKidsAction : kidsSoccerHero;
  }
  if (searchText.includes('art') || searchText.includes('craft') || searchText.includes('creative')) {
    return Math.random() > 0.5 ? artsCraftsKids : artDesignWorkshop;
  }
  if (searchText.includes('science') || searchText.includes('stem') || searchText.includes('tech')) {
    return scienceKids;
  }
  if (searchText.includes('swim') || searchText.includes('water') || searchText.includes('pool')) {
    return swimmingKids;
  }
  
  // Fall back to hash-based selection for consistent results
  return getProviderImage(identifier);
}