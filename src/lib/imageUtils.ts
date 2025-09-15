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
export function generateProviderIcon(businessName: string, specialties?: string[], providerId?: string): string {
  // Create multiple hash variations for better uniqueness
  const createHash = (str: string, seed: number = 0) => {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char + seed;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  // Use multiple identifiers to ensure uniqueness
  const identifier = `${businessName}-${providerId || ''}-${specialties?.join('') || ''}`;
  const primaryHash = createHash(identifier);
  const secondaryHash = createHash(identifier, 7919); // Prime number seed
  const tertiaryHash = createHash(identifier, 1009); // Another prime seed

  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', 
    '#F59E0B', '#06B6D4', '#6366F1', '#EF4444',
    '#14B8A6', '#F97316', '#84CC16', '#A855F7',
    '#EAB308', '#F43F5E', '#06B6D4', '#8B5A2B'
  ];
  
  const bgColors = [
    '#EFF6FF', '#ECFDF5', '#F3E8FF', '#FDF2F8',
    '#FFFBEB', '#ECFEFF', '#EEF2FF', '#FEF2F2',
    '#F0FDFA', '#FFF7ED', '#F7FEE7', '#FAF5FF',
    '#FEFCE8', '#FDF2F8', '#ECFEFF', '#FDF6E3'
  ];
  
  // Varied patterns inspired by WhatsApp-style illustrations
  const patterns = [
    // Circle with dots
    `<circle cx="50" cy="50" r="20" fill="COLOR_PLACEHOLDER" opacity="0.2"/>
     <circle cx="40" cy="40" r="3" fill="COLOR_PLACEHOLDER"/>
     <circle cx="60" cy="35" r="2" fill="COLOR_PLACEHOLDER"/>
     <circle cx="45" cy="60" r="2.5" fill="COLOR_PLACEHOLDER"/>
     <circle cx="65" cy="55" r="1.5" fill="COLOR_PLACEHOLDER"/>`,
    
    // Layered shapes
    `<rect x="30" y="30" width="40" height="40" fill="COLOR_PLACEHOLDER" opacity="0.3" rx="8"/>
     <circle cx="45" cy="45" r="8" fill="COLOR_PLACEHOLDER" opacity="0.8"/>
     <rect x="55" y="35" width="10" height="30" fill="COLOR_PLACEHOLDER" opacity="0.6" rx="3"/>`,
    
    // Scattered elements
    `<polygon points="30,40 40,25 50,40" fill="COLOR_PLACEHOLDER" opacity="0.7"/>
     <circle cx="60" cy="35" r="5" fill="COLOR_PLACEHOLDER" opacity="0.5"/>
     <rect x="25" y="55" width="15" height="10" fill="COLOR_PLACEHOLDER" opacity="0.6" rx="2"/>
     <polygon points="65,60 75,55 70,70" fill="COLOR_PLACEHOLDER" opacity="0.4"/>`,
    
    // Lines and curves pattern
    `<path d="M25,30 Q40,20 55,30 T75,40" stroke="COLOR_PLACEHOLDER" stroke-width="3" fill="none" opacity="0.7"/>
     <circle cx="30" cy="50" r="4" fill="COLOR_PLACEHOLDER" opacity="0.8"/>
     <circle cx="50" cy="60" r="3" fill="COLOR_PLACEHOLDER" opacity="0.6"/>
     <circle cx="70" cy="45" r="5" fill="COLOR_PLACEHOLDER" opacity="0.5"/>`,
    
    // Grid pattern
    `<rect x="25" y="25" width="12" height="12" fill="COLOR_PLACEHOLDER" opacity="0.3" rx="2"/>
     <rect x="44" y="25" width="12" height="12" fill="COLOR_PLACEHOLDER" opacity="0.6" rx="2"/>
     <rect x="63" y="25" width="12" height="12" fill="COLOR_PLACEHOLDER" opacity="0.4" rx="2"/>
     <rect x="25" y="44" width="12" height="12" fill="COLOR_PLACEHOLDER" opacity="0.7" rx="2"/>
     <rect x="44" y="44" width="12" height="12" fill="COLOR_PLACEHOLDER" opacity="0.5" rx="2"/>
     <rect x="63" y="44" width="12" height="12" fill="COLOR_PLACEHOLDER" opacity="0.8" rx="2"/>
     <rect x="25" y="63" width="12" height="12" fill="COLOR_PLACEHOLDER" opacity="0.4" rx="2"/>
     <rect x="44" y="63" width="12" height="12" fill="COLOR_PLACEHOLDER" opacity="0.6" rx="2"/>
     <rect x="63" y="63" width="12" height="12" fill="COLOR_PLACEHOLDER" opacity="0.5" rx="2"/>`,
    
    // Organic shapes
    `<path d="M30,40 C25,35 25,45 30,50 C35,55 45,55 50,50 C55,45 55,35 50,30 C45,25 35,25 30,40z" fill="COLOR_PLACEHOLDER" opacity="0.4"/>
     <circle cx="60" cy="35" r="6" fill="COLOR_PLACEHOLDER" opacity="0.7"/>
     <ellipse cx="40" cy="65" rx="8" ry="5" fill="COLOR_PLACEHOLDER" opacity="0.6"/>`,
     
    // Constellation pattern
    `<circle cx="35" cy="30" r="2" fill="COLOR_PLACEHOLDER"/>
     <circle cx="55" cy="25" r="1.5" fill="COLOR_PLACEHOLDER"/>
     <circle cx="45" cy="40" r="2.5" fill="COLOR_PLACEHOLDER"/>
     <circle cx="65" cy="45" r="2" fill="COLOR_PLACEHOLDER"/>
     <circle cx="30" cy="55" r="1.5" fill="COLOR_PLACEHOLDER"/>
     <circle cx="60" cy="65" r="3" fill="COLOR_PLACEHOLDER"/>
     <line x1="35" y1="30" x2="55" y2="25" stroke="COLOR_PLACEHOLDER" stroke-width="1" opacity="0.5"/>
     <line x1="45" y1="40" x2="65" y2="45" stroke="COLOR_PLACEHOLDER" stroke-width="1" opacity="0.5"/>
     <line x1="30" y1="55" x2="60" y2="65" stroke="COLOR_PLACEHOLDER" stroke-width="1" opacity="0.5"/>`,
     
    // Geometric mix
    `<polygon points="40,25 50,35 40,45 30,35" fill="COLOR_PLACEHOLDER" opacity="0.6"/>
     <rect x="55" y="30" width="15" height="8" fill="COLOR_PLACEHOLDER" opacity="0.4" rx="2"/>
     <circle cx="35" cy="60" r="7" fill="COLOR_PLACEHOLDER" opacity="0.5"/>
     <polygon points="60,55 68,60 60,70 52,65" fill="COLOR_PLACEHOLDER" opacity="0.7"/>`
  ];
  
  // Use different hash variations for color selection to avoid patterns
  const colorIndex = (primaryHash + secondaryHash) % colors.length;
  const bgColorIndex = (secondaryHash + tertiaryHash) % bgColors.length;
  const patternIndex = (primaryHash * 3 + tertiaryHash * 7) % patterns.length;
  
  const color = colors[colorIndex];
  const bgColor = bgColors[bgColorIndex];
  
  const pattern = patterns[patternIndex].replace(/COLOR_PLACEHOLDER/g, color);
  
  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="${bgColor}" rx="16"/>
    ${pattern}
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}