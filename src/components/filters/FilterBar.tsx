
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, Calendar as CalendarIcon, List } from "lucide-react";

const categories = [
  { icon: <Calendar className="h-5 w-5" />, label: "Summer Camps" },
  { icon: <User className="h-5 w-5" />, label: "Sports" },
  { icon: <CalendarIcon className="h-5 w-5" />, label: "Arts & Crafts" },
  { icon: <List className="h-5 w-5" />, label: "STEM" },
  { icon: <MapPin className="h-5 w-5" />, label: "Outdoor Adventure" },
];

interface FilterBarProps {
  onFilterChange?: (filter: string) => void;
  activeFilter?: string;
}

const FilterBar = ({ onFilterChange, activeFilter }: FilterBarProps) => {
  return (
    <div className="border-b sticky top-16 bg-white z-40">
      <div className="container mx-auto py-4">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2 hide-scrollbar">
          {categories.map((category) => (
            <Button
              key={category.label}
              variant={activeFilter === category.label ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap"
              onClick={() => onFilterChange && onFilterChange(category.label)}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full whitespace-nowrap"
          >
            <span className="mr-2">Filters</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
