// Static placeholder images based on activity categories
// These are free, fast, and provide a consistent visual experience

export const PLACEHOLDER_IMAGES: Record<string, string> = {
  // Sports & Athletics
  soccer: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
  swimming: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=400',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400',
  baseball: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400',
  volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400',
  gymnastics: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
  martial_arts: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400',
  dance: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
  
  // Arts & Creative
  art: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
  painting: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
  pottery: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400',
  ceramics: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400',
  music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
  theater: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400',
  drama: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400',
  crafts: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400',
  
  // STEM & Education
  science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
  coding: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
  robotics: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400',
  math: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
  
  // Outdoor & Adventure
  camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
  hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
  nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  outdoor: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400',
  
  // General fallback
  default: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
};

// Map common keywords to placeholder categories
const KEYWORD_TO_CATEGORY: Record<string, string> = {
  // Sports variations
  'football': 'soccer',
  'futbol': 'soccer',
  'hoops': 'basketball',
  'swim': 'swimming',
  'pool': 'swimming',
  'karate': 'martial_arts',
  'taekwondo': 'martial_arts',
  'judo': 'martial_arts',
  'ballet': 'dance',
  'hip hop': 'dance',
  'contemporary': 'dance',
  
  // Arts variations
  'drawing': 'art',
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

export function getPlaceholderImage(businessName: string, specialties: string[] = [], description?: string): string {
  const searchText = `${businessName} ${specialties.join(' ')} ${description || ''}`.toLowerCase();
  
  // Try to match keywords to categories
  for (const [keyword, category] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (searchText.includes(keyword)) {
      return PLACEHOLDER_IMAGES[category];
    }
  }
  
  // Try direct category match
  for (const category of Object.keys(PLACEHOLDER_IMAGES)) {
    if (searchText.includes(category)) {
      return PLACEHOLDER_IMAGES[category];
    }
  }
  
  // Default fallback
  return PLACEHOLDER_IMAGES.default;
}
