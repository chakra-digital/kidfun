import React from "react";
import { 
  Trophy, 
  Palette, 
  Microscope, 
  Waves, 
  ChefHat, 
  Music, 
  Theater,
  Swords
} from "lucide-react";

interface CategoryTileProps {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  onClick: () => void;
}

const CategoryTile = ({ icon, label, gradient, onClick }: CategoryTileProps) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden rounded-2xl p-6 text-white transition-all hover:scale-105 hover:shadow-xl"
    style={{ background: gradient }}
  >
    <div className="relative z-10 flex flex-col items-center gap-3">
      <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition-all group-hover:bg-white/30">
        {icon}
      </div>
      <span className="text-lg font-semibold text-white drop-shadow-md">{label}</span>
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
  </button>
);

interface CategoryTilesProps {
  onCategoryClick: (query: string) => void;
}

const CategoryTiles = ({ onCategoryClick }: CategoryTilesProps) => {
  const categories = [
    {
      icon: <Trophy className="h-8 w-8" />,
      label: "Sports",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      query: "sports activities for kids"
    },
    {
      icon: <Palette className="h-8 w-8" />,
      label: "Arts & Crafts",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      query: "arts and crafts classes for children"
    },
    {
      icon: <Microscope className="h-8 w-8" />,
      label: "STEM",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      query: "STEM science programs for kids"
    },
    {
      icon: <Waves className="h-8 w-8" />,
      label: "Swimming",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      query: "swimming lessons for children"
    },
    {
      icon: <ChefHat className="h-8 w-8" />,
      label: "Cooking",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      query: "cooking classes for kids"
    },
    {
      icon: <Music className="h-8 w-8" />,
      label: "Music",
      gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      query: "music lessons for children"
    },
    {
      icon: <Theater className="h-8 w-8" />,
      label: "Dance",
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      query: "dance classes for kids"
    },
    {
      icon: <Swords className="h-8 w-8" />,
      label: "Martial Arts",
      gradient: "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)",
      query: "martial arts for children"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <CategoryTile
          key={category.label}
          icon={category.icon}
          label={category.label}
          gradient={category.gradient}
          onClick={() => onCategoryClick(category.query)}
        />
      ))}
    </div>
  );
};

export default CategoryTiles;
