// Static placeholder images based on activity categories
// Multiple options per category for variety
export const PLACEHOLDER_IMAGES: Record<string, string[]> = {
  // Sports & Athletics
  soccer: [
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400',
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400',
  ],
  basketball: [
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
    'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400',
  ],
  swimming: [
    'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=400',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400',
  ],
  tennis: ['https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400'],
  baseball: ['https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400'],
  volleyball: ['https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400'],
  gymnastics: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400'],
  martial_arts: [
    'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400',
    'https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?w=400',
  ],
  dance: [
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
    'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400',
  ],
  yoga: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'],
  
  // Arts & Creative - Multiple options for variety
  art: [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    'https://images.unsplash.com/photo-1456086272160-b28b0645b729?w=400',
  ],
  painting: [
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
    'https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5?w=400',
    'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=400',
  ],
  pottery: [
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400',
    'https://images.unsplash.com/photo-1583225214464-9296029427aa?w=400',
  ],
  ceramics: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400'],
  music: [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400',
  ],
  theater: ['https://images.unsplash.com/photo-1503095396549-807759245b35?w=400'],
  drama: ['https://images.unsplash.com/photo-1503095396549-807759245b35?w=400'],
  crafts: [
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400',
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400',
  ],
  
  // STEM & Education
  science: [
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
    'https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=400',
  ],
  coding: ['https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400'],
  robotics: ['https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400'],
  math: ['https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400'],
  
  // Outdoor & Adventure
  camping: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400'],
  hiking: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=400'],
  nature: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400'],
  outdoor: ['https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400'],
  
  // General fallback
  default: [
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
  ],
};

// Map common keywords to placeholder categories
// IMPORTANT: Order matters! More specific matches should come first
const KEYWORD_TO_CATEGORY: Record<string, string> = {
  // Martial Arts - MUST come before 'arts' to avoid wrong matching
  'martial arts': 'martial_arts',
  'martial art': 'martial_arts',
  'karate': 'martial_arts',
  'taekwondo': 'martial_arts',
  'judo': 'martial_arts',
  'jiu-jitsu': 'martial_arts',
  'jiujitsu': 'martial_arts',
  'kung fu': 'martial_arts',
  'kickboxing': 'martial_arts',
  'boxing': 'martial_arts',
  'mma': 'martial_arts',
  'self defense': 'martial_arts',
  'self-defense': 'martial_arts',
  
  // Sports variations
  'football': 'soccer',
  'futbol': 'soccer',
  'hoops': 'basketball',
  'swim': 'swimming',
  'pool': 'swimming',
  'ballet': 'dance',
  'hip hop': 'dance',
  'hip-hop': 'dance',
  'contemporary': 'dance',
  
  // Arts & Crafts variations (after martial arts)
  'arts and crafts': 'crafts',
  'arts & crafts': 'crafts',
  'drawing': 'art',
  'painting': 'painting',
  'sculpture': 'art',
  'clay': 'pottery',
  'piano': 'music',
  'guitar': 'music',
  'violin': 'music',
  'singing': 'music',
  'acting': 'theater',
  
  // STEM variations
  'programming': 'coding',
  'computer': 'coding',
  'engineering': 'robotics',
  'stem': 'science',
  
  // Outdoor variations
  'camp': 'camping',
  'trail': 'hiking',
  'adventure': 'outdoor',
};

// Simple hash function to convert string to number (for deterministic selection)
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getPlaceholderImage(businessName: string, specialties: string[] = [], description?: string): string {
  const searchText = `${businessName} ${specialties.join(' ')} ${description || ''}`.toLowerCase();
  
  // Create unique hash from business name + location (if in business name) + first specialty
  // This ensures same businesses with different locations get different images
  const uniqueKey = `${businessName.toLowerCase()}_${specialties[0] || 'default'}`;
  
  // First, try to match multi-word phrases (more specific)
  // Sort by length descending to match longer phrases first
  const sortedKeywords = Object.entries(KEYWORD_TO_CATEGORY)
    .sort(([a], [b]) => b.length - a.length);
  
  for (const [keyword, category] of sortedKeywords) {
    if (searchText.includes(keyword)) {
      const images = PLACEHOLDER_IMAGES[category];
      // Use unique key (name + specialty) to ensure variety
      const index = simpleHash(uniqueKey) % images.length;
      return images[index];
    }
  }
  
  // Try direct category match from the main PLACEHOLDER_IMAGES
  for (const category of Object.keys(PLACEHOLDER_IMAGES)) {
    if (category !== 'default' && searchText.includes(category.replace('_', ' '))) {
      const images = PLACEHOLDER_IMAGES[category];
      const index = simpleHash(uniqueKey) % images.length;
      return images[index];
    }
  }
  
  // Default fallback with variety
  const defaultImages = PLACEHOLDER_IMAGES.default;
  const index = simpleHash(uniqueKey) % defaultImages.length;
  return defaultImages[index];
}
