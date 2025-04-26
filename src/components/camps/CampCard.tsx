
import React from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface CampCardProps {
  id: string;
  title: string;
  image: string;
  location: string;
  price: number;
  priceUnit: string;
  rating: number;
  reviewCount: number;
  dates: string;
  availability: string;
  type: "camp" | "activity";
  distance?: string;
  age?: string;
}

const CampCard = ({
  id,
  title,
  image,
  location,
  price,
  priceUnit,
  rating,
  reviewCount,
  dates,
  availability,
  type,
  distance,
  age,
}: CampCardProps) => {
  return (
    <Link to={`/${type}/${id}`} className="block">
      <div className="rounded-xl overflow-hidden shadow-sm border card-hover">
        {/* Card Image */}
        <div className="relative aspect-[4/3]">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          {age && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-white/90 text-camps-dark shadow-sm">
                Ages {age}
              </Badge>
            </div>
          )}
          {availability.includes("spots") && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-camps-primary text-white shadow-sm">
                {availability}
              </Badge>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5" />
              <span>{location}</span>
              {distance && <span className="opacity-70">· {distance}</span>}
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-current text-camps-accent mr-1" />
              <span className="font-medium">{rating}</span>
              <span className="text-gray-500 text-sm ml-1">({reviewCount})</span>
            </div>
          </div>

          <h3 className="font-medium text-lg mb-1 text-camps-dark">{title}</h3>

          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{dates}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-camps-dark">${price}</span>
              <span className="text-gray-600">/{priceUnit}</span>
            </div>
            {availability && !availability.includes("spots") && (
              <Badge variant="outline" className="text-camps-secondary border-camps-secondary">
                {availability}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CampCard;
