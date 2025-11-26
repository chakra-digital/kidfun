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
 * Additional params are for potential future use but identifier is used for selection
 */
export function getProviderImage(identifier: string, specialties?: string[], websiteUrl?: string | null): string {
  const hash = simpleHash(identifier);
  const imageIndex = hash % activityImages.length;
  return activityImages[imageIndex];
}

/**
 * Generate fun emoji-based provider avatars
 */
export function generateProviderIcon(businessName: string, specialties?: string[], providerId?: string): string {
  // Simple hash function for consistency
  function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Emoji sets for different activity types
  const emojiSets = {
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🏑', '🥍', '🏊‍♀️', '🏃‍♂️', '🚴‍♀️', '⛷️', '🏄‍♂️'],
    arts: ['🎨', '🖌️', '✏️', '🖍️', '🎭', '🎪', '🎬', '📸', '🎵', '🎼', '🎹', '🎸', '🥁', '🎤', '🎺'],
    science: ['🔬', '⚗️', '🧪', '🔭', '🌍', '🌟', '⚡', '🔋', '💡', '🧬', '🦠', '🌡️', '⚖️', '🧲', '🚀'],
    nature: ['🌳', '🌿', '🌱', '🌺', '🦋', '🐛', '🐝', '🐞', '🦗', '🌻', '🍃', '🌲', '🌴', '🌵', '🍄'],
    cooking: ['👨‍🍳', '👩‍🍳', '🍳', '🥘', '🍰', '🧁', '🍪', '🥧', '🍕', '🥖', '🥞', '🧄', '🌶️', '🥄', '🍽️'],
    tech: ['💻', '🖥️', '📱', '⌨️', '🖱️', '🎮', '🕹️', '🤖', '⚙️', '🔧', '💾', '📡', '🌐', '💿', '📀'],
    reading: ['📚', '📖', '📝', '✍️', '📄', '📰', '📑', '🗞️', '📜', '📋', '📌', '📍', '🔖', '📕', '📗'],
    dance: ['💃', '🕺', '🩰', '👯‍♀️', '🎵', '🎶', '🎼', '🥁', '🎹', '🎸', '🎤', '🎺', '🎷', '🪘', '🔔'],
    water: ['🏊‍♀️', '🏊‍♂️', '🌊', '💧', '🐠', '🐟', '🐡', '🦈', '🐙', '🐚', '⛵', '🛥️', '🏄‍♀️', '🏄‍♂️', '🤽‍♀️'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🦆', '🐥']
  };

  // Default fun kid emojis
  const defaultEmojis = ['🎈', '🎉', '🎊', '🌈', '⭐', '✨', '🎯', '🎁', '🏆', '🎪', '🎠', '🎡', '🎢', '🎳', '🎲'];

  // Determine emoji set based on specialties and business name
  function getRelevantEmojis(): string[] {
    const text = `${businessName} ${specialties?.join(' ') || ''}`.toLowerCase();
    
    for (const [category, emojis] of Object.entries(emojiSets)) {
      const keywords = {
        sports: ['sport', 'soccer', 'football', 'basketball', 'tennis', 'swim', 'run', 'bike', 'ski', 'surf', 'gym', 'fitness', 'athletic'],
        arts: ['art', 'craft', 'paint', 'draw', 'music', 'sing', 'dance', 'theater', 'drama', 'creative', 'design'],
        science: ['science', 'stem', 'tech', 'robot', 'code', 'program', 'engineer', 'math', 'chemistry', 'physics', 'biology'],
        nature: ['nature', 'outdoor', 'garden', 'plant', 'forest', 'tree', 'environment', 'eco', 'wildlife', 'camping'],
        cooking: ['cook', 'bake', 'chef', 'kitchen', 'food', 'culinary', 'recipe', 'nutrition'],
        tech: ['computer', 'digital', 'coding', 'programming', 'robotics', 'technology', 'gaming'],
        reading: ['read', 'book', 'story', 'library', 'writing', 'literature', 'language'],
        dance: ['dance', 'ballet', 'hip hop', 'movement', 'choreography', 'rhythm'],
        water: ['swim', 'pool', 'water', 'aquatic', 'diving', 'surf', 'sailing'],
        animals: ['animal', 'pet', 'zoo', 'farm', 'wildlife', 'veterinary', 'dog', 'cat', 'horse']
      };

      if (keywords[category as keyof typeof keywords]?.some(keyword => text.includes(keyword))) {
        return emojis;
      }
    }
    
    return defaultEmojis;
  }

  const relevantEmojis = getRelevantEmojis();
  
  // Create unique identifier for consistent results
  const identifier = `${businessName}-${providerId || ''}-${specialties?.join('') || ''}`;
  const hash = simpleHash(identifier);
  
  // Select primary emoji
  const primaryEmojiIndex = hash % relevantEmojis.length;
  const primaryEmoji = relevantEmojis[primaryEmojiIndex];
  
  // Select 2-3 secondary emojis from the same set
  const secondaryEmojis = [];
  for (let i = 1; i <= 2; i++) {
    const secondaryIndex = (hash + i * 17) % relevantEmojis.length;
    if (secondaryIndex !== primaryEmojiIndex) {
      secondaryEmojis.push(relevantEmojis[secondaryIndex]);
    }
  }
  
  // Color palette - soft, kid-friendly colors
  const bgColors = [
    '#FEF7ED', '#FDF2F8', '#F0F9FF', '#F0FDF4', '#FFFBEB', 
    '#FAF5FF', '#F3E8FF', '#EFF6FF', '#ECFDF5', '#FEF3C7'
  ];
  
  const accentColors = [
    '#FB923C', '#F472B6', '#60A5FA', '#4ADE80', '#FBBF24',
    '#A78BFA', '#C084FC', '#3B82F6', '#10B981', '#F59E0B'
  ];
  
  const bgColorIndex = hash % bgColors.length;
  const accentColorIndex = (hash + 7) % accentColors.length;
  
  const bgColor = bgColors[bgColorIndex];
  const accentColor = accentColors[accentColorIndex];
  
  // Create SVG with emoji pattern
  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="${bgColor}" rx="16"/>
    <circle cx="50" cy="50" r="35" fill="${accentColor}" opacity="0.1"/>
    <text x="50" y="60" text-anchor="middle" font-size="32" font-family="system-ui">${primaryEmoji}</text>
    ${secondaryEmojis.map((emoji, i) => 
      `<text x="${25 + i * 50}" y="${25 + (i % 2) * 50}" text-anchor="middle" font-size="16" font-family="system-ui" opacity="0.6">${emoji}</text>`
    ).join('')}
  </svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}