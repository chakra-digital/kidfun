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
 * Generate a clean SVG icon pattern for providers
 */
export function generateProviderIcon(businessName: string, specialties?: string[]): string {
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const hash = hashCode(businessName);
  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', 
    '#F59E0B', '#06B6D4', '#6366F1', '#EF4444'
  ];
  
  const bgColors = [
    '#EFF6FF', '#ECFDF5', '#F3E8FF', '#FDF2F8',
    '#FFFBEB', '#ECFEFF', '#EEF2FF', '#FEF2F2'
  ];
  
  const color = colors[hash % colors.length];
  const bgColor = bgColors[hash % bgColors.length];
  
  // Simple geometric patterns
  const patterns = [
    // Circle
    `<circle cx="50" cy="50" r="25" fill="${color}" opacity="0.8"/>`,
    // Triangle
    `<polygon points="50,25 75,75 25,75" fill="${color}" opacity="0.8"/>`,
    // Square
    `<rect x="25" y="25" width="50" height="50" fill="${color}" opacity="0.8" rx="8"/>`,
    // Star
    `<polygon points="50,15 55,35 75,35 60,50 65,70 50,60 35,70 40,50 25,35 45,35" fill="${color}" opacity="0.8"/>`,
    // Diamond
    `<polygon points="50,20 70,50 50,80 30,50" fill="${color}" opacity="0.8"/>`,
    // Heart
    `<path d="M50,75 C35,55 20,45 20,30 C20,20 30,15 40,20 C45,15 55,15 60,20 C70,15 80,20 80,30 C80,45 65,55 50,75z" fill="${color}" opacity="0.8"/>`
  ];
  
  const pattern = patterns[hash % patterns.length];
  
  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="${bgColor}" rx="16"/>
    ${pattern}
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}