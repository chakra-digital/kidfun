import React from "react";
import { 
  Palette, 
  Code, 
  Dumbbell, 
  Music, 
  Camera, 
  TreePine, 
  Waves, 
  BookOpen, 
  Rocket,
  Heart,
  Star,
  Sparkles,
  Trophy,
  Target,
  Compass,
  Flower,
  Sun,
  Moon,
  Smile
} from "lucide-react";

// Clean, fun icons for different activity types
const iconMap = {
  art: Palette,
  arts: Palette,
  craft: Palette,
  creative: Palette,
  design: Palette,
  painting: Palette,
  
  code: Code,
  coding: Code,
  tech: Code,
  technology: Code,
  computer: Code,
  programming: Code,
  stem: Rocket,
  science: Rocket,
  
  sport: Dumbbell,
  sports: Dumbbell,
  soccer: Target,
  football: Target,
  basketball: Trophy,
  athletic: Dumbbell,
  fitness: Dumbbell,
  
  music: Music,
  dance: Music,
  singing: Music,
  instrument: Music,
  
  photography: Camera,
  photo: Camera,
  
  nature: TreePine,
  outdoor: TreePine,
  hiking: Compass,
  camping: TreePine,
  forest: TreePine,
  
  swimming: Waves,
  water: Waves,
  pool: Waves,
  
  reading: BookOpen,
  book: BookOpen,
  literacy: BookOpen,
  
  adventure: Compass,
  exploration: Compass,
  quest: Compass,
};

// Fallback icons for variety
const fallbackIcons = [Heart, Star, Sparkles, Flower, Sun, Moon, Smile];

// Color palette for clean, kid-friendly colors
const colorPalettes = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600", 
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-orange-100 text-orange-600",
  "bg-cyan-100 text-cyan-600",
  "bg-indigo-100 text-indigo-600",
  "bg-rose-100 text-rose-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
];

interface ProviderIconProps {
  businessName: string;
  specialties?: string[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProviderIcon({ businessName, specialties = [], className = "", size = "md" }: ProviderIconProps) {
  // Create a consistent hash from business name
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  const hash = hashCode(businessName);
  
  // Find matching icon based on business name and specialties
  const searchText = `${businessName} ${specialties.join(' ')}`.toLowerCase();
  let IconComponent = null;
  
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (searchText.includes(keyword)) {
      IconComponent = icon;
      break;
    }
  }
  
  // If no match, use a fallback icon based on hash
  if (!IconComponent) {
    IconComponent = fallbackIcons[hash % fallbackIcons.length];
  }
  
  // Get consistent color palette
  const colorClass = colorPalettes[hash % colorPalettes.length];
  
  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8 p-1.5",
    md: "w-12 h-12 p-2.5", 
    lg: "w-16 h-16 p-3.5"
  };
  
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClass} rounded-xl flex items-center justify-center ${className}`}>
      <IconComponent className={iconSizes[size]} />
    </div>
  );
}

export default ProviderIcon;